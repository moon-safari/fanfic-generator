import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeCustomFields,
  normalizeStringArray,
} from "./codex";
import type {
  CodexChangeSuggestion,
  CodexChangeSuggestionPayload,
  CodexChangeType,
  CodexSuggestionConfidence,
  CodexSuggestionStatus,
  CreateEntrySuggestionPayload,
  CreateProgressionSuggestionPayload,
  CreateRelationshipSuggestionPayload,
  FlagStaleEntrySuggestionPayload,
  UpdateEntryAliasesSuggestionPayload,
} from "../../types/codex";

type DbCodexChangeSuggestionRow = {
  id: string;
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  target_entry_id: string | null;
  change_type: string;
  payload: unknown;
  evidence_text: string | null;
  rationale: string | null;
  confidence: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  applied_at: string | null;
};

export async function fetchCodexSuggestions(
  supabase: SupabaseClient,
  storyId: string,
  status?: CodexSuggestionStatus
): Promise<CodexChangeSuggestion[]> {
  let query = supabase
    .from("codex_change_suggestions")
    .select("*")
    .eq("story_id", storyId)
    .order("chapter_number", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbCodexChangeSuggestionRow[])
    .map(mapCodexChangeSuggestionRow)
    .filter((suggestion): suggestion is CodexChangeSuggestion => suggestion !== null);
}

export async function insertCodexChangeSuggestions(
  supabase: SupabaseClient,
  rows: Record<string, unknown>[]
): Promise<CodexChangeSuggestion[]> {
  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("codex_change_suggestions")
    .insert(rows)
    .select("*");

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbCodexChangeSuggestionRow[])
    .map(mapCodexChangeSuggestionRow)
    .filter((suggestion): suggestion is CodexChangeSuggestion => suggestion !== null);
}

