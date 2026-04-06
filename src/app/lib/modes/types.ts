// src/app/lib/modes/types.ts
import type {
  BibleNotesContent,
  BibleOutlineContent,
} from "../../types/bible.ts";
import type { ProjectMode } from "../../types/story.ts";

export interface PlanningSectionPresentation {
  title: string;
  description: string;
  emptyLabel: string;
}

export interface PlanningOutlinePresentation extends PlanningSectionPresentation {
  openLoopsLabel: string;
}

export interface PlanningNotesPresentation extends PlanningSectionPresentation {
  arcsHeading: string;
  threadsHeading: string;
}

export interface PlanningSchema {
  synopsis: PlanningSectionPresentation;
  styleGuide: PlanningSectionPresentation;
  outline: PlanningOutlinePresentation;
  notes: PlanningNotesPresentation;
}

export interface ModePlanningPromptArgs {
  outline?: BibleOutlineContent | null;
  notes?: BibleNotesContent | null;
  unitNumber: number;
  projectMode: ProjectMode;
}

export interface ModeConfig {
  id: ProjectMode;
  label: string;
  memoryLabel: string;

  // Default entry types for new projects in this mode
  coreTypes: string[];
  typeLabels: Record<string, string>;
  typeIcons: Record<string, string>;

  // Field suggestions when creating entries of each type
  fieldSuggestions: Record<string, string[]>;

  // Content unit naming
  contentUnitSingular: string;
  contentUnitPlural: string;

  // Prompt builders — use narrow inline shapes (callers map from full MemoryEntry)
  // Routes pass: existingEntries.map(e => ({ name: e.name, entryType: e.entryType }))
  buildMemoryGenerationPrompt: (
    content: string,
    existingEntries: { name: string; entryType: string }[],
    context?: { fandom?: string }
  ) => string;

  buildSuggestionPrompt: (
    content: string,
    existingEntries: { name: string; entryType: string; description?: string }[],
    contentUnitNumber: number,
    planningContext?: string
  ) => string;

  buildContextPreamble: (storyTitle: string) => string;
  planningUnitLabel: string;
  planningSchema: PlanningSchema;
  buildPlanningPrompt: (args: ModePlanningPromptArgs) => string;

  // Feature flags
  supportsAutoGeneration: boolean;
  supportsSuggestions: boolean;
}
