import { NextRequest, NextResponse } from "next/server";
import {
  deleteCodexContextRule,
  upsertCodexContextRule,
} from "../../../../../lib/supabase/codex";
import {
  authenticateCodexStory,
  getCodexEntryRecord,
  isRouteError,
} from "../../../shared";
import type { CodexContextMode } from "../../../../../types/codex";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ storyId: string; entryId: string }> }
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
    const mode =
      typeof body.mode === "string" ? (body.mode.trim() as CodexContextMode) : null;

    if (mode !== "default" && mode !== "pin" && mode !== "exclude") {
      return NextResponse.json(
        { error: "mode must be one of default, pin, or exclude" },
        { status: 400 }
      );
    }

    if (mode === "default") {
      await deleteCodexContextRule(auth.supabase, storyId, entryId);
      return NextResponse.json({ rule: null }, { status: 200 });
    }

    const rule = await upsertCodexContextRule(
      auth.supabase,
      storyId,
      entryId,
      mode
    );

    return NextResponse.json({ rule }, { status: 200 });
  } catch (error) {
    console.error("Failed to update codex context rule:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update codex context rule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
