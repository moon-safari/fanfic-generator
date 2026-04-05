import { NextRequest, NextResponse } from "next/server";
import {
  deleteMemoryContextRule,
  upsertMemoryContextRule,
} from "../../../../../lib/supabase/memory";
import {
  authenticateMemoryStory,
  getMemoryEntryRecord,
  isRouteError,
} from "../../../shared";
import type { MemoryContextMode } from "../../../../../types/memory";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ storyId: string; entryId: string }> }
) {
  try {
    const { storyId, entryId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const entry = await getMemoryEntryRecord(auth.supabase, storyId, entryId);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const mode =
      typeof body.mode === "string" ? (body.mode.trim() as MemoryContextMode) : null;

    if (mode !== "default" && mode !== "pin" && mode !== "exclude") {
      return NextResponse.json(
        { error: "mode must be one of default, pin, or exclude" },
        { status: 400 }
      );
    }

    if (mode === "default") {
      await deleteMemoryContextRule(auth.supabase, storyId, entryId);
      return NextResponse.json({ rule: null }, { status: 200 });
    }

    const rule = await upsertMemoryContextRule(
      auth.supabase,
      storyId,
      entryId,
      mode
    );

    return NextResponse.json({ rule }, { status: 200 });
  } catch (error) {
    console.error("Failed to update memory context rule:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update memory context rule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
