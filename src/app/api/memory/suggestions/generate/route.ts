import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildMemorySuggestionPrompt } from "../../../../lib/prompts/memorySuggestions";
import { fetchMemoryData } from "../../../../lib/supabase/memory";
import {
  clearPendingMemorySuggestionsForChapter,
  insertMemoryChangeSuggestions,
} from "../../../../lib/supabase/memorySuggestions";
import {
  authenticateMemoryStory,
  isRouteError,
  parseCustomFields,
  parseFieldOverrides,
  parseStringArray,
} from "../../shared";
import type {
  MemoryEntry,
  MemoryRelationship,
  MemorySuggestionConfidence,
  MemorySuggestionGenerationResponse,
  GeneratedAliasSuggestion,
  GeneratedCreateEntrySuggestion,
  GeneratedProgressionSuggestion,
  GeneratedRelationshipSuggestion,
  GeneratedStaleEntrySuggestion,
} from "../../../../types/memory";
import type { ProjectMode } from "../../../../types/story";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 0,
  timeout: 25000,
});

type ChapterRow = {
  id: string;
  content: string;
  summary: string | null;
  chapter_number: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const storyId = typeof body.storyId === "string" ? body.storyId : "";
    const chapterId = typeof body.chapterId === "string" ? body.chapterId : "";

    if (!storyId || !chapterId) {
      return NextResponse.json(
        { error: "storyId and chapterId are required" },
        { status: 400 }
      );
    }

    const auth = await authenticateMemoryStory(storyId, "id, project_mode");
    if (isRouteError(auth)) {
      return auth.error;
    }

    const projectMode = (auth.story.project_mode as ProjectMode | undefined) ?? "fiction";
    if (projectMode === "newsletter") {
      return NextResponse.json(
        {
          suggestions: [],
          skipped: true,
          reason: "Memory change detection is not enabled for newsletter projects yet.",
        },
        { status: 200 }
      );
    }

    const { data: chapter, error: chapterError } = await auth.supabase
      .from("chapters")
      .select("id, content, summary, chapter_number")
      .eq("id", chapterId)
      .eq("story_id", storyId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const memory = await fetchMemoryData(auth.supabase, storyId);
    const prompt = buildMemorySuggestionPrompt(
      chapter.content as string,
      (chapter.summary as string | null) ?? "",
      chapter.chapter_number as number,
      memory
    );

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse Memory suggestion JSON" },
        { status: 500 }
      );
    }

    let parsed: MemorySuggestionGenerationResponse;
    try {
      parsed = JSON.parse(jsonMatch[0]) as MemorySuggestionGenerationResponse;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in Memory suggestion response" },
        { status: 500 }
      );
    }

    const chapterRow = chapter as ChapterRow;
    const rows = buildSuggestionRows(
      storyId,
      chapterRow,
      memory.entries,
      memory.relationships,
      parsed
    );

    await clearPendingMemorySuggestionsForChapter(auth.supabase, chapterId);
    const suggestions = await insertMemoryChangeSuggestions(auth.supabase, rows);

    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (err) {
    console.error("Memory suggestion generation error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate Memory suggestions";
    const status = message.toLowerCase().includes("timeout") ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function buildSuggestionRows(
  storyId: string,
  chapter: ChapterRow,
  entries: MemoryEntry[],
  relationships: MemoryRelationship[],
  generated: MemorySuggestionGenerationResponse
): Record<string, unknown>[] {
  const entryMap = buildEntryMap(entries);
  const rows: Record<string, unknown>[] = [];

  const existingEntryKeys = new Set(entries.map((entry) => normalizeNameKey(entry.name)));
  const existingAliasKeys = new Set<string>();
  const existingProgressionKeys = new Set(
    entries.flatMap((entry) =>
      entry.progressions.map((progression) => `${entry.id}:${progression.chapterNumber}`)
    )
  );
  const existingRelationshipKeys = new Set(
    relationships.map(
      (relationship) =>
        `${relationship.sourceEntryId}:${relationship.targetEntryId}`
    )
  );
  const staleSuggestionKeys = new Set<string>();

  for (const entry of entries) {
    const nameKey = normalizeNameKey(entry.name);
    if (nameKey) {
      existingAliasKeys.add(`${entry.id}:${nameKey}`);
    }

    for (const alias of entry.aliases) {
      const aliasKey = normalizeNameKey(alias);
      if (aliasKey) {
        existingAliasKeys.add(`${entry.id}:${aliasKey}`);
      }
    }
  }

  for (const suggestion of parseCreateEntries(generated.createEntries)) {
    const nameKey = normalizeNameKey(suggestion.name);
    if (!nameKey || existingEntryKeys.has(nameKey)) {
      continue;
    }

    existingEntryKeys.add(nameKey);
    rows.push(
      createSuggestionRow(storyId, chapter, "create_entry", {
        payload: {
          name: suggestion.name,
          entryType: suggestion.entryType,
          description: suggestion.description,
          aliases: suggestion.aliases ?? [],
          tags: suggestion.tags ?? [],
          customFields: suggestion.customFields ?? [],
        },
        evidenceText: suggestion.evidenceText,
        rationale: suggestion.rationale,
        confidence: suggestion.confidence,
      })
    );
  }

  for (const suggestion of parseAliasSuggestions(generated.updateAliases)) {
    const entry = findEntryByName(entryMap, suggestion.entryName);
    if (!entry) {
      continue;
    }

    const aliases = suggestion.aliases.filter((alias) => {
      const aliasKey = normalizeNameKey(alias);
      if (!aliasKey || aliasKey === normalizeNameKey(entry.name)) {
        return false;
      }

      const compoundKey = `${entry.id}:${aliasKey}`;
      if (existingAliasKeys.has(compoundKey)) {
        return false;
      }

      existingAliasKeys.add(compoundKey);
      return true;
    });

    if (aliases.length === 0) {
      continue;
    }

    rows.push(
      createSuggestionRow(storyId, chapter, "update_entry_aliases", {
        targetEntryId: entry.id,
        payload: {
          entryId: entry.id,
          entryName: entry.name,
          aliases,
        },
        evidenceText: suggestion.evidenceText,
        rationale: suggestion.rationale,
        confidence: suggestion.confidence,
      })
    );
  }

  for (const suggestion of parseRelationshipSuggestions(generated.createRelationships)) {
    const sourceEntry = findEntryByName(entryMap, suggestion.sourceName);
    const targetEntry = findEntryByName(entryMap, suggestion.targetName);
    const key = sourceEntry?.id && targetEntry?.id
      ? `${sourceEntry.id}:${targetEntry.id}`
      : `${normalizeNameKey(suggestion.sourceName)}:${normalizeNameKey(suggestion.targetName)}`;

    if (!key || key === ":" || existingRelationshipKeys.has(key)) {
      continue;
    }

    if (
      normalizeNameKey(suggestion.sourceName) === normalizeNameKey(suggestion.targetName)
    ) {
      continue;
    }

    existingRelationshipKeys.add(key);
    rows.push(
      createSuggestionRow(storyId, chapter, "create_relationship", {
        targetEntryId: sourceEntry?.id ?? targetEntry?.id ?? null,
        payload: {
          sourceEntryName: suggestion.sourceName,
          sourceEntryId: sourceEntry?.id,
          targetEntryName: suggestion.targetName,
          targetEntryId: targetEntry?.id,
          forwardLabel: suggestion.forwardLabel?.trim() ?? "",
          reverseLabel: suggestion.reverseLabel?.trim() ?? "",
        },
        evidenceText: suggestion.evidenceText,
        rationale: suggestion.rationale,
        confidence: suggestion.confidence,
      })
    );
  }

  for (const suggestion of parseProgressionSuggestions(generated.createProgressions)) {
    const entry = findEntryByName(entryMap, suggestion.entryName);
    if (!entry) {
      continue;
    }

    const progressionKey = `${entry.id}:${chapter.chapter_number}`;
    if (existingProgressionKeys.has(progressionKey)) {
      continue;
    }

    const hasFieldChanges = Object.keys(suggestion.fieldOverrides ?? {}).length > 0;
    if (!suggestion.descriptionOverride && !hasFieldChanges) {
      continue;
    }

    existingProgressionKeys.add(progressionKey);
    rows.push(
      createSuggestionRow(storyId, chapter, "create_progression", {
        targetEntryId: entry.id,
        payload: {
          entryId: entry.id,
          entryName: entry.name,
          chapterNumber: chapter.chapter_number,
          descriptionOverride: suggestion.descriptionOverride ?? null,
          fieldOverrides: suggestion.fieldOverrides ?? {},
          notes: suggestion.notes ?? null,
        },
        evidenceText: suggestion.evidenceText,
        rationale: suggestion.rationale,
        confidence: suggestion.confidence,
      })
    );
  }

  for (const suggestion of parseStaleEntrySuggestions(generated.flagStaleEntries)) {
    const entry = findEntryByName(entryMap, suggestion.entryName);
    if (!entry) {
      continue;
    }

    if (staleSuggestionKeys.has(entry.id)) {
      continue;
    }

    staleSuggestionKeys.add(entry.id);
    rows.push(
      createSuggestionRow(storyId, chapter, "flag_stale_entry", {
        targetEntryId: entry.id,
        payload: {
          entryId: entry.id,
          entryName: entry.name,
          reason: suggestion.reason,
          suspectedFields: suggestion.suspectedFields ?? [],
        },
        evidenceText: suggestion.evidenceText,
        rationale: suggestion.rationale,
        confidence: suggestion.confidence,
      })
    );
  }

  return rows;
}

function createSuggestionRow(
  storyId: string,
  chapter: ChapterRow,
  changeType:
    | "create_entry"
    | "update_entry_aliases"
    | "create_relationship"
    | "create_progression"
    | "flag_stale_entry",
  options: {
    targetEntryId?: string | null;
    payload: Record<string, unknown>;
    evidenceText?: string;
    rationale?: string;
    confidence?: MemorySuggestionConfidence;
  }
): Record<string, unknown> {
  return {
    story_id: storyId,
    chapter_id: chapter.id,
    chapter_number: chapter.chapter_number,
    target_entry_id: options.targetEntryId ?? null,
    change_type: changeType,
    payload: options.payload,
    evidence_text: options.evidenceText ?? null,
    rationale: options.rationale ?? null,
    confidence: options.confidence ?? "medium",
    status: "pending",
  };
}

function buildEntryMap(entries: MemoryEntry[]): Map<string, MemoryEntry> {
  const map = new Map<string, MemoryEntry>();

  for (const entry of entries) {
    const nameKey = normalizeNameKey(entry.name);
    if (nameKey) {
      map.set(nameKey, entry);
    }

    for (const alias of entry.aliases) {
      const aliasKey = normalizeNameKey(alias);
      if (aliasKey && !map.has(aliasKey)) {
        map.set(aliasKey, entry);
      }
    }
  }

  return map;
}

function findEntryByName(
  entryMap: Map<string, MemoryEntry>,
  name: string
): MemoryEntry | null {
  return entryMap.get(normalizeNameKey(name)) ?? null;
}

function parseCreateEntries(
  value: MemorySuggestionGenerationResponse["createEntries"]
): GeneratedCreateEntrySuggestion[] {
  if (!Array.isArray(value)) return [];

  const results: GeneratedCreateEntrySuggestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    const entryType =
      typeof item.entryType === "string" ? item.entryType.trim() : "";
    const description =
      typeof item.description === "string" ? item.description.trim() : "";

    if (!name || !entryType || !description) continue;

    const aliases =
      item.aliases === undefined ? undefined : parseStringArray(item.aliases);
    const tags = item.tags === undefined ? undefined : parseStringArray(item.tags);
    const customFields =
      item.customFields === undefined
        ? undefined
        : parseCustomFields(item.customFields);

    if (
      (item.aliases !== undefined && aliases === null) ||
      (item.tags !== undefined && tags === null) ||
      (item.customFields !== undefined && customFields === null)
    ) {
      continue;
    }

    results.push({
      name,
      entryType,
      description,
      aliases: aliases ?? undefined,
      tags: tags ?? undefined,
      customFields: customFields ?? undefined,
      evidenceText:
        typeof item.evidenceText === "string" ? item.evidenceText.trim() : undefined,
      rationale:
        typeof item.rationale === "string" ? item.rationale.trim() : undefined,
      confidence: normalizeConfidence(item.confidence),
    });
  }

  return results;
}

function parseAliasSuggestions(
  value: MemorySuggestionGenerationResponse["updateAliases"]
): GeneratedAliasSuggestion[] {
  if (!Array.isArray(value)) return [];

  const results: GeneratedAliasSuggestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const entryName =
      typeof item.entryName === "string" ? item.entryName.trim() : "";
    const aliases = parseStringArray(item.aliases);

    if (!entryName || aliases === null || aliases.length === 0) continue;

    results.push({
      entryName,
      aliases,
      evidenceText:
        typeof item.evidenceText === "string" ? item.evidenceText.trim() : undefined,
      rationale:
        typeof item.rationale === "string" ? item.rationale.trim() : undefined,
      confidence: normalizeConfidence(item.confidence),
    });
  }

  return results;
}

