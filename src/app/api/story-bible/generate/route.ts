import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../../lib/supabase/server";
import { getFandomContext } from "../../../lib/fandoms";
import { buildBibleGenerationPrompt } from "../../../lib/prompts/bible";
import type { ProjectMode, StoryModeConfig } from "../../../types/story";
import { BibleSectionType, BibleSectionContent } from "../../../types/bible";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ALL_SECTION_TYPES: BibleSectionType[] = [
  "characters",
  "world",
  "synopsis",
  "genre",
  "style_guide",
  "outline",
  "notes",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json({ error: "storyId is required" }, { status: 400 });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, title, fandom, project_mode, mode_config, user_id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Fetch Chapter 1 content
    const { data: chapter1, error: chapterError } = await supabase
      .from("chapters")
      .select("content")
      .eq("story_id", storyId)
      .eq("chapter_number", 1)
      .single();

    if (chapterError || !chapter1) {
      return NextResponse.json({ error: "Chapter 1 not found" }, { status: 404 });
    }

    const projectMode = (story.project_mode as ProjectMode | undefined) ?? "fiction";
    const fandomContext =
      projectMode === "fiction" ? getFandomContext(story.fandom as string) : "";
    const prompt = buildBibleGenerationPrompt(chapter1.content as string, {
      storyTitle: story.title as string,
      fandomContext,
      projectMode,
      modeConfig: (story.mode_config as StoryModeConfig | undefined) ?? undefined,
    });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse bible JSON" }, { status: 500 });
    }

    let parsedBible: Record<string, BibleSectionContent>;
    try {
      parsedBible = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in bible response" }, { status: 500 });
    }

    // Upsert all 7 sections into story_bibles table
    const now = new Date().toISOString();
    const rows = ALL_SECTION_TYPES
      .filter((sectionType) => parsedBible[sectionType] !== undefined)
      .map((sectionType) => ({
        story_id: storyId,
        section_type: sectionType,
        content: parsedBible[sectionType],
        updated_at: now,
      }));

    const { error: upsertError } = await supabase
      .from("story_bibles")
      .upsert(rows, { onConflict: "story_id,section_type" });

    if (upsertError) {
      console.error("Bible upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save bible" }, { status: 500 });
    }

    return NextResponse.json({ success: true, sections: parsedBible }, { status: 200 });
  } catch (err) {
    console.error("Bible generation error:", err);
    const message = err instanceof Error ? err.message : "Bible generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
