import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";
import type {
  MemoryChangeSuggestionPayload,
  MemoryCustomField,
  MemorySuggestedField,
} from "../../types/memory";

export async function authenticateMemoryStory(
  storyId: string,
  storySelect = "id"
):
  Promise<
    | {
        supabase: SupabaseClient;
        userId: string;
        story: Record<string, unknown>;
      }
    | { error: NextResponse }
  > {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: story, error } = await supabase
    .from("stories")
    .select(storySelect)
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single();

  if (error || !isRecord(story)) {
    return {
      error: NextResponse.json({ error: "Story not found" }, { status: 404 }),
    };
  }

  return {
    supabase,
    userId: user.id,
    story,
  };
}

export async function authenticateMemorySuggestion(
  suggestionId: string,
  suggestionSelect = "*"
):
  Promise<
    | {
        supabase: SupabaseClient;
        userId: string;
        suggestion: Record<string, unknown>;
      }
    | { error: NextResponse }
  > {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: suggestion, error: suggestionError } = await supabase
    .from("codex_change_suggestions")
    .select(suggestionSelect)
    .eq("id", suggestionId)
    .single();

  if (suggestionError || !isRecord(suggestion)) {
    return {
      error: NextResponse.json({ error: "Suggestion not found" }, { status: 404 }),
    };
  }

  const storyId =
    typeof suggestion.story_id === "string" ? suggestion.story_id : null;

  if (!storyId) {
    return {
      error: NextResponse.json({ error: "Suggestion not found" }, { status: 404 }),
    };
  }

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single();

  if (storyError || !story) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    supabase,
    userId: user.id,
    suggestion,
  };
}

export function isRouteError<T extends object>(
  value: T | { error: NextResponse }
): value is { error: NextResponse } {
  return "error" in value;
}

export async function getMemoryEntryRecord(
  supabase: SupabaseClient,
  storyId: string,
  entryId: string,
  select = "id"
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("codex_entries")
    .select(select)
    .eq("id", entryId)
    .eq("story_id", storyId)
    .single();

  if (error || !isRecord(data)) return null;
  return data;
}

export async function getMemoryRelationshipRecord(
  supabase: SupabaseClient,
  storyId: string,
  relationshipId: string,
  select = "id"
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("codex_relationships")
    .select(select)
    .eq("id", relationshipId)
    .eq("story_id", storyId)
    .single();

  if (error || !isRecord(data)) return null;
  return data;
}

export async function getMemoryProgressionRecord(
  supabase: SupabaseClient,
  entryId: string,
  progressionId: string,
  select = "id"
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("codex_progressions")
    .select(select)
    .eq("id", progressionId)
    .eq("entry_id", entryId)
    .single();

  if (error || !isRecord(data)) return null;
  return data;
}

export async function getMemorySuggestionRecord(
  supabase: SupabaseClient,
  storyId: string,
  suggestionId: string,
  select = "id"
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("codex_change_suggestions")
    .select(select)
    .eq("id", suggestionId)
    .eq("story_id", storyId)
    .single();

  if (error || !isRecord(data)) return null;
  return data;
}

export function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCustomFields(value: unknown): MemoryCustomField[] | null {
  if (!Array.isArray(value)) return null;

  const fields: MemoryCustomField[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return null;
    }

    const key = typeof item.key === "string" ? item.key.trim() : "";
    const fieldValue = typeof item.value === "string" ? item.value.trim() : "";

    if (!key) {
      return null;
    }

    fields.push({ key, value: fieldValue });
  }

  return fields;
}

export function parseSuggestedFields(
  value: unknown
): MemorySuggestedField[] | null {
  if (!Array.isArray(value)) return null;

  const fields: MemorySuggestedField[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return null;
    }

    const key = typeof item.key === "string" ? item.key.trim() : "";
    const placeholder =
      typeof item.placeholder === "string" ? item.placeholder.trim() : "";

    if (!key) {
      return null;
    }

    fields.push({ key, placeholder });
  }

  return fields;
}

export function parseFieldOverrides(
  value: unknown
): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const overrides: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") {
      return null;
    }

    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return null;
    }

    overrides[trimmedKey] = item.trim();
  }

  return overrides;
}

export function parseSuggestionPayload(
  value: unknown
): MemoryChangeSuggestionPayload | null {
  if (!isRecord(value)) return null;
  return value as unknown as MemoryChangeSuggestionPayload;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
