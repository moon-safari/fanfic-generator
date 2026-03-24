import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../../../lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch chapter content, verify ownership via story join
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, content, story_id")
      .eq("id", chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id")
      .eq("id", chapter.story_id as string)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompt = `Summarize this chapter in exactly 2 sentences. Focus on key events, character actions, and plot developments.

CHAPTER:
${chapter.content as string}

Output ONLY the 2-sentence summary. No labels, no headers.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Save summary to chapters table
    const { error: updateError } = await supabase
      .from("chapters")
      .update({ summary, updated_at: new Date().toISOString() })
      .eq("id", chapterId);

    if (updateError) {
      console.error("Failed to save summary:", updateError);
      return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
    }

    return NextResponse.json({ summary }, { status: 200 });
  } catch (err) {
    console.error("Summary generation error:", err);
    const message = err instanceof Error ? err.message : "Summary generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
