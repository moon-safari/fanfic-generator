import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { MemoryMention } from "../../types/memory";

type DbMemoryMentionRow = {
  id: string;
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  entry_id: string;
  matched_text: string;
  matched_alias: string | null;
  start_index: number;
  end_index: number;
  created_at: string;
};

type MemoryMentionFilters = {
  chapterId?: string;
  chapterNumber?: number;
  entryId?: string;
};

type MemoryMentionInsertInput = {
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  entry_id: string;
  matched_text: string;
  matched_alias?: string | null;
  start_index: number;
  end_index: number;
};

export async function getMemoryMentionsFromDB(
  storyId: string,
  filters: MemoryMentionFilters = {}
): Promise<MemoryMention[]> {
  const supabase = createClient();
  return fetchMemoryMentions(supabase, storyId, filters);
}

export async function fetchMemoryMentions(
  supabase: SupabaseClient,
  storyId: string,
  filters: MemoryMentionFilters = {}
): Promise<MemoryMention[]> {
  let query = supabase
    .from("codex_mentions")
    .select("*")
    .eq("story_id", storyId)
    .order("chapter_number", { ascending: true })
    .order("start_index", { ascending: true });

  if (filters.chapterId) {
    query = query.eq("chapter_id", filters.chapterId);
  }

  if (filters.chapterNumber !== undefined) {
    query = query.eq("chapter_number", filters.chapterNumber);
  }

  if (filters.entryId) {
    query = query.eq("entry_id", filters.entryId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return ((data ?? []) as DbMemoryMentionRow[]).map(mapMemoryMentionRow);
}

export async function replaceMemoryMentionsForChapter(
  supabase: SupabaseClient,
  storyId: string,
  chapterId: string,
  mentions: MemoryMentionInsertInput[]
): Promise<MemoryMention[]> {
  const { error: deleteError } = await supabase
    .from("codex_mentions")
    .delete()
    .eq("story_id", storyId)
    .eq("chapter_id", chapterId);

  if (deleteError) {
    throw deleteError;
  }

  if (mentions.length === 0) {
    return [];
  }

  return insertMemoryMentions(supabase, mentions);
}

export async function insertMemoryMentions(
  supabase: SupabaseClient,
  mentions: MemoryMentionInsertInput[]
): Promise<MemoryMention[]> {
  if (mentions.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("codex_mentions")
    .insert(
      mentions.map((mention) => ({
        ...mention,
        matched_alias: mention.matched_alias ?? null,
      }))
    )
    .select("*");

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbMemoryMentionRow[]).map(mapMemoryMentionRow);
}

function mapMemoryMentionRow(row: DbMemoryMentionRow): MemoryMention {
  return {
    id: row.id,
    storyId: row.story_id,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number,
    entryId: row.entry_id,
    matchedText: row.matched_text,
    matchedAlias: row.matched_alias ?? undefined,
    startIndex: row.start_index,
    endIndex: row.end_index,
    createdAt: row.created_at,
  };
}
