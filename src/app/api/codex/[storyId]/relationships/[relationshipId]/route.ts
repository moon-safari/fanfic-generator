import { NextRequest, NextResponse } from "next/server";
import { deleteCodexRelationship } from "../../../../../lib/supabase/codex";
import {
  authenticateCodexStory,
  getCodexRelationshipRecord,
  isRouteError,
} from "../../../shared";

export async function DELETE(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ storyId: string; relationshipId: string }> }
) {
  try {
    const { storyId, relationshipId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const relationship = await getCodexRelationshipRecord(
      auth.supabase,
      storyId,
      relationshipId
    );

    if (!relationship) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }

    const ok = await deleteCodexRelationship(
      auth.supabase,
      storyId,
      relationshipId
    );

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to delete relationship" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Codex relationship delete error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to delete relationship";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
