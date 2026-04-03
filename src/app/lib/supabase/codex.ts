import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import {
  Codex,
  CodexContextRule,
  CodexContextRuleMode,
  CodexCustomField,
  CodexCustomType,
  CodexEntry,
  CodexProgression,
  CodexRelationship,
  CodexSuggestedField,
  CreateCodexCustomTypeInput,
  CreateCodexEntryInput,
  CreateCodexProgressionInput,
  CreateCodexRelationshipInput,
  UpdateCodexEntryInput,
  UpdateCodexProgressionInput,
} from "../../types/codex";

type DbCodexEntryRow = {
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

type DbCodexRelationshipRow = {
  id: string;
  story_id: string;
  source_entry_id: string;
  target_entry_id: string;
  forward_label: string;
  reverse_label: string;
  created_at: string;
};

type DbCodexProgressionRow = {
  id: string;
  entry_id: string;
  chapter_number: number;
  field_overrides: unknown;
  description_override: string | null;
  notes: string | null;
  created_at: string;
};

type DbCodexCustomTypeRow = {
  id: string;
  story_id: string;
  name: string;
  color: string;
  icon: string;
  suggested_fields: unknown;
  created_at: string;
  updated_at: string;
};

type DbCodexContextRuleRow = {
  id: string;
  story_id: string;
  entry_id: string;
  mode: CodexContextRuleMode;
  created_at: string;
  updated_at: string;
};

export async function getCodexFromDB(storyId: string): Promise<Codex> {
  const supabase = createClient();
  return fetchCodexData(supabase, storyId);
}

export async function createCodexEntryInDB(
  storyId: string,
  input: CreateCodexEntryInput
): Promise<CodexEntry | null> {
  const supabase = createClient();
  return insertCodexEntry(supabase, storyId, input);
}

export async function updateCodexEntryInDB(
  storyId: string,
  entryId: string,
  updates: UpdateCodexEntryInput
): Promise<CodexEntry | null> {
  const supabase = createClient();
  return updateCodexEntry(supabase, storyId, entryId, updates);
}

export async function deleteCodexEntryInDB(
  storyId: string,
  entryId: string
): Promise<boolean> {
  const supabase = createClient();
  return deleteCodexEntry(supabase, storyId, entryId);
}

export async function createCodexRelationshipInDB(
  storyId: string,
  input: CreateCodexRelationshipInput
): Promise<CodexRelationship | null> {
  const supabase = createClient();
  return insertCodexRelationship(supabase, storyId, input);
}

export async function deleteCodexRelationshipInDB(
  storyId: string,
  relationshipId: string
): Promise<boolean> {
  const supabase = createClient();
  return deleteCodexRelationship(supabase, storyId, relationshipId);
}

export async function createCodexProgressionInDB(
  entryId: string,
  input: CreateCodexProgressionInput
): Promise<CodexProgression | null> {
  const supabase = createClient();
  return insertCodexProgression(supabase, entryId, input);
}

export async function updateCodexProgressionInDB(
  entryId: string,
  progressionId: string,
  updates: UpdateCodexProgressionInput
): Promise<CodexProgression | null> {
  const supabase = createClient();
  return updateCodexProgression(supabase, entryId, progressionId, updates);
}

export async function deleteCodexProgressionInDB(
  entryId: string,
  progressionId: string
): Promise<boolean> {
  const supabase = createClient();
  return deleteCodexProgression(supabase, entryId, progressionId);
}

export async function createCodexCustomTypeInDB(
  storyId: string,
  input: CreateCodexCustomTypeInput
): Promise<CodexCustomType | null> {
  const supabase = createClient();
  return insertCodexCustomType(supabase, storyId, input);
}

export async function getCodexContextRulesFromDB(
  storyId: string
): Promise<CodexContextRule[]> {
  const supabase = createClient();
  return fetchCodexContextRules(supabase, storyId);
}

export async function fetchCodexData(
  supabase: SupabaseClient,
  storyId: string
): Promise<Codex> {
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

  const entryRows = (entriesData ?? []) as DbCodexEntryRow[];
  const entryIds = entryRows.map((row) => row.id);
  const progressionsByEntryId = await fetchProgressionsByEntryId(supabase, entryIds);

  return {
    entries: entryRows.map((row) =>
      mapCodexEntryRow(row, progressionsByEntryId.get(row.id) ?? [])
    ),
    relationships: ((relationshipsData ?? []) as DbCodexRelationshipRow[]).map(
      mapCodexRelationshipRow
    ),
    customTypes: ((customTypesData ?? []) as DbCodexCustomTypeRow[]).map(
      mapCodexCustomTypeRow
    ),
  };
}

export async function fetchCodexContextRules(
  supabase: SupabaseClient,
  storyId: string
): Promise<CodexContextRule[]> {
  const { data, error } = await supabase
    .from("codex_context_rules")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTableError(error, "codex_context_rules")) {
      return [];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as DbCodexContextRuleRow[]).map(mapCodexContextRuleRow);
}

