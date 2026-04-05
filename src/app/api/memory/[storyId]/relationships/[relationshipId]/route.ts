import { NextRequest, NextResponse } from "next/server";
import { deleteMemoryRelationship } from "../../../../../lib/supabase/memory";
import {
  authenticateMemoryStory,
  getMemoryRelationshipRecord,
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
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const relationship = await getMemoryRelationshipRecord(
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

    const ok = await deleteMemoryRelationship(
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
    console.error("Memory relationship delete error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to delete relationship";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
