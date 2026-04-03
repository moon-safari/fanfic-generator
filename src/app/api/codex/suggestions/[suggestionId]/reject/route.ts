import { NextRequest, NextResponse } from "next/server";
import { updateCodexSuggestionStatus } from "../../../../../lib/supabase/codexSuggestions";
import {
  authenticateCodexSuggestion,
  isRouteError,
} from "../../../shared";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { suggestionId } = await params;
    const auth = await authenticateCodexSuggestion(suggestionId, "id, story_id, status");

    if (isRouteError(auth)) {
      return auth.error;
    }

    const status =
      typeof auth.suggestion.status === "string" ? auth.suggestion.status : "";

    if (status !== "pending") {
      return NextResponse.json(
        { error: "Only pending suggestions can be rejected" },
        { status: 400 }
      );
    }

    const suggestion = await updateCodexSuggestionStatus(
      auth.supabase,
      suggestionId,
      "rejected",
      {
        reviewedAt: new Date().toISOString(),
      }
    );

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (err) {
    console.error("Codex suggestion reject error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to reject suggestion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
