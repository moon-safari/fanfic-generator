import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getFandomContext } from "../../../lib/fandoms";
import { buildMemoryGenerationPrompt } from "../../../lib/prompts/memory";
import {
  fetchMemoryData,
  mapMemoryEntryRow,
  mapMemoryRelationshipRow,
} from "../../../lib/supabase/memory";
import {
  authenticateMemoryStory,
  isRouteError,
  parseFieldOverrides,
  parseStringArray,
} from "../shared";
import type {
  MemoryGenerateEntryInput,
  MemoryGenerateRelationshipInput,
} from "../../../types/memory";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type DbGeneratedEntryRow = {
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

type DbGeneratedRelationshipRow = {
  id: string;
  story_id: string;
  source_entry_id: string;
  target_entry_id: string;
  forward_label: string;
  reverse_label: string;
  created_at: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const storyId = typeof body.storyId === "string" ? body.storyId : "";

    if (!storyId) {
      return NextResponse.json({ error: "storyId is required" }, { status: 400 });
    }

    const auth = await authenticateMemoryStory(storyId, "id, fandom, project_mode");
    if (isRouteError(auth)) {
      return auth.error;
    }

    if ((auth.story.project_mode as string | undefined) === "newsletter") {
      return NextResponse.json(
        {
          entries: [],
          relationships: [],
          skipped: true,
          reason: "Memory auto-generation is not enabled for newsletter mode yet.",
        },
        { status: 200 }
      );
    }

    const { data: chapter1, error: chapterError } = await auth.supabase
      .from("chapters")
      .select("content")
      .eq("story_id", storyId)
      .eq("chapter_number", 1)
      .single();

    if (chapterError || !chapter1) {
      return NextResponse.json({ error: "Chapter 1 not found" }, { status: 404 });
    }

    const fandomContext = getFandomContext((auth.story.fandom as string) || "");
    const prompt = buildMemoryGenerationPrompt(
      chapter1.content as string,
      fandomContext
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
        { error: "Failed to parse memory JSON" },
        { status: 500 }
      );
    }

    let parsed: { entries?: unknown; relationships?: unknown };
    try {
      parsed = JSON.parse(jsonMatch[0]) as {
        entries?: unknown;
        relationships?: unknown;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in memory response" },
        { status: 500 }
      );
    }

    const generatedEntries = parseGeneratedEntries(parsed.entries);
    const generatedRelationships = parseGeneratedRelationships(parsed.relationships);
    const existingMemory = await fetchMemoryData(auth.supabase, storyId);

    const existingNames = new Set(
      existingMemory.entries.map((entry) => normalizeNameKey(entry.name))
    );
    const rowsToInsert: Record<string, unknown>[] = [];

    for (const entry of generatedEntries) {
      const nameKey = normalizeNameKey(entry.name);
      if (!nameKey || existingNames.has(nameKey)) {
        continue;
      }

      existingNames.add(nameKey);
      rowsToInsert.push({
        story_id: storyId,
        name: entry.name.trim(),
        entry_type: entry.type,
        description: entry.description.trim(),
        tags: entry.tags ?? [],
        aliases: entry.aliases ?? [],
        custom_fields: Object.entries(entry.fields ?? {}).map(([key, value]) => ({
          key,
          value,
        })),
        updated_at: new Date().toISOString(),
      });
    }

    let insertedEntries = existingMemory.entries.slice(0, 0);
    if (rowsToInsert.length > 0) {
      const { data: insertedRows, error: insertError } = await auth.supabase
        .from("codex_entries")
        .insert(rowsToInsert)
        .select("*");

      if (insertError) {
        console.error("Memory entry insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to save generated memory entries" },
          { status: 500 }
        );
      }

      insertedEntries = ((insertedRows ?? []) as DbGeneratedEntryRow[]).map((row) =>
        mapMemoryEntryRow(row, [])
      );
    }

    const nameToId = new Map<string, string>();
    for (const entry of [...existingMemory.entries, ...insertedEntries]) {
      nameToId.set(normalizeNameKey(entry.name), entry.id);
    }

    const relationshipKeys = new Set(
      existingMemory.relationships.map(
        (relationship) =>
          `${relationship.sourceEntryId}:${relationship.targetEntryId}`
      )
    );
    const relationshipRows: Record<string, unknown>[] = [];

    for (const relationship of generatedRelationships) {
      const sourceId = nameToId.get(normalizeNameKey(relationship.source));
      const targetId = nameToId.get(normalizeNameKey(relationship.target));

      if (!sourceId || !targetId || sourceId === targetId) {
        continue;
      }

      const key = `${sourceId}:${targetId}`;
      if (relationshipKeys.has(key)) {
        continue;
      }

      relationshipKeys.add(key);
      relationshipRows.push({
        story_id: storyId,
        source_entry_id: sourceId,
        target_entry_id: targetId,
        forward_label: relationship.forwardLabel.trim(),
        reverse_label: relationship.reverseLabel.trim(),
      });
    }

    let insertedRelationships = existingMemory.relationships.slice(0, 0);
    if (relationshipRows.length > 0) {
      const { data: insertedRows, error: insertError } = await auth.supabase
        .from("codex_relationships")
        .insert(relationshipRows)
        .select("*");

      if (insertError) {
        console.error("Memory relationship insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to save generated memory relationships" },
          { status: 500 }
        );
      }

      insertedRelationships = (
        (insertedRows ?? []) as DbGeneratedRelationshipRow[]
      ).map(mapMemoryRelationshipRow);
    }

    return NextResponse.json(
      {
        entries: insertedEntries,
        relationships: insertedRelationships,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Memory generation error:", err);
    const message =
      err instanceof Error ? err.message : "Memory generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseGeneratedEntries(value: unknown): MemoryGenerateEntryInput[] {
  if (!Array.isArray(value)) return [];

  const entries: MemoryGenerateEntryInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    const type = typeof item.type === "string" ? item.type.trim() : "";
    const description =
      typeof item.description === "string" ? item.description.trim() : "";

    if (!name || !type || !description) continue;

    const aliases =
      item.aliases === undefined ? undefined : parseStringArray(item.aliases);
    const tags = item.tags === undefined ? undefined : parseStringArray(item.tags);
    const fields =
      item.fields === undefined ? undefined : parseFieldOverrides(item.fields);

    if (
      (item.aliases !== undefined && aliases === null) ||
      (item.tags !== undefined && tags === null) ||
      (item.fields !== undefined && fields === null)
    ) {
      continue;
    }

    entries.push({
      name,
      type: type as MemoryGenerateEntryInput["type"],
      description,
      aliases: aliases ?? undefined,
      tags: tags ?? undefined,
      fields: fields ?? undefined,
    });
  }

  return entries;
}

function parseGeneratedRelationships(
  value: unknown
): MemoryGenerateRelationshipInput[] {
  if (!Array.isArray(value)) return [];

  const relationships: MemoryGenerateRelationshipInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const source = typeof item.source === "string" ? item.source.trim() : "";
    const target = typeof item.target === "string" ? item.target.trim() : "";
    const forwardLabel =
      typeof item.forwardLabel === "string" ? item.forwardLabel.trim() : "";
    const reverseLabel =
      typeof item.reverseLabel === "string" ? item.reverseLabel.trim() : "";

    if (!source || !target) continue;

    relationships.push({
      source,
      target,
      forwardLabel,
      reverseLabel,
    });
  }

  return relationships;
}

function normalizeNameKey(value: string): string {
  return value.trim().toLowerCase();
}
