// src/app/lib/modes/fiction.ts
import { buildFictionPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildFictionMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((e) => e.name).join(", ");
  const fandomLine = context?.fandom
    ? `\nFandom/setting context: ${context.fandom}`
    : "";

  // NOTE: Prompt uses "type" (not "entryType") to match the existing parseGeneratedEntries()
  // parser in the generation route, which reads item.type.
  return `You are a story analyst. Read the following chapter text and extract structured project memory entries.${fandomLine}

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, lore, etc. not already listed.\n` : ""}
For each entry, output JSON with: name, type (one of: character, location, lore, event, faction, object), description, and optionally aliases and customFields.

Chapter text:
${content}`;
}

export function buildFictionSuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  contentUnitNumber: number,
  planningContext = ""
): string {
  const entrySummary = existingEntries
    .map((e) => `- ${e.name} (${e.entryType})${e.description ? ": " + e.description.slice(0, 100) : ""}`)
    .join("\n");

  return `You are a story analyst reviewing chapter ${contentUnitNumber}. Based on this chapter, suggest updates to the project memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use the planning guidance as context for what this chapter was trying to establish or advance.
Only suggest memory updates for facts, relationships, aliases, or state changes that are actually established in the chapter text.
Do not suggest a memory change solely because it was planned, implied by the outline, or still due but absent from the draft.

Suggest: new entries to create, alias updates, new relationships, progressions (how entries change at this chapter), and stale entries to flag.

Chapter text:
${content}`;
}

const fictionPlanningSchema: PlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description: "The core premise and direction of the work.",
    emptyLabel: "Add a short project synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Voice, tense, pacing, and stylistic guardrails.",
    emptyLabel: "Define voice, tense, pacing, and stylistic rules...",
  },
  outline: {
    title: "Outline",
    description: "Chapter-by-chapter plan and status map.",
    emptyLabel: "Add planned chapter beats...",
    openLoopsLabel: "Open threads",
  },
  notes: {
    title: "Planning Notes",
    description: "Freeform notes, active arcs, open threads, and research.",
    emptyLabel: "Capture notes, active arcs, and unresolved threads...",
    arcsHeading: "Active arcs",
    threadsHeading: "Open threads",
  },
};

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
  planningUnitLabel: "beat",
  planningSchema: fictionPlanningSchema,
  buildPlanningPrompt: buildFictionPlanningPrompt,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
