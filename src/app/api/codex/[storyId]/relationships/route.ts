import { NextRequest, NextResponse } from "next/server";
import { insertCodexRelationship } from "../../../../lib/supabase/codex";
import {
  authenticateCodexStory,
  isRouteError,
  isUniqueViolation,
} from "../../shared";
import type { CreateCodexRelationshipInput } from "../../../../types/codex";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const body = (await req.json()) as Record<string, unknown>;
    const sourceEntryId =
      typeof body.sourceEntryId === "string" ? body.sourceEntryId : "";
    const targetEntryId =
      typeof body.targetEntryId === "string" ? body.targetEntryId : "";

    if (!sourceEntryId || !targetEntryId) {
      return NextResponse.json(
        { error: "sourceEntryId and targetEntryId are required" },
        { status: 400 }
      );
    }

    if (sourceEntryId === targetEntryId) {
      return NextResponse.json(
        { error: "sourceEntryId and targetEntryId must be different" },
        { status: 400 }
      );
    }

    if (
      body.forwardLabel !== undefined &&
      typeof body.forwardLabel !== "string"
    ) {
      return NextResponse.json(
        { error: "forwardLabel must be a string" },
        { status: 400 }
      );
    }

    if (
      body.reverseLabel !== undefined &&
      typeof body.reverseLabel !== "string"
    ) {
      return NextResponse.json(
        { error: "reverseLabel must be a string" },
        { status: 400 }
      );
    }

    const { data: entries, error } = await auth.supabase
      .from("codex_entries")
      .select("id")
      .eq("story_id", storyId)
      .in("id", [sourceEntryId, targetEntryId]);

    if (error || !entries || entries.length !== 2) {
      return NextResponse.json(
        { error: "Both entries must belong to this story" },
        { status: 400 }
      );
    }

    const input: CreateCodexRelationshipInput = {
      sourceEntryId,
      targetEntryId,
      forwardLabel:
        typeof body.forwardLabel === "string" ? body.forwardLabel : "",
      reverseLabel:
        typeof body.reverseLabel === "string" ? body.reverseLabel : "",
    };

    const relationship = await insertCodexRelationship(
      auth.supabase,
      storyId,
      input
    );

    if (!relationship) {
      return NextResponse.json(
        { error: "Failed to create relationship" },
        { status: 500 }
      );
    }

    return NextResponse.json({ relationship }, { status: 201 });
  } catch (err) {
    console.error("Codex relationship create error:", err);

    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "Relationship already exists" },
        { status: 409 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to create relationship";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
