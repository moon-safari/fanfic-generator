import { NextRequest, NextResponse } from "next/server";
import { insertCodexProgression } from "../../../../../../lib/supabase/codex";
import {
  authenticateCodexStory,
  getCodexEntryRecord,
  isRouteError,
  isUniqueViolation,
  parseFieldOverrides,
} from "../../../../shared";
import type { CreateCodexProgressionInput } from "../../../../../../types/codex";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string; entryId: string }> }
) {
  try {
    const { storyId, entryId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const entry = await getCodexEntryRecord(auth.supabase, storyId, entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const chapterNumber =
      typeof body.chapterNumber === "number" ? body.chapterNumber : NaN;

    if (!Number.isInteger(chapterNumber) || chapterNumber <= 0) {
      return NextResponse.json(
        { error: "chapterNumber must be a positive integer" },
        { status: 400 }
      );
    }

    const fieldOverrides =
      body.fieldOverrides === undefined
        ? {}
        : parseFieldOverrides(body.fieldOverrides);
    if (fieldOverrides === null) {
      return NextResponse.json(
        { error: "fieldOverrides must be an object of string values" },
        { status: 400 }
      );
    }

    if (
      body.descriptionOverride !== undefined &&
      body.descriptionOverride !== null &&
      typeof body.descriptionOverride !== "string"
    ) {
      return NextResponse.json(
        { error: "descriptionOverride must be a string or null" },
        { status: 400 }
      );
    }

    if (
      body.notes !== undefined &&
      body.notes !== null &&
      typeof body.notes !== "string"
    ) {
      return NextResponse.json(
        { error: "notes must be a string or null" },
        { status: 400 }
      );
    }

    const input: CreateCodexProgressionInput = {
      chapterNumber,
      fieldOverrides,
      descriptionOverride:
        typeof body.descriptionOverride === "string" || body.descriptionOverride === null
          ? body.descriptionOverride
          : undefined,
      notes:
        typeof body.notes === "string" || body.notes === null
          ? body.notes
          : undefined,
    };

    const progression = await insertCodexProgression(
      auth.supabase,
      entryId,
      input
    );

    if (!progression) {
      return NextResponse.json(
        { error: "Failed to create progression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progression }, { status: 201 });
  } catch (err) {
    console.error("Codex progression create error:", err);

    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "A progression already exists for that chapter" },
        { status: 409 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to create progression";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
