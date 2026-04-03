import { NextRequest, NextResponse } from "next/server";
import { fetchCodexSuggestions } from "../../../../lib/supabase/codexSuggestions";
import { authenticateCodexStory, isRouteError } from "../../shared";
import type { CodexSuggestionStatus } from "../../../../types/codex";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const auth = await authenticateCodexStory(storyId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const statusParam = req.nextUrl.searchParams.get("status");
    const status = isSuggestionStatus(statusParam) ? statusParam : undefined;
    const suggestions = await fetchCodexSuggestions(auth.supabase, storyId, status);

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (err) {
    console.error("Codex suggestions fetch error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch Codex suggestions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isSuggestionStatus(value: string | null): value is CodexSuggestionStatus {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "applied"
  );
}
