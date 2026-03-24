import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";
import { formatBibleForPrompt } from "../../lib/prompts/bible";
import {
  BibleSectionType,
  BibleSectionContent,
  BibleSection,
  StoryBible,
} from "../../types/bible";

const ALL_SECTION_TYPES: BibleSectionType[] = [
  "characters",
  "world",
  "synopsis",
  "genre",
  "style_guide",
  "outline",
  "notes",
];

export interface CraftContext {
  selectedText: string;
  context: string;
  direction: string;
  bibleContext: string;
}

export interface CraftContextError {
  error: NextResponse;
}

export async function authenticateAndFetchBible(
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
  const { storyId, selectedText, context = "", direction = "" } = body as {
    storyId: string;
    selectedText: string;
    context?: string;
    direction?: string;
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

  // Fetch Bible sections
  const { data, error: bibleError } = await supabase
    .from("bible_sections")
    .select("*")
    .eq("story_id", storyId);

  let bibleContext = "";

  if (!bibleError && data && data.length > 0) {
    const sections = Object.fromEntries(
      ALL_SECTION_TYPES.map((t) => [t, null])
    ) as Record<BibleSectionType, BibleSection | null>;

    for (const row of data) {
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

  return { selectedText, context, direction, bibleContext };
}