function parseRelationshipSuggestions(
  value: MemorySuggestionGenerationResponse["createRelationships"]
): GeneratedRelationshipSuggestion[] {
  if (!Array.isArray(value)) return [];

  const results: GeneratedRelationshipSuggestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const sourceName =
      typeof item.sourceName === "string" ? item.sourceName.trim() : "";
    const targetName =
      typeof item.targetName === "string" ? item.targetName.trim() : "";

    if (!sourceName || !targetName) continue;

    results.push({
      sourceName,
      targetName,
      forwardLabel:
        typeof item.forwardLabel === "string" ? item.forwardLabel.trim() : undefined,
      reverseLabel:
        typeof item.reverseLabel === "string" ? item.reverseLabel.trim() : undefined,
      evidenceText:
        typeof item.evidenceText === "string" ? item.evidenceText.trim() : undefined,
      rationale:
        typeof item.rationale === "string" ? item.rationale.trim() : undefined,
      confidence: normalizeConfidence(item.confidence),
    });
  }

  return results;
}

function parseProgressionSuggestions(
  value: MemorySuggestionGenerationResponse["createProgressions"]
): GeneratedProgressionSuggestion[] {
  if (!Array.isArray(value)) return [];

  const results: GeneratedProgressionSuggestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const entryName =
      typeof item.entryName === "string" ? item.entryName.trim() : "";
    const fieldOverrides =
      item.fieldOverrides === undefined
        ? undefined
        : parseFieldOverrides(item.fieldOverrides);

    if (!entryName || (item.fieldOverrides !== undefined && fieldOverrides === null)) {
      continue;
    }

    const descriptionOverride =
      typeof item.descriptionOverride === "string"
        ? item.descriptionOverride.trim()
        : item.descriptionOverride === null
          ? null
          : undefined;

    const notes =
      typeof item.notes === "string"
        ? item.notes.trim()
        : item.notes === null
          ? null
          : undefined;

    results.push({
      entryName,
      descriptionOverride,
      fieldOverrides: fieldOverrides ?? undefined,
      notes,
      evidenceText:
        typeof item.evidenceText === "string" ? item.evidenceText.trim() : undefined,
      rationale:
        typeof item.rationale === "string" ? item.rationale.trim() : undefined,
      confidence: normalizeConfidence(item.confidence),
    });
  }

  return results;
}

function parseStaleEntrySuggestions(
  value: MemorySuggestionGenerationResponse["flagStaleEntries"]
): GeneratedStaleEntrySuggestion[] {
  if (!Array.isArray(value)) return [];

  const results: GeneratedStaleEntrySuggestion[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const entryName =
      typeof item.entryName === "string" ? item.entryName.trim() : "";
    const reason = typeof item.reason === "string" ? item.reason.trim() : "";
    const suspectedFields =
      item.suspectedFields === undefined
        ? undefined
        : parseStringArray(item.suspectedFields);

    if (
      !entryName ||
      !reason ||
      (item.suspectedFields !== undefined && suspectedFields === null)
    ) {
      continue;
    }

    results.push({
      entryName,
      reason,
      suspectedFields: suspectedFields ?? undefined,
      evidenceText:
        typeof item.evidenceText === "string" ? item.evidenceText.trim() : undefined,
      rationale:
        typeof item.rationale === "string" ? item.rationale.trim() : undefined,
      confidence: normalizeConfidence(item.confidence),
    });
  }

  return results;
}

function normalizeConfidence(value: unknown): MemorySuggestionConfidence | undefined {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : undefined;
}

function normalizeNameKey(value: string): string {
  return value.trim().toLowerCase();
}
