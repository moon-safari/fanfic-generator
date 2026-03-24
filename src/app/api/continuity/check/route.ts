import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../../lib/supabase/server";
import { formatBibleForPrompt } from "../../../lib/prompts/bible";
import { buildContinuityCheckPrompt } from "../../../lib/prompts/continuity";
import {
  BibleSectionType,
  BibleSectionContent,
  BibleSection,
  StoryBible,
} from "../../../types/bible";

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
    const { storyId, chapterId } = body as { storyId: string; chapterId: string };

    if (!storyId || !chapterId) {
      return NextResponse.json(
        { error: "storyId and chapterId are required" },
        { status: 400 }
      );
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Fetch chapter content and number
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("id, content, chapter_number")
      .eq("id", chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Fetch Bible sections
    const { data: bibleSectionsData } = await supabase
      .from("story_bibles")
      .select("*")
      .eq("story_id", storyId);

    let bibleContext = "";
    if (bibleSectionsData && bibleSectionsData.length > 0) {
      const sections = Object.fromEntries(
        ALL_SECTION_TYPES.map((t) => [t, null])
      ) as Record<BibleSectionType, BibleSection | null>;

      for (const row of bibleSectionsData) {
        const section: BibleSection = {
          id: row.id as string,
          storyId: row.story_id as string,
          sectionType: row.section_type as BibleSectionType,
          content: row.content as BibleSectionContent,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        };
        sections[section.sectionType] = section;
      }

      const bible: StoryBible = { storyId, sections };
      bibleContext = formatBibleForPrompt(bible);
    }

    // Fetch summaries from previous chapters
    const { data: previousChaptersData } = await supabase
      .from("chapters")
      .select("chapter_number, summary")
      .eq("story_id", storyId)
      .lt("chapter_number", chapter.chapter_number as number)
      .order("chapter_number", { ascending: true });

    const previousSummaries = (previousChaptersData ?? [])
      .filter((c) => c.summary)
      .map((c) => ({
        number: c.chapter_number as number,
        summary: c.summary as string,
      }));

    const prompt = buildContinuityCheckPrompt(
      chapter.content as string,
      chapter.chapter_number as number,
      bibleContext,
      previousSummaries
    );

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let annotations: {
      text: string;
      issue: string;
      sourceChapter: number;
      severity: string;
    }[] = [];

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        annotations = parsed.annotations ?? [];
      } catch {
        annotations = [];
      }
    }

    // Clear old non-dismissed annotations and insert new ones
    const { error: deleteError } = await supabase
      .from("chapter_annotations")
      .delete()
      .eq("chapter_id", chapterId)
      .eq("dismissed", false);

    if (deleteError) {
      console.error("Failed to clear old annotations:", deleteError);
    }

    if (annotations.length > 0) {
      const rows = annotations.map((a) => ({
        chapter_id: chapterId,
        text_match: a.text,
        annotation_type: "continuity",
        message: a.issue,
        source_chapter: a.sourceChapter,
        severity: a.severity,
        dismissed: false,
      }));

      const { error: insertError } = await supabase
        .from("chapter_annotations")
        .insert(rows);

      if (insertError) {
        console.error("Failed to insert annotations:", insertError);
      }
    }

    return NextResponse.json({ annotations }, { status: 200 });
  } catch (err) {
    console.error("Continuity check error:", err);
    const message = err instanceof Error ? err.message : "Continuity check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
