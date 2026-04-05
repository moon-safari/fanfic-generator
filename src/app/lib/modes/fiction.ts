// src/app/lib/modes/fiction.ts
import type { ModeConfig } from "./types";

function buildFictionMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((e) => e.name).join(", ");
  const fandomLine = context?.fandom
    ? `\nFandom/setting context: ${context.fandom}`
    : "";

  return `You are a story analyst. Read the following chapter text and extract structured project memory entries.${fandomLine}

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, lore, etc. not already listed.\n` : ""}
For each entry, output JSON with: name, type (one of: character, location, lore, event, faction, object), description, and optionally aliases and customFields.

Chapter text:
${content}`;
}

// NOTE: Prompt uses "type" (not "entryType") to match the existing parseGeneratedEntries()
// parser in the generation route, which reads item.type.

function buildFictionSuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  chapterNumber: number
): string {
  const entrySummary = existingEntries
    .map((e) => `- ${e.name} (${e.entryType})${e.description ? ": " + e.description.slice(0, 100) : ""}`)
    .join("\n");

  return `You are a story analyst reviewing chapter ${chapterNumber}. Based on this chapter, suggest updates to the project memory.

Current memory entries:
${entrySummary || "(none)"}

Suggest: new entries to create, alias updates, new relationships, progressions (how entries change at this chapter), and stale entries to flag.

Chapter text:
${content}`;
}

export const fictionMode: ModeConfig = {
  id: "fiction",
  label: "Fiction",
  memoryLabel: "Memory",
  coreTypes: ["character", "location", "lore", "event", "faction", "object"],
  typeLabels: {
    character: "Character",
    location: "Location",
    lore: "Lore",
    event: "Event",
    faction: "Faction",
    object: "Object",
  },
  typeIcons: {
    character: "User",
    location: "MapPin",
    lore: "BookOpen",
    event: "Calendar",
    faction: "Users",
    object: "Package",
  },
  fieldSuggestions: {
    character: ["role", "personality", "appearance", "voice", "age", "occupation"],
    location: ["description", "atmosphere", "significance"],
    lore: ["description", "origin", "rules"],
    event: ["description", "when", "impact"],
    faction: ["description", "goals", "members"],
    object: ["description", "significance", "owner"],
  },
  contentUnitSingular: "chapter",
  contentUnitPlural: "chapters",
  buildMemoryGenerationPrompt: buildFictionMemoryPrompt,
  buildSuggestionPrompt: buildFictionSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for "${title}":`,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
