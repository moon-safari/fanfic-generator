import { buildScreenplayPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildScreenplayMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((entry) => entry.name).join(", ");

  return `You are a screenplay continuity analyst. Read the following scene text and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, props, factions, setpieces, or themes.\n` : ""}
For each entry, output JSON with: name, type (one of: character, location, prop, faction, setpiece, theme), description, and optionally aliases and customFields.

Scene text:
${content}`;
}

function buildScreenplaySuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  contentUnitNumber: number,
  planningContext = ""
): string {
  const entrySummary = existingEntries
    .map(
      (entry) =>
        `- ${entry.name} (${entry.entryType})${entry.description ? `: ${entry.description.slice(0, 100)}` : ""}`
    )
    .join("\n");

  return `You are a screenplay continuity analyst reviewing scene ${contentUnitNumber}. Based on this scene, suggest updates to project memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use planning as context for what the scene was trying to set up, reveal, or pay off.
Only suggest memory updates for facts, props, relationships, setpieces, or thematic pressure actually established in the scene text.
Do not suggest a memory change solely because it was planned.

Scene text:
${content}`;
}

const screenplayPlanningSchema: PlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description: "The core premise and dramatic direction of the screenplay.",
    emptyLabel: "Add a short screenplay synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Visual style, dialogue pressure, pacing, and format guardrails.",
    emptyLabel: "Define visual style, dialogue pressure, and pacing rules...",
  },
  outline: {
    title: "Outline",
    description: "Scene-by-scene plan and status map.",
    emptyLabel: "Add planned scene beats...",
    openLoopsLabel: "Open setup-payoff threads",
  },
  notes: {
    title: "Story Notes",
    description:
      "Act pressure, character arcs, motifs, and unresolved setup-payoff obligations.",
    emptyLabel:
      "Capture act pressure, motifs, and unresolved setup-payoff threads...",
    arcsHeading: "Character and act pressure",
    threadsHeading: "Open setup-payoff threads",
  },
};

export const screenplayMode: ModeConfig = {
  id: "screenplay",
  label: "Screenplay",
  memoryLabel: "Memory",
  coreTypes: ["character", "location", "prop", "faction", "setpiece", "theme"],
  typeLabels: {
    character: "Character",
    location: "Location",
    prop: "Prop",
    faction: "Faction",
    setpiece: "Setpiece",
    theme: "Theme",
  },
  typeIcons: {
    character: "User",
    location: "MapPin",
    prop: "Package",
    faction: "Users",
    setpiece: "Clapperboard",
    theme: "Sparkles",
  },
  fieldSuggestions: {
    character: ["role", "want", "fear", "voice"],
    location: ["look", "pressure", "time_of_day"],
    prop: ["owner", "status", "payoff"],
    faction: ["leader", "goal", "power"],
    setpiece: ["function", "scale", "payoff"],
    theme: ["question", "pressure", "motif"],
  },
  contentUnitSingular: "scene",
  contentUnitPlural: "scenes",
  buildMemoryGenerationPrompt: buildScreenplayMemoryPrompt,
  buildSuggestionPrompt: buildScreenplaySuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for screenplay "${title}":`,
  planningUnitLabel: "beat",
  planningSchema: screenplayPlanningSchema,
  buildPlanningPrompt: buildScreenplayPlanningPrompt,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
