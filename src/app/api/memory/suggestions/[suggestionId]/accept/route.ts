import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchEntryProgressions,
  insertMemoryEntry,
  insertMemoryProgression,
  insertMemoryRelationship,
  normalizeStringArray,
  updateMemoryEntry,
} from "../../../../../lib/supabase/memory";
import {
  mapMemoryChangeSuggestionRow,
  updateMemorySuggestionStatus,
} from "../../../../../lib/supabase/memorySuggestions";
import {
  authenticateMemorySuggestion,
  getMemoryEntryRecord,
  getMemoryRelationshipRecord,
  isRouteError,
  isUniqueViolation,
} from "../../../shared";
import type {
  CreateRelationshipSuggestionPayload,
  CreateEntrySuggestionPayload,
  CreateProgressionSuggestionPayload,
  FlagStaleEntrySuggestionPayload,
  UpdateEntryAliasesSuggestionPayload,
} from "../../../../../types/memory";

type DbSuggestionRow = {
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ suggestionId: string }> }
) {
  try {
    const { suggestionId } = await params;
    const auth = await authenticateMemorySuggestion(suggestionId);

    if (isRouteError(auth)) {
      return auth.error;
    }

    const suggestion = mapMemoryChangeSuggestionRow(
      auth.suggestion as unknown as DbSuggestionRow
    );

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    if (suggestion.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending suggestions can be accepted" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const storyId = suggestion.storyId;

    switch (suggestion.changeType) {
      case "create_entry": {
        const entry = await insertMemoryEntry(
          auth.supabase,
          storyId,
          suggestion.payload as CreateEntrySuggestionPayload
        );

        if (!entry) {
          return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
        }

        const updatedSuggestion = await updateMemorySuggestionStatus(
          auth.supabase,
          suggestionId,
          "applied",
          {
            reviewedAt: now,
            appliedAt: now,
            extraFields: { target_entry_id: entry.id },
          }
        );

        if (!updatedSuggestion) {
          return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
        }

        return NextResponse.json(
          { suggestion: updatedSuggestion, entry },
          { status: 200 }
        );
      }

      case "update_entry_aliases": {
        const payload = suggestion.payload as UpdateEntryAliasesSuggestionPayload;
        const entryRecord = await getMemoryEntryRecord(
          auth.supabase,
          storyId,
          payload.entryId,
          "id, aliases"
        );

        if (!entryRecord) {
          return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        const existingAliases = normalizeStringArray(entryRecord.aliases);
        const mergedAliases = Array.from(
          new Set([...existingAliases, ...payload.aliases])
        );

        const entry = await updateMemoryEntry(auth.supabase, storyId, payload.entryId, {
          aliases: mergedAliases,
        });

        if (!entry) {
          return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
        }

        const updatedSuggestion = await updateMemorySuggestionStatus(
          auth.supabase,
          suggestionId,
          "applied",
          {
            reviewedAt: now,
            appliedAt: now,
          }
        );

        if (!updatedSuggestion) {
          return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
        }

        return NextResponse.json(
          { suggestion: updatedSuggestion, entry },
          { status: 200 }
        );
      }

      case "create_relationship": {
        const payload = suggestion.payload as CreateRelationshipSuggestionPayload;
        const sourceEntryId =
          payload.sourceEntryId ?? (await resolveEntryIdByName(auth.supabase, storyId, payload.sourceEntryName));
        const targetEntryId =
          payload.targetEntryId ?? (await resolveEntryIdByName(auth.supabase, storyId, payload.targetEntryName));

        if (!sourceEntryId || !targetEntryId) {
          return NextResponse.json(
            {
              error:
                "Relationship suggestions require both related entries to exist first",
            },
            { status: 409 }
          );
        }

        if (sourceEntryId === targetEntryId) {
          return NextResponse.json(
            { error: "Relationship entries must be different" },
            { status: 400 }
          );
        }

        const existing = await getExistingRelationshipId(
          auth.supabase,
          storyId,
          sourceEntryId,
          targetEntryId
        );

        if (existing) {
          const updatedSuggestion = await updateMemorySuggestionStatus(
            auth.supabase,
            suggestionId,
            "applied",
            {
              reviewedAt: now,
              appliedAt: now,
              extraFields: { target_entry_id: sourceEntryId },
            }
          );

          const relationship = await getMemoryRelationshipRecord(
            auth.supabase,
            storyId,
            existing,
            "*"
          );

          if (!updatedSuggestion) {
            return NextResponse.json(
              { error: "Suggestion not found" },
              { status: 404 }
            );
          }

          return NextResponse.json(
            { suggestion: updatedSuggestion, relationship },
            { status: 200 }
          );
        }

        const relationship = await insertMemoryRelationship(auth.supabase, storyId, {
          sourceEntryId,
          targetEntryId,
          forwardLabel: payload.forwardLabel,
          reverseLabel: payload.reverseLabel,
        });

        if (!relationship) {
          return NextResponse.json(
            { error: "Failed to create relationship" },
            { status: 500 }
          );
        }

        const updatedSuggestion = await updateMemorySuggestionStatus(
          auth.supabase,
          suggestionId,
          "applied",
          {
            reviewedAt: now,
            appliedAt: now,
            extraFields: { target_entry_id: sourceEntryId },
          }
        );

        if (!updatedSuggestion) {
          return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
        }

        return NextResponse.json(
          { suggestion: updatedSuggestion, relationship },
          { status: 200 }
        );
      }

      case "create_progression": {
        const payload = suggestion.payload as CreateProgressionSuggestionPayload;
        const existingProgressions = await fetchEntryProgressions(
          auth.supabase,
          payload.entryId
        );

        if (
          existingProgressions.some(
            (progression) => progression.chapterNumber === payload.chapterNumber
          )
        ) {
          return NextResponse.json(
            {
              error:
                "A progression already exists for this entry and chapter. Edit it directly from the Memory entry.",
            },
            { status: 409 }
          );
        }

        const progression = await insertMemoryProgression(
          auth.supabase,
          payload.entryId,
          {
            chapterNumber: payload.chapterNumber,
            fieldOverrides: payload.fieldOverrides,
            descriptionOverride: payload.descriptionOverride,
            notes: payload.notes,
          }
        );

        if (!progression) {
          return NextResponse.json(
            { error: "Failed to create progression" },
            { status: 500 }
          );
        }

        const updatedSuggestion = await updateMemorySuggestionStatus(
          auth.supabase,
          suggestionId,
          "applied",
          {
            reviewedAt: now,
            appliedAt: now,
            extraFields: { target_entry_id: payload.entryId },
          }
        );

        if (!updatedSuggestion) {
          return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
        }

        return NextResponse.json(
          { suggestion: updatedSuggestion, progression },
          { status: 200 }
        );
      }

      case "flag_stale_entry": {
        const payload = suggestion.payload as FlagStaleEntrySuggestionPayload;
        const updatedSuggestion = await updateMemorySuggestionStatus(
          auth.supabase,
          suggestionId,
          "accepted",
          {
            reviewedAt: now,
            extraFields: { target_entry_id: payload.entryId },
          }
        );

        if (!updatedSuggestion) {
          return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
        }

        return NextResponse.json(
          {
            suggestion: updatedSuggestion,
            manualReview: true,
          },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json(
          { error: "Unsupported suggestion type" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Memory suggestion accept error:", err);

    if (isUniqueViolation(err)) {
      return NextResponse.json(
        { error: "This suggestion was already applied through another change" },
        { status: 409 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Failed to accept suggestion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function resolveEntryIdByName(
  supabase: SupabaseClient,
  storyId: string,
  name: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("codex_entries")
    .select("id, name, aliases")
    .eq("story_id", storyId);

  if (error || !data) {
    return null;
  }

  const nameKey = normalizeNameKey(name);
  for (const row of data as Array<{ id: string; name: string; aliases: string[] | null }>) {
    if (normalizeNameKey(row.name) === nameKey) {
      return row.id;
    }

    const aliases = normalizeStringArray(row.aliases);
    if (aliases.some((alias) => normalizeNameKey(alias) === nameKey)) {
      return row.id;
    }
  }

  return null;
}

async function getExistingRelationshipId(
  supabase: SupabaseClient,
  storyId: string,
  sourceEntryId: string,
  targetEntryId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("codex_relationships")
    .select("id")
    .eq("story_id", storyId)
    .eq("source_entry_id", sourceEntryId)
    .eq("target_entry_id", targetEntryId)
    .single();

  if (error || !data) {
    return null;
  }

  return typeof data.id === "string" ? data.id : null;
}

function normalizeNameKey(value: string): string {
  return value.trim().toLowerCase();
}
