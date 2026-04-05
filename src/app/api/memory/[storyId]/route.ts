import { NextRequest, NextResponse } from "next/server";
import { fetchMemoryData } from "../../../lib/supabase/memory";
import { authenticateMemoryStory, isRouteError } from "../shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const memory = await fetchMemoryData(auth.supabase, storyId);
    return NextResponse.json(memory, { status: 200 });
  } catch (err) {
    console.error("Memory fetch error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch memory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
