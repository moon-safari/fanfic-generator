import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import {
  Memory,
  MemoryContextRule,
  MemoryContextRuleMode,
  MemoryCustomField,
  MemoryCustomType,
  MemoryEntry,
  MemoryProgression,
  MemoryRelationship,
  MemorySuggestedField,
  CreateMemoryCustomTypeInput,
  CreateMemoryEntryInput,
  CreateMemoryProgressionInput,
  CreateMemoryRelationshipInput,
  UpdateMemoryEntryInput,
  UpdateMemoryProgressionInput,
} from "../../types/memory";

type DbMemoryEntryRow = {
  id: string;
  story_id: string;
  name: string;
  entry_type: string;
  description: string;
  tags: string[] | null;
  aliases: string[] | null;
  image_url: string | null;
  color: string | null;
  custom_fields: unknown;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type DbMemoryRelationshipRow = {
  id: string;
  story_id: string;
  source_entry_id: string;
  target_entry_id: string;
  forward_label: string;
  reverse_label: string;
  created_at: string;
};

type DbMemoryProgressionRow = {
  id: string;
  entry_id: string;
  chapter_number: number;
  field_overrides: unknown;
  description_override: string | null;
  notes: string | null;
  created_at: string;
};

type DbMemoryCustomTypeRow = {
  id: string;
  story_id: string;
  name: string;
  color: string;
  icon: string;
  suggested_fields: unknown;
  created_at: string;
  updated_at: string;
};

type DbMemoryContextRuleRow = {
  id: string;
  story_id: string;
  entry_id: string;
  mode: MemoryContextRuleMode;
  created_at: string;
  updated_at: string;
};

export async function getMemoryFromDB(storyId: string): Promise<Memory> {
  const supabase = createClient();
  return fetchMemoryData(supabase, storyId);
}

export async function createMemoryEntryInDB(
  storyId: string,
  input: CreateMemoryEntryInput
): Promise<MemoryEntry | null> {
  const supabase = createClient();
  return insertMemoryEntry(supabase, storyId, input);
}

export async function updateMemoryEntryInDB(
  storyId: string,
  entryId: string,
  updates: UpdateMemoryEntryInput
): Promise<MemoryEntry | null> {
  const supabase = createClient();
  return updateMemoryEntry(supabase, storyId, entryId, updates);
}

export async function deleteMemoryEntryInDB(
  storyId: string,
  entryId: string
): Promise<boolean> {
  const supabase = createClient();
  return deleteMemoryEntry(supabase, storyId, entryId);
}

export async function createMemoryRelationshipInDB(
  storyId: string,
  input: CreateMemoryRelationshipInput
): Promise<MemoryRelationship | null> {
  const supabase = createClient();
  return insertMemoryRelationship(supabase, storyId, input);
}

export async function deleteMemoryRelationshipInDB(
  storyId: string,
  relationshipId: string
): Promise<boolean> {
  const supabase = createClient();
  return deleteMemoryRelationship(supabase, storyId, relationshipId);
}

export async function createMemoryProgressionInDB(
  entryId: string,
  input: CreateMemoryProgressionInput
): Promise<MemoryProgression | null> {
  const supabase = createClient();
  return insertMemoryProgression(supabase, entryId, input);
}

export async function updateMemoryProgressionInDB(
  entryId: string,
  progressionId: string,
  updates: UpdateMemoryProgressionInput
): Promise<MemoryProgression | null> {
  const supabase = createClient();
  return updateMemoryProgression(supabase, entryId, progressionId, updates);
}

export async function deleteMemoryProgressionInDB(
  entryId: string,
  progressionId: string
): Promise<boolean> {
  const supabase = createClient();
  return deleteMemoryProgression(supabase, entryId, progressionId);
}

export async function createMemoryCustomTypeInDB(
  storyId: string,
  input: CreateMemoryCustomTypeInput
): Promise<MemoryCustomType | null> {
  const supabase = createClient();
  return insertMemoryCustomType(supabase, storyId, input);
}

export async function getMemoryContextRulesFromDB(
  storyId: string
): Promise<MemoryContextRule[]> {
  const supabase = createClient();
  return fetchMemoryContextRules(supabase, storyId);
}

export async function fetchMemoryData(
  supabase: SupabaseClient,
  storyId: string
): Promise<Memory> {
  const [{ data: entriesData, error: entriesError }, { data: relationshipsData, error: relationshipsError }, { data: customTypesData, error: customTypesError }] =
    await Promise.all([
      supabase
        .from("codex_entries")
        .select("*")
        .eq("story_id", storyId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("codex_relationships")
        .select("*")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true }),
      supabase
        .from("codex_custom_types")
        .select("*")
        .eq("story_id", storyId)
        .order("name", { ascending: true }),
    ]);

  if (entriesError) {
    throw new Error(entriesError.message);
  }

  if (relationshipsError) {
    throw new Error(relationshipsError.message);
  }

  if (customTypesError) {
    throw new Error(customTypesError.message);
  }

  const entryRows = (entriesData ?? []) as DbMemoryEntryRow[];
  const entryIds = entryRows.map((row) => row.id);
  const progressionsByEntryId = await fetchProgressionsByEntryId(supabase, entryIds);

  return {
    entries: entryRows.map((row) =>
      mapMemoryEntryRow(row, progressionsByEntryId.get(row.id) ?? [])
    ),
    relationships: ((relationshipsData ?? []) as DbMemoryRelationshipRow[]).map(
      mapMemoryRelationshipRow
    ),
    customTypes: ((customTypesData ?? []) as DbMemoryCustomTypeRow[]).map(
      mapMemoryCustomTypeRow
    ),
  };
}