export async function clearPendingCodexSuggestionsForChapter(
  supabase: SupabaseClient,
  chapterId: string
): Promise<void> {
  const { error } = await supabase
    .from("codex_change_suggestions")
    .delete()
    .eq("chapter_id", chapterId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

export async function updateCodexSuggestionStatus(
  supabase: SupabaseClient,
  suggestionId: string,
  status: CodexSuggestionStatus,
  options?: {
    reviewedAt?: string | null;
    appliedAt?: string | null;
    extraFields?: Record<string, unknown>;
  }
): Promise<CodexChangeSuggestion | null> {
  const payload: Record<string, unknown> = {
    status,
    ...(options?.extraFields ?? {}),
  };

  if (options?.reviewedAt !== undefined) {
    payload.reviewed_at = options.reviewedAt;
  }

  if (options?.appliedAt !== undefined) {
    payload.applied_at = options.appliedAt;
  }

  const { data, error } = await supabase
    .from("codex_change_suggestions")
    .update(payload)
    .eq("id", suggestionId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapCodexChangeSuggestionRow(data as DbCodexChangeSuggestionRow);
}

export function mapCodexChangeSuggestionRow(
  row: DbCodexChangeSuggestionRow
): CodexChangeSuggestion | null {
  if (!isCodexChangeType(row.change_type)) {
    return null;
  }

  const payload = normalizeSuggestionPayload(row.change_type, row.payload);
  if (!payload) {
    return null;
  }

  return {
    id: row.id,
    storyId: row.story_id,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number,
    targetEntryId: row.target_entry_id ?? undefined,
    changeType: row.change_type,
    payload,
    evidenceText: row.evidence_text ?? undefined,
    rationale: row.rationale ?? undefined,
    confidence: normalizeConfidence(row.confidence),
    status: normalizeStatus(row.status),
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    appliedAt: row.applied_at ?? undefined,
  };
}

function normalizeSuggestionPayload(
  changeType: CodexChangeType,
  value: unknown
): CodexChangeSuggestionPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  switch (changeType) {
    case "create_entry":
      return normalizeCreateEntryPayload(value);
    case "update_entry_aliases":
      return normalizeAliasPayload(value);
    case "create_relationship":
      return normalizeRelationshipPayload(value);
    case "create_progression":
      return normalizeProgressionPayload(value);
    case "flag_stale_entry":
      return normalizeStaleEntryPayload(value);
    default:
      return null;
  }
}

function normalizeCreateEntryPayload(
  value: Record<string, unknown>
): CreateEntrySuggestionPayload | null {
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const entryType =
    typeof value.entryType === "string" ? value.entryType.trim() : "";

  if (!name || !entryType) {
    return null;
  }

  return {
    name,
    entryType,
    description:
      typeof value.description === "string" ? value.description.trim() : "",
    aliases: normalizeStringArray(value.aliases),
    tags: normalizeStringArray(value.tags),
    imageUrl:
      typeof value.imageUrl === "string" ? value.imageUrl.trim() : undefined,
    color: typeof value.color === "string" ? value.color.trim() : undefined,
    customFields: normalizeCustomFields(value.customFields),
    sortOrder:
      typeof value.sortOrder === "number" && Number.isInteger(value.sortOrder)
        ? value.sortOrder
        : undefined,
  };
}

function normalizeAliasPayload(
  value: Record<string, unknown>
): UpdateEntryAliasesSuggestionPayload | null {
  const entryId = typeof value.entryId === "string" ? value.entryId : "";
  const entryName =
    typeof value.entryName === "string" ? value.entryName.trim() : "";
  const aliases = normalizeStringArray(value.aliases);

  if (!entryId || !entryName || aliases.length === 0) {
    return null;
  }

  return {
    entryId,
    entryName,
    aliases,
  };
}

function normalizeRelationshipPayload(
  value: Record<string, unknown>
): CreateRelationshipSuggestionPayload | null {
  const sourceEntryName =
    typeof value.sourceEntryName === "string"
      ? value.sourceEntryName.trim()
      : "";
  const targetEntryName =
    typeof value.targetEntryName === "string"
      ? value.targetEntryName.trim()
      : "";

  if (!sourceEntryName || !targetEntryName) {
    return null;
  }

  const payload: CreateRelationshipSuggestionPayload = {
    sourceEntryName,
    targetEntryName,
  };

  if (typeof value.sourceEntryId === "string" && value.sourceEntryId) {
    payload.sourceEntryId = value.sourceEntryId;
  }

  if (typeof value.targetEntryId === "string" && value.targetEntryId) {
    payload.targetEntryId = value.targetEntryId;
  }

  if (typeof value.forwardLabel === "string") {
    payload.forwardLabel = value.forwardLabel.trim();
  }

  if (typeof value.reverseLabel === "string") {
    payload.reverseLabel = value.reverseLabel.trim();
  }

  return payload;
}

function normalizeProgressionPayload(
  value: Record<string, unknown>
): CreateProgressionSuggestionPayload | null {
  const entryId = typeof value.entryId === "string" ? value.entryId : "";
  const entryName =
    typeof value.entryName === "string" ? value.entryName.trim() : "";
  const chapterNumber =
    typeof value.chapterNumber === "number" ? value.chapterNumber : NaN;

  if (!entryId || !entryName || !Number.isInteger(chapterNumber) || chapterNumber <= 0) {
    return null;
  }

  return {
    entryId,
    entryName,
    chapterNumber,
    fieldOverrides: normalizeFieldOverrides(value.fieldOverrides),
    descriptionOverride:
      typeof value.descriptionOverride === "string"
        ? value.descriptionOverride.trim()
        : value.descriptionOverride === null
          ? null
          : undefined,
    notes:
      typeof value.notes === "string"
        ? value.notes.trim()
        : value.notes === null
          ? null
          : undefined,
  };
}

function normalizeStaleEntryPayload(
  value: Record<string, unknown>
): FlagStaleEntrySuggestionPayload | null {
  const entryId = typeof value.entryId === "string" ? value.entryId : "";
  const entryName =
    typeof value.entryName === "string" ? value.entryName.trim() : "";
  const reason = typeof value.reason === "string" ? value.reason.trim() : "";

  if (!entryId || !entryName || !reason) {
    return null;
  }

  return {
    entryId,
    entryName,
    reason,
    suspectedFields: normalizeStringArray(value.suspectedFields),
  };
}

function normalizeFieldOverrides(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, fieldValue]) => typeof fieldValue === "string")
      .map(([key, fieldValue]) => [key.trim(), fieldValue.trim()])
      .filter(([key]) => key.length > 0)
  );
}

function normalizeConfidence(value: string): CodexSuggestionConfidence {
  if (value === "low" || value === "high") {
    return value;
  }

  return "medium";
}

function normalizeStatus(value: string): CodexSuggestionStatus {
  if (
    value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "applied"
  ) {
    return value;
  }

  return "pending";
}

function isCodexChangeType(value: string): value is CodexChangeType {
  return (
    value === "create_entry" ||
    value === "update_entry_aliases" ||
    value === "create_relationship" ||
    value === "create_progression" ||
    value === "flag_stale_entry"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
