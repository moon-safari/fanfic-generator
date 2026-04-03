import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../../types/adaptation";
import type { StoryContextSource } from "../../types/codex";

type DbAdaptationOutputRow = {
  id: string;
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  output_type: AdaptationOutputType;
  content: string;
  context_source: StoryContextSource;
  created_at: string;
  updated_at: string;
};

export async function fetchAdaptationOutputs(
  supabase: SupabaseClient,
  storyId: string,
  chapterId: string
): Promise<ChapterAdaptationResult[]> {
  const { data, error } = await supabase
    .from("adaptation_outputs")
    .select("*")
    .eq("story_id", storyId)
    .eq("chapter_id", chapterId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error, "adaptation_outputs")) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as DbAdaptationOutputRow[]).map(mapAdaptationOutputRow);
}

export async function fetchAdaptationOutputsForStory(
  supabase: SupabaseClient,
  storyId: string
): Promise<ChapterAdaptationResult[]> {
  const { data, error } = await supabase
    .from("adaptation_outputs")
    .select("*")
    .eq("story_id", storyId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error, "adaptation_outputs")) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as DbAdaptationOutputRow[]).map(mapAdaptationOutputRow);
}

export async function upsertAdaptationOutput(
  supabase: SupabaseClient,
  input: {
    storyId: string;
    chapterId: string;
    chapterNumber: number;
    outputType: AdaptationOutputType;
    content: string;
    contextSource: StoryContextSource;
  }
): Promise<ChapterAdaptationResult | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("adaptation_outputs")
    .upsert(
      {
        story_id: input.storyId,
        chapter_id: input.chapterId,
        chapter_number: input.chapterNumber,
        output_type: input.outputType,
        content: input.content,
        context_source: input.contextSource,
        updated_at: now,
      },
      {
        onConflict: "story_id,chapter_id,output_type",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapAdaptationOutputRow(data as DbAdaptationOutputRow);
}

export async function deleteAdaptationOutput(
  supabase: SupabaseClient,
  storyId: string,
  chapterId: string,
  outputType: AdaptationOutputType
): Promise<boolean> {
  const { error } = await supabase
    .from("adaptation_outputs")
    .delete()
    .eq("story_id", storyId)
    .eq("chapter_id", chapterId)
    .eq("output_type", outputType);

  if (error) {
    if (isMissingTableError(error, "adaptation_outputs")) {
      return false;
    }

    throw error;
  }

  return true;
}

function mapAdaptationOutputRow(
  row: DbAdaptationOutputRow
): ChapterAdaptationResult {
  return {
    id: row.id,
    storyId: row.story_id,
    outputType: row.output_type,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number,
    content: row.content,
    contextSource: row.context_source,
    generatedAt: row.created_at,
    updatedAt: row.updated_at,
    persisted: true,
  };
}

function isMissingTableError(
  error: { code?: string; message?: string },
  tableName: string
): boolean {
  return (
    error.code === "42P01"
    || (
      typeof error.message === "string"
      && error.message.includes(tableName)
      && error.message.includes("does not exist")
    )
  );
}