export async function fetchMemoryContextRules(
  supabase: SupabaseClient,
  storyId: string
): Promise<MemoryContextRule[]> {
  const { data, error } = await supabase
    .from("codex_context_rules")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "memory_context_rules")) {
      return [];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as DbMemoryContextRuleRow[]).map(mapMemoryContextRuleRow);
}

export async function insertMemoryEntry(
  supabase: SupabaseClient,
  storyId: string,
  input: CreateMemoryEntryInput
): Promise<MemoryEntry | null> {
  const { data, error } = await supabase
    .from("codex_entries")
    .insert({
      story_id: storyId,
      name: input.name.trim(),
      entry_type: input.entryType,
      description: input.description ?? "",
      tags: normalizeStringArray(input.tags),
      aliases: normalizeStringArray(input.aliases),
      image_url: input.imageUrl ?? null,
      color: input.color ?? null,
      custom_fields: normalizeCustomFields(input.customFields),
      sort_order: input.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapMemoryEntryRow(data as DbMemoryEntryRow, []);
}

export async function updateMemoryEntry(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string,
  updates: UpdateMemoryEntryInput
): Promise<MemoryEntry | null> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.entryType !== undefined) payload.entry_type = updates.entryType;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.tags !== undefined) payload.tags = normalizeStringArray(updates.tags);
  if (updates.aliases !== undefined) payload.aliases = normalizeStringArray(updates.aliases);
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.customFields !== undefined) {
    payload.custom_fields = normalizeCustomFields(updates.customFields);
  }
  if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from("codex_entries")
    .update(payload)
    .eq("id", entryId)
    .eq("story_id", storyId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const progressions = await fetchEntryProgressions(supabase, entryId);
  return mapMemoryEntryRow(data as DbMemoryEntryRow, progressions);
}

export async function deleteMemoryEntry(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("codex_entries")
    .delete()
    .eq("id", entryId)
    .eq("story_id", storyId);

  if (error) {
    throw error;
  }

  return !error;
}

