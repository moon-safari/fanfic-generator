import { buildGameWritingPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildGameWritingMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[]
): string {
  const existingNames = existingEntries.map((entry) => entry.name).join(", ");

  return `You are a game narrative analyst. Read the following quest brief and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, quests, items, factions, lore, or dialogue branches.\n` : ""}For each entry, output JSON with: name, type (one of: character, location, quest, item, faction, lore, dialogue_branch), description, and optionally aliases and customFields.

Quest brief:
${content}`;
}

function buildGameWritingSuggestionPrompt(
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

  return `You are a game narrative analyst reviewing quest ${contentUnitNumber}. Based on this quest brief, suggest updates to project memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use planning as context for quest intent, branch pressure, and unresolved follow-up.
Only suggest memory updates for quest structure, dialogue outcomes, rewards, factions, items, or lore actually established in the draft.
Do not suggest a memory change solely because it was planned.

Quest brief:
${content}`;
}

const gameWritingPlanningSchema: PlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description: "The core player-facing premise and narrative direction of the project.",
    emptyLabel: "Add a short project synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Quest-writing voice, consequence handling, and narrative design guardrails.",
    emptyLabel: "Define quest-writing voice and design guardrails...",
  },
  outline: {
    title: "Outline",
    description: "Quest-by-quest plan and status map.",
    emptyLabel: "Add planned quest beats...",
    openLoopsLabel: "Open dependencies",
  },
  notes: {
    title: "Design Notes",
    description:
      "Quest pressure, unresolved outcomes, branch obligations, and follow-up hooks.",
    emptyLabel: "Capture dependencies, consequences, and quest pressure...",
    arcsHeading: "Quest pressure",
    threadsHeading: "Open dependencies",
  },
};

export const gameWritingMode: ModeConfig = {
  id: "game_writing",
  label: "Game Writing",
  memoryLabel: "Memory",
  coreTypes: [
    "character",
    "location",
    "quest",
    "item",
    "faction",
    "lore",
    "dialogue_branch",
  ],
  typeLabels: {
    character: "Character",
    location: "Location",
    quest: "Quest",
    item: "Item",
    faction: "Faction",
    lore: "Lore",
    dialogue_branch: "Dialogue Branch",
  },
  typeIcons: {
    character: "User",
    location: "MapPin",
    quest: "ScrollText",
    item: "KeyRound",
    faction: "Flag",
    lore: "BookOpen",
    dialogue_branch: "GitBranch",
  },
  fieldSuggestions: {
    character: ["role", "quest_function", "voice", "leverage"],
    location: ["encounter_role", "traversal_pressure", "quest_relevance"],
    quest: ["giver", "player_goal", "stages", "blockers", "rewards", "follow_up"],
    item: ["function", "acquisition_path", "gating_role", "reward_role"],
    faction: ["alignment", "leverage", "conflict_role", "quest_ties"],
    lore: ["rule", "history", "quest_relevance"],
    dialogue_branch: [
      "player_option",
      "npc_response",
      "intended_outcome",
      "quest_impact",
    ],
  },
  contentUnitSingular: "quest",
  contentUnitPlural: "quests",
  buildMemoryGenerationPrompt: buildGameWritingMemoryPrompt,
  buildSuggestionPrompt: buildGameWritingSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for game narrative "${title}":`,
  planningUnitLabel: "quest beat",
  planningSchema: gameWritingPlanningSchema,
  buildPlanningPrompt: buildGameWritingPlanningPrompt,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
