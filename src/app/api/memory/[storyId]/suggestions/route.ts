import { NextRequest, NextResponse } from "next/server";
import { fetchMemorySuggestions } from "../../../../lib/supabase/memorySuggestions";
import { authenticateMemoryStory, isRouteError } from "../../shared";
import type { MemorySuggestionStatus } from "../../../../types/memory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateMemoryStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const statusParam = req.nextUrl.searchParams.get("status");
    const status = isSuggestionStatus(statusParam) ? statusParam : undefined;
    const suggestions = await fetchMemorySuggestions(auth.supabase, storyId, status);

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (err) {
    console.error("Memory suggestions fetch error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch Memory suggestions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isSuggestionStatus(value: string | null): value is MemorySuggestionStatus {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "applied"
  );
}
