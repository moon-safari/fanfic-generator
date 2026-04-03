import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";
import { resolvePromptStoryContext } from "../../lib/storyContext";

export interface CraftContext {
  selectedText: string;
  context: string;
  direction: string;
  storyContext: string;
  userId: string;
  storyId: string;
  chapterNumber: number;
}

export interface CraftContextError {
  error: NextResponse;
}

export async function authenticateAndFetchStoryContext(
  req: NextRequest
): Promise<CraftContext | CraftContextError> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const body = await req.json();
  const { storyId, selectedText, context = "", direction = "", chapterNumber = 0 } = body as {
    storyId: string;
    selectedText: string;
    context?: string;
    direction?: string;
    chapterNumber?: number;
  };

  if (!storyId || !selectedText) {
    return {
      error: NextResponse.json(
        { error: "storyId and selectedText are required" },
        { status: 400 }
      ),
    };
  }

  // Verify story ownership
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single();

  if (storyError || !story) {
    return {
      error: NextResponse.json({ error: "Story not found" }, { status: 404 }),
    };
  }

  const { text: storyContext } = await resolvePromptStoryContext(
    supabase,
    storyId,
    Math.max(1, chapterNumber || 1)
  );

  return {
    selectedText,
    context,
    direction,
    storyContext,
    userId: user.id,
    storyId,
    chapterNumber,
  };
}
