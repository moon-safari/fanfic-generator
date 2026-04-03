import { NextRequest, NextResponse } from "next/server";
import { fetchCodexData } from "../../../lib/supabase/codex";
import { authenticateCodexStory, isRouteError } from "../shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const codex = await fetchCodexData(auth.supabase, storyId);
    return NextResponse.json(codex, { status: 200 });
  } catch (err) {
    console.error("Codex fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch codex";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
