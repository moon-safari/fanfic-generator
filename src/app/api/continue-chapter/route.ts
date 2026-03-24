import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../lib/supabase/server";
import { buildContinuationPrompt } from "../../lib/prompts";
import { formatBibleForPrompt } from "../../lib/prompts/bible";
import { Story, Chapter } from "../../types/story";
import {
  BibleSectionType,
  BibleSectionContent,
  BibleSection,
  StoryBible,
} from "../../types/bible";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body: { storyId: string } = await req.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "storyId is required" },
        { status: 400 }
      );
    }

    // Auth check
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch story server-side
    const { data, error } = await supabase
      .from("stories")
      .select("*, chapters(id, content, content_json, summary, chapter_number, word_count)")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Build Story object from DB data
    const chapters = (
      data.chapters as Array<{
        id: string;
        content: string;
        content_json?: object;
        summary?: string;
        chapter_number: number;
        word_count: number;
      }>
    )
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((ch): Chapter => ({
        id: ch.id,
        chapterNumber: ch.chapter_number,
        content: ch.content,
        contentJson: ch.content_json || undefined,
        summary: ch.summary || undefined,
        wordCount: ch.word_count,
      }));

    const story: Story = {
      id: data.id as string,
      title: data.title as string,
      chapters,
      fandom: data.fandom as string,
      customFandom: (data.custom_fandom as string) || undefined,
      characters: data.characters as string[],
      relationshipType: data.relationship_type as Story["relationshipType"],
      rating: data.rating as Story["rating"],
      setting: (data.setting as string) || undefined,
      tone: data.tone as string[],
      tropes: data.tropes as string[],
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      wordCount: data.word_count as number,
    };

    if (!story.chapters || story.chapters.length === 0) {
      return NextResponse.json(
        { error: "Story with at least one chapter is required" },
        { status: 400 }
      );
    }

    const chapterNum = story.chapters.length + 1;

    // Fetch Bible sections for smart context
    const { data: bibleSectionsData } = await supabase
      .from("story_bibles")
      .select("*")
      .eq("story_id", storyId);

    let bibleContext = "";
    if (bibleSectionsData && bibleSectionsData.length > 0) {
      const ALL_SECTION_TYPES: BibleSectionType[] = [
        "characters",
        "world",
        "synopsis",
        "genre",
        "style_guide",
        "outline",
        "notes",
      ];
      const sections = Object.fromEntries(
        ALL_SECTION_TYPES.map((t) => [t, null])
      ) as Record<BibleSectionType, BibleSection | null>;

      for (const row of bibleSectionsData) {
        sections[row.section_type as BibleSectionType] = {
          id: row.id as string,
          storyId: row.story_id as string,
          sectionType: row.section_type as BibleSectionType,
          content: row.content as BibleSectionContent,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        };
      }

      const bible: StoryBible = { storyId, sections };
      bibleContext = formatBibleForPrompt(bible);
    }

    const prompt = buildContinuationPrompt(story, chapterNum, bibleContext);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const chapter =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return NextResponse.json({ chapter }, { status: 200 });
  } catch (err) {
    console.error("Continue chapter error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
