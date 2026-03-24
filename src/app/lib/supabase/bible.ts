import { createClient } from "./client";
import {
  BibleSectionType,
  BibleSectionContent,
  BibleSection,
  StoryBible,
} from "../../types/bible";

const supabase = createClient();

/** Fetch all bible sections for a story, returning a StoryBible */
export async function getStoryBible(storyId: string): Promise<StoryBible> {
  const { data, error } = await supabase
    .from("bible_sections")
    .select("*")
    .eq("story_id", storyId);

  const allTypes: BibleSectionType[] = [
    "characters",
    "world",
    "synopsis",
    "genre",
    "style_guide",
    "outline",
    "notes",
  ];

  const sections = Object.fromEntries(
    allTypes.map((t) => [t, null])
  ) as Record<BibleSectionType, BibleSection | null>;

  if (!error && data) {
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
  }

  return { storyId, sections };
}

/** Upsert a single bible section */
export async function upsertBibleSection(
  storyId: string,
  sectionType: BibleSectionType,
  content: BibleSectionContent
): Promise<BibleSection | null> {
  const { data, error } = await supabase
    .from("bible_sections")
    .upsert(
      {
        story_id: storyId,
        section_type: sectionType,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "story_id,section_type" }
    )
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    storyId: data.story_id as string,
    sectionType: data.section_type as BibleSectionType,
    content: data.content as BibleSectionContent,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/** Upsert multiple bible sections at once */
export async function upsertAllBibleSections(
  storyId: string,
  sections: Partial<Record<BibleSectionType, BibleSectionContent>>
): Promise<boolean> {
  const rows = Object.entries(sections).map(([sectionType, content]) => ({
    story_id: storyId,
    section_type: sectionType as BibleSectionType,
    content,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return true;

  const { error } = await supabase
    .from("bible_sections")
    .upsert(rows, { onConflict: "story_id,section_type" });

  return !error;
}
