import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { CodexMention } from "../../types/codex";

type DbCodexMentionRow = {
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

type CodexMentionFilters = {
  chapterId?: string;
  chapterNumber?: number;
  entryId?: string;
};

type CodexMentionInsertInput = {
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  entry_id: string;
  matched_text: string;
  matched_alias?: string | null;
  start_index: number;
  end_index: number;
};

export async function getCodexMentionsFromDB(
  storyId: string,
  filters: CodexMentionFilters = {}
): Promise<CodexMention[]> {
  const supabase = createClient();
  return fetchCodexMentions(supabase, storyId, filters);
}

export async function fetchCodexMentions(
  supabase: SupabaseClient,
  storyId: string,
  filters: CodexMentionFilters = {}
): Promise<CodexMention[]> {
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

  return ((data ?? []) as DbCodexMentionRow[]).map(mapCodexMentionRow);
}

export async function replaceCodexMentionsForChapter(
  supabase: SupabaseClient,
  storyId: string,
  chapterId: string,
  mentions: CodexMentionInsertInput[]
): Promise<CodexMention[]> {
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

  return insertCodexMentions(supabase, mentions);
}

export async function insertCodexMentions(
  supabase: SupabaseClient,
  mentions: CodexMentionInsertInput[]
): Promise<CodexMention[]> {
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

  return ((data ?? []) as DbCodexMentionRow[]).map(mapCodexMentionRow);
}

function mapCodexMentionRow(row: DbCodexMentionRow): CodexMention {
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