export async function insertCodexEntry(
  supabase: SupabaseClient,
  storyId: string,
  input: CreateCodexEntryInput
): Promise<CodexEntry | null> {
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
  return mapCodexEntryRow(data as DbCodexEntryRow, []);
}

export async function updateCodexEntry(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string,
  updates: UpdateCodexEntryInput
): Promise<CodexEntry | null> {
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
  return mapCodexEntryRow(data as DbCodexEntryRow, progressions);
}

export async function deleteCodexEntry(
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

export async function insertCodexRelationship(
  supabase: SupabaseClient,
  storyId: string,
  input: CreateCodexRelationshipInput
): Promise<CodexRelationship | null> {
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
  return mapCodexRelationshipRow(data as DbCodexRelationshipRow);
}

export async function deleteCodexRelationship(
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

export async function insertCodexProgression(
  supabase: SupabaseClient,
  entryId: string,
  input: CreateCodexProgressionInput
): Promise<CodexProgression | null> {
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
  return mapCodexProgressionRow(data as DbCodexProgressionRow);
}

export async function updateCodexProgression(
  supabase: SupabaseClient,
  entryId: string,
  progressionId: string,
  updates: UpdateCodexProgressionInput
): Promise<CodexProgression | null> {
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
  return mapCodexProgressionRow(data as DbCodexProgressionRow);
}

export async function deleteCodexProgression(
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

export async function insertCodexCustomType(
  supabase: SupabaseClient,
  storyId: string,
  input: CreateCodexCustomTypeInput
): Promise<CodexCustomType | null> {
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
  return mapCodexCustomTypeRow(data as DbCodexCustomTypeRow);
}

export async function upsertCodexContextRule(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string,
  mode: CodexContextRuleMode
): Promise<CodexContextRule | null> {
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
  return mapCodexContextRuleRow(data as DbCodexContextRuleRow);
}

export async function deleteCodexContextRule(
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
): Promise<CodexProgression[]> {
  const { data, error } = await supabase
    .from("codex_progressions")
    .select("*")
    .eq("entry_id", entryId)
    .order("chapter_number", { ascending: true });

  if (error || !data) return [];
  return (data as DbCodexProgressionRow[]).map(mapCodexProgressionRow);
}

async function fetchProgressionsByEntryId(
  supabase: SupabaseClient,
  entryIds: string[]
): Promise<Map<string, CodexProgression[]>> {
  const map = new Map<string, CodexProgression[]>();

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

  for (const row of data as DbCodexProgressionRow[]) {
    const progression = mapCodexProgressionRow(row);
    const list = map.get(progression.entryId) ?? [];
    list.push(progression);
    map.set(progression.entryId, list);
  }

  return map;
}

export function mapCodexEntryRow(
  row: DbCodexEntryRow,
  progressions: CodexProgression[]
): CodexEntry {
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

export function mapCodexRelationshipRow(
  row: DbCodexRelationshipRow
): CodexRelationship {
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

export function mapCodexProgressionRow(
  row: DbCodexProgressionRow
): CodexProgression {
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

export function mapCodexCustomTypeRow(
  row: DbCodexCustomTypeRow
): CodexCustomType {
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

export function mapCodexContextRuleRow(
  row: DbCodexContextRuleRow
): CodexContextRule {
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

export function normalizeCustomFields(value: unknown): CodexCustomField[] {
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

export function normalizeSuggestedFields(value: unknown): CodexSuggestedField[] {
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
