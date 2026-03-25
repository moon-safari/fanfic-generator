import { createClient } from "./client";
import { Story, Chapter, RelationshipType, Rating } from "../../types/story";

const supabase = createClient();

export interface CreateStoryInput {
  title: string;
  firstChapterContent?: string;
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
  wordCount?: number;
}

/** Fetch all stories for the current user, with chapters inlined */
export async function getStoriesFromDB(): Promise<Story[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: stories, error } = await supabase
    .from("stories")
    .select("*, chapters(id, content, content_json, summary, chapter_number, word_count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !stories) return [];

  return stories.map(dbToStory);
}

/** Fetch a single story by ID */
export async function getStoryFromDB(id: string): Promise<Story | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("*, chapters(id, content, content_json, summary, chapter_number, word_count)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return dbToStory(data);
}

/** Create a new story with its first chapter */
export async function createStoryInDB(
  input: CreateStoryInput
): Promise<Story | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: dbStory, error: storyError } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      title: input.title,
      fandom: input.fandom,
      custom_fandom: input.customFandom || null,
      characters: input.characters,
      relationship_type: input.relationshipType,
      rating: input.rating,
      setting: input.setting || null,
      tone: input.tone,
      tropes: input.tropes,
      word_count: input.wordCount ?? 0,
    })
    .select()
    .single();

  if (storyError || !dbStory) return null;

  // Insert first chapter
  const chapterContent = input.firstChapterContent || " ";
  const { error: chapError } = await supabase
    .from("chapters")
    .insert({
      story_id: dbStory.id,
      chapter_number: 1,
      content: chapterContent,
      word_count: chapterContent.trim() ? chapterContent.split(/\s+/).length : 0,
    });

  if (chapError) return null;

  // Return the full story
  return getStoryFromDB(dbStory.id);
}

/** Add a new chapter to an existing story */
export async function addChapterToDB(
  storyId: string,
  chapterNumber: number,
  content: string
): Promise<Story | null> {
  const wordCount = content.split(/\s+/).length;

  const { error: chapError } = await supabase.from("chapters").insert({
    story_id: storyId,
    chapter_number: chapterNumber,
    content,
    word_count: wordCount,
  });

  if (chapError) return null;

  // Update story word count and timestamp
  const story = await getStoryFromDB(storyId);
  if (!story) return null;

  const totalWords = story.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  await supabase
    .from("stories")
    .update({ word_count: totalWords, updated_at: new Date().toISOString() })
    .eq("id", storyId);

  return getStoryFromDB(storyId);
}

/** Update a story's title */
export async function updateStoryTitle(
  storyId: string,
  title: string
): Promise<boolean> {
  const { error } = await supabase
    .from("stories")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", storyId);
  return !error;
}

/** Update a chapter's content and word count */
export async function updateChapterContent(
  chapterId: string,
  content: string
): Promise<boolean> {
  const wordCount = content.trim() ? content.split(/\s+/).length : 0;
  const { error } = await supabase
    .from("chapters")
    .update({ content, word_count: wordCount })
    .eq("id", chapterId);
  return !error;
}

/** Delete a story */
export async function deleteStoryFromDB(id: string): Promise<boolean> {
  const { error } = await supabase.from("stories").delete().eq("id", id);
  return !error;
}

/** Convert DB row to Story type */
function dbToStory(row: Record<string, unknown>): Story {
  const chapters = (
    row.chapters as Array<{
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

  return {
    id: row.id as string,
    title: row.title as string,
    chapters,
    fandom: row.fandom as string,
    customFandom: (row.custom_fandom as string) || undefined,
    characters: row.characters as string[],
    relationshipType: row.relationship_type as Story["relationshipType"],
    rating: row.rating as Story["rating"],
    setting: (row.setting as string) || undefined,
    tone: row.tone as string[],
    tropes: row.tropes as string[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    wordCount: row.word_count as number,
  };
}