export async function insertMemoryRelationship(
  supabase: SupabaseClient,
  storyId: string,
  input: CreateMemoryRelationshipInput
): Promise<MemoryRelationship | null> {
  const { data, error } = await supabase
    .from("codex_relationships")
    .insert({
      story_id: storyId,
      source_entry_id: input.sourceEntryId,
      target_entry_id: input.targetEntryId,
      forward_label: input.forwardLabel?.trim() ?? "",
      reverse_label: input.reverseLabel?.trim() ?? "",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapMemoryRelationshipRow(data as DbMemoryRelationshipRow);
}

export async function deleteMemoryRelationship(
  supabase: SupabaseClient,
  storyId: string,
  relationshipId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("codex_relationships")
    .delete()
    .eq("id", relationshipId)
    .eq("story_id", storyId);

  if (error) {
    throw error;
  }

  return !error;
}

export async function insertMemoryProgression(
  supabase: SupabaseClient,
  entryId: string,
  input: CreateMemoryProgressionInput
): Promise<MemoryProgression | null> {
  const { data, error } = await supabase
    .from("codex_progressions")
    .insert({
      entry_id: entryId,
      chapter_number: input.chapterNumber,
      field_overrides: input.fieldOverrides ?? {},
      description_override: input.descriptionOverride ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapMemoryProgressionRow(data as DbMemoryProgressionRow);
}

export async function updateMemoryProgression(
  supabase: SupabaseClient,
  entryId: string,
  progressionId: string,
  updates: UpdateMemoryProgressionInput
): Promise<MemoryProgression | null> {
  const payload: Record<string, unknown> = {};

  if (updates.chapterNumber !== undefined) payload.chapter_number = updates.chapterNumber;
  if (updates.fieldOverrides !== undefined) payload.field_overrides = updates.fieldOverrides;
  if (updates.descriptionOverride !== undefined) {
    payload.description_override = updates.descriptionOverride;
  }
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { data, error } = await supabase
    .from("codex_progressions")
    .update(payload)
    .eq("id", progressionId)
    .eq("entry_id", entryId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapMemoryProgressionRow(data as DbMemoryProgressionRow);
}

export async function deleteMemoryProgression(
  supabase: SupabaseClient,
  entryId: string,
  progressionId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("codex_progressions")
    .delete()
    .eq("id", progressionId)
    .eq("entry_id", entryId);

  if (error) {
    throw error;
  }

  return !error;
}

export async function insertMemoryCustomType(
  supabase: SupabaseClient,
  storyId: string,
  input: CreateMemoryCustomTypeInput
): Promise<MemoryCustomType | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("codex_custom_types")
    .insert({
      story_id: storyId,
      name: input.name.trim(),
      color: input.color ?? "#8b5cf6",
      icon: input.icon ?? "book",
      suggested_fields: normalizeSuggestedFields(input.suggestedFields),
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapMemoryCustomTypeRow(data as DbMemoryCustomTypeRow);
}

export async function upsertMemoryContextRule(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string,
  mode: MemoryContextRuleMode
): Promise<MemoryContextRule | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("codex_context_rules")
    .upsert(
      {
        story_id: storyId,
        entry_id: entryId,
        mode,
        updated_at: now,
      },
      {
        onConflict: "story_id,entry_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapMemoryContextRuleRow(data as DbMemoryContextRuleRow);
}

export async function deleteMemoryContextRule(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("codex_context_rules")
    .delete()
    .eq("story_id", storyId)
    .eq("entry_id", entryId);

  if (error) {
    throw error;
  }

  return !error;
}

export async function fetchEntryProgressions(
  supabase: SupabaseClient,
  entryId: string
): Promise<MemoryProgression[]> {
  const { data, error } = await supabase
    .from("codex_progressions")
    .select("*")
    .eq("entry_id", entryId)
    .order("chapter_number", { ascending: true });

  if (error || !data) return [];
  return (data as DbMemoryProgressionRow[]).map(mapMemoryProgressionRow);
}

async function fetchProgressionsByEntryId(
  supabase: SupabaseClient,
  entryIds: string[]
): Promise<Map<string, MemoryProgression[]>> {
  const map = new Map<string, MemoryProgression[]>();

  if (entryIds.length === 0) {
    return map;
  }

  const { data, error } = await supabase
    .from("codex_progressions")
    .select("*")
    .in("entry_id", entryIds)
    .order("chapter_number", { ascending: true });

  if (error || !data) {
    return map;
  }

  for (const row of data as DbMemoryProgressionRow[]) {
    const progression = mapMemoryProgressionRow(row);
    const list = map.get(progression.entryId) ?? [];
    list.push(progression);
    map.set(progression.entryId, list);
  }

  return map;
}

export function mapMemoryEntryRow(
  row: DbMemoryEntryRow,
  progressions: MemoryProgression[]
): MemoryEntry {
  return {
    id: row.id,
    storyId: row.story_id,
    name: row.name,
    entryType: row.entry_type,
    description: row.description ?? "",
    tags: normalizeStringArray(row.tags),
    aliases: normalizeStringArray(row.aliases),
    imageUrl: row.image_url ?? undefined,
    color: row.color ?? undefined,
    customFields: normalizeCustomFields(row.custom_fields),
    sortOrder: row.sort_order ?? 0,
    progressions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMemoryRelationshipRow(
  row: DbMemoryRelationshipRow
): MemoryRelationship {
  return {
    id: row.id,
    storyId: row.story_id,
    sourceEntryId: row.source_entry_id,
    targetEntryId: row.target_entry_id,
    forwardLabel: row.forward_label ?? "",
    reverseLabel: row.reverse_label ?? "",
    createdAt: row.created_at,
  };
}

export function mapMemoryProgressionRow(
  row: DbMemoryProgressionRow
): MemoryProgression {
  return {
    id: row.id,
    entryId: row.entry_id,
    chapterNumber: row.chapter_number,
    fieldOverrides: normalizeFieldOverrides(row.field_overrides),
    descriptionOverride: row.description_override ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapMemoryCustomTypeRow(
  row: DbMemoryCustomTypeRow
): MemoryCustomType {
  return {
    id: row.id,
    storyId: row.story_id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    suggestedFields: normalizeSuggestedFields(row.suggested_fields),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMemoryContextRuleRow(
  row: DbMemoryContextRuleRow
): MemoryContextRule {
  return {
    id: row.id,
    storyId: row.story_id,
    entryId: row.entry_id,
    mode: row.mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeCustomFields(value: unknown): MemoryCustomField[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { key?: unknown; value?: unknown } =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      key: typeof item.key === "string" ? item.key.trim() : "",
      value: typeof item.value === "string" ? item.value.trim() : "",
    }))
    .filter((item) => item.key.length > 0);
}

export function normalizeSuggestedFields(value: unknown): MemorySuggestedField[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { key?: unknown; placeholder?: unknown } =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      key: typeof item.key === "string" ? item.key.trim() : "",
      placeholder:
        typeof item.placeholder === "string" ? item.placeholder.trim() : "",
    }))
    .filter((item) => item.key.length > 0);
}

function normalizeFieldOverrides(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => typeof item === "string")
      .map(([key, item]) => [key, item.trim()])
      .filter(([key]) => key.trim().length > 0)
  );
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
