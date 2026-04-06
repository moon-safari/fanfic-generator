import { buildComicsPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildComicsMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((entry) => entry.name).join(", ");

  return `You are a comics continuity analyst. Read the following comic script page and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, visual motifs, panel layouts, or narrative devices.\n` : ""}
For each entry, output JSON with: name, type (one of: character, location, visual_motif, panel_layout, narrative_device), description, and optionally aliases and customFields.

Comic script page:
${content}`;
}

function buildComicsSuggestionPrompt(
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

  return `You are a comics continuity analyst reviewing page ${contentUnitNumber}. Based on this page script, suggest updates to project memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use planning as context for pacing, reveals, and motif intent.
Only suggest memory updates for facts, motifs, layout patterns, or narrative devices actually established on the page.
Do not suggest a memory change solely because it was planned.

Comic script page:
${content}`;
}

const comicsPlanningSchema: PlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description: "The core premise and visual storytelling direction of the comic.",
    emptyLabel: "Add a short comic synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Visual language, pacing, lettering pressure, and page-turn guardrails.",
    emptyLabel: "Define visual language, pacing, and lettering rules...",
  },
  outline: {
    title: "Outline",
    description: "Page-by-page plan and status map.",
    emptyLabel: "Add planned page beats...",
    openLoopsLabel: "Carry-forward reveals",
  },
  notes: {
    title: "Visual Notes",
    description:
      "Pacing pressure, reveal placement, motif obligations, and unresolved page-turn threads.",
    emptyLabel: "Capture pacing, motif, and reveal obligations...",
    arcsHeading: "Visual and story pressure",
    threadsHeading: "Open page-turn obligations",
  },
};

export const comicsMode: ModeConfig = {
  id: "comics",
  label: "Comics",
  memoryLabel: "Memory",
  coreTypes: [
    "character",
    "location",
    "visual_motif",
    "panel_layout",
    "narrative_device",
  ],
  typeLabels: {
    character: "Character",
    location: "Location",
    visual_motif: "Visual Motif",
    panel_layout: "Panel Layout",
    narrative_device: "Narrative Device",
  },
  typeIcons: {
    character: "User",
    location: "MapPin",
    visual_motif: "Sparkles",
    panel_layout: "PanelsTopLeft",
    narrative_device: "BookOpenText",
  },
  fieldSuggestions: {
    character: ["role", "silhouette", "expression", "voice"],
    location: ["look", "scale", "blocking_pressure"],
    visual_motif: ["meaning", "recurrence", "payoff"],
    panel_layout: ["density", "reveal_pattern", "use_case"],
    narrative_device: ["function", "tone", "constraints"],
  },
  contentUnitSingular: "page",
  contentUnitPlural: "pages",
  buildMemoryGenerationPrompt: buildComicsMemoryPrompt,
  buildSuggestionPrompt: buildComicsSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for comic "${title}":`,
  planningUnitLabel: "page beat",
  planningSchema: comicsPlanningSchema,
  buildPlanningPrompt: buildComicsPlanningPrompt,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
