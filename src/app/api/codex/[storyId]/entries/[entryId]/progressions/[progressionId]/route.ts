import { NextRequest, NextResponse } from "next/server";
import {
  deleteCodexProgression,
  updateCodexProgression,
} from "../../../../../../../lib/supabase/codex";
import {
  authenticateCodexStory,
  getCodexEntryRecord,
  getCodexProgressionRecord,
  isRouteError,
  isUniqueViolation,
  parseFieldOverrides,
} from "../../../../../shared";
import type { UpdateCodexProgressionInput } from "../../../../../../../types/codex";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      storyId: string;
      entryId: string;
      progressionId: string;
    }>;
  }
) {
  try {
    const { storyId, entryId, progressionId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const entry = await getCodexEntryRecord(auth.supabase, storyId, entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const progression = await getCodexProgressionRecord(
      auth.supabase,
      entryId,
      progressionId
    );
    if (!progression) {
      return NextResponse.json(
        { error: "Progression not found" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const updates: UpdateCodexProgressionInput = {};

    if ("chapterNumber" in body) {
      if (
        typeof body.chapterNumber !== "number" ||
        !Number.isInteger(body.chapterNumber) ||
        body.chapterNumber <= 0
      ) {
        return NextResponse.json(
          { error: "chapterNumber must be a positive integer" },
          { status: 400 }
        );
      }
      updates.chapterNumber = body.chapterNumber;
    }

    if ("fieldOverrides" in body) {
      const fieldOverrides = parseFieldOverrides(body.fieldOverrides);
      if (fieldOverrides === null) {
        return NextResponse.json(
          { error: "fieldOverrides must be an object of string values" },
          { status: 400 }
        );
      }
      updates.fieldOverrides = fieldOverrides;
    }

    if ("descriptionOverride" in body) {
      if (
        body.descriptionOverride !== null &&
        typeof body.descriptionOverride !== "string"
      ) {
        return NextResponse.json(
          { error: "descriptionOverride must be a string or null" },
          { status: 400 }
        );
      }
      updates.descriptionOverride = body.descriptionOverride as string | null;
    }

    if ("notes" in body) {
      if (body.notes !== null && typeof body.notes !== "string") {
        return NextResponse.json(
          { error: "notes must be a string or null" },
          { status: 400 }
        );
      }
      updates.notes = body.notes as string | null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const updated = await updateCodexProgression(
      auth.supabase,
      entryId,
      progressionId,
      updates
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update progression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progression: updated }, { status: 200 });
  } catch (err) {
    console.error("Codex progression update error:", err);

    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "A progression already exists for that chapter" },
        { status: 409 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to update progression";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      storyId: string;
      entryId: string;
      progressionId: string;
    }>;
  }
) {
  try {
    const { storyId, entryId, progressionId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const entry = await getCodexEntryRecord(auth.supabase, storyId, entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const progression = await getCodexProgressionRecord(
      auth.supabase,
      entryId,
      progressionId
    );
    if (!progression) {
      return NextResponse.json(
        { error: "Progression not found" },
        { status: 404 }
      );
    }

    const ok = await deleteCodexProgression(
      auth.supabase,
      entryId,
      progressionId
    );

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to delete progression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Codex progression delete error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to delete progression";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
