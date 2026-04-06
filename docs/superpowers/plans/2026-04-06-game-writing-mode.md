# Game Writing Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add game writing as a first-class project mode with quest-based drafting, game-writing-native memory and planning semantics, a `quest_handoff_sheet` output, structured text export, and aligned Supabase migration source of truth.

**Architecture:** Extend the existing mode-pack system rather than building a game-design-only subsystem. Game writing becomes a fifth `ProjectMode`, stores a narrow `GameWritingModeConfig`, plugs into shared prompt/context/adaptation/export helpers, and reuses the existing Project/Artifacts setup flow with a small game-writing-specific panel.

**Tech Stack:** TypeScript, Next.js App Router, React, Supabase SQL migrations, Node test runner, ESLint

---

### Task 1: Add game-writing mode foundation and align Supabase check constraints

**Files:**
- Create: `supabase/migrations/018_game_writing_mode_alignment.sql`
- Create: `src/app/lib/modes/gameWriting.ts`
- Modify: `src/app/types/story.ts`
- Modify: `src/app/lib/projectMode.ts`
- Modify: `src/app/lib/projectMode.test.ts`
- Modify: `src/app/lib/modes/planning.ts`
- Modify: `src/app/lib/modes/registry.ts`
- Modify: `src/app/lib/planningContext.test.ts`

- [x] **Step 1: Write the failing game-writing mode helper tests**

```ts
// src/app/lib/projectMode.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
  getProjectModeLabel,
  getProjectUnitLabel,
  parseGameWritingModeConfig,
  parseStoryModeConfig,
} from "./projectMode.ts";
import { getModeConfig } from "./modes/registry.ts";

test("game writing mode exposes quest labels and systems-aware defaults", () => {
  const mode = getModeConfig("game_writing");

  assert.equal(getProjectModeLabel("game_writing"), "Game Writing");
  assert.equal(getProjectUnitLabel("game_writing"), "quest");
  assert.equal(
    getProjectUnitLabel("game_writing", { capitalize: true }),
    "Quest"
  );
  assert.equal(getContinueActionLabel("game_writing"), "Continue Quest");
  assert.equal(
    getLoadingContinueLabel("game_writing"),
    "Writing the next quest..."
  );
  assert.equal(mode.contentUnitSingular, "quest");
  assert.equal(
    mode.planningSchema.outline.description,
    "Quest-by-quest plan and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "quest",
    "item",
    "faction",
    "lore",
    "dialogue_branch",
  ]);
});

test("parseGameWritingModeConfig normalizes valid game-writing config", () => {
  const parsed = parseGameWritingModeConfig({
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "questline",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "questline",
  });
});

test("parseStoryModeConfig supports game writing mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("game_writing", {
      draftingPreference: "hybrid_quest_brief",
      formatStyle: "quest_brief",
      questEngine: "main_quest",
    }),
    {
      draftingPreference: "hybrid_quest_brief",
      formatStyle: "quest_brief",
      questEngine: "main_quest",
    }
  );
});
```

```ts
// src/app/lib/planningContext.test.ts
test("game writing mode uses quest-native planning phrasing", () => {
  const mode = getModeConfig("game_writing");

  assert.equal(mode.planningUnitLabel, "quest beat");
  assert.equal(mode.planningSchema.notes.title, "Design Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "game_writing",
  });

  assert.match(prompt, /TARGET QUEST PLAN:/);
  assert.match(prompt, /QUEST PRESSURE TO HONOR:/);
  assert.match(prompt, /OUTCOMES DUE BY QUEST 4:/);
});
```

- [x] **Step 2: Run the failing mode tests**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts`

Expected: FAIL because `game_writing` is not yet part of `ProjectMode`, there is no registry entry, and the parsing/label helpers do not exist.

- [x] **Step 3: Implement the game-writing type, mode, planning, and migration foundation**

```sql
-- supabase/migrations/018_game_writing_mode_alignment.sql
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_project_mode_check;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_project_mode_check
  CHECK (project_mode IN (
    'fiction',
    'newsletter',
    'screenplay',
    'comics',
    'game_writing'
  ));

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_output_type_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_output_type_check
  CHECK (output_type IN (
    'short_summary',
    'newsletter_recap',
    'screenplay_beat_sheet',
    'screenplay_scene_pages',
    'comic_page_beat_sheet',
    'quest_handoff_sheet',
    'public_teaser',
    'issue_subject_line',
    'issue_deck',
    'issue_section_package',
    'issue_hook_variants',
    'issue_cta_variants',
    'issue_send_checklist'
  ));
```

```ts
// src/app/types/story.ts
export type ProjectMode =
  | "fiction"
  | "newsletter"
  | "screenplay"
  | "comics"
  | "game_writing";

export type GameWritingDraftingPreference = "hybrid_quest_brief";
export type GameWritingQuestEngine =
  | "main_quest"
  | "side_quest"
  | "questline";

export interface GameWritingModeConfig {
  draftingPreference: GameWritingDraftingPreference;
  formatStyle: "quest_brief";
  questEngine?: GameWritingQuestEngine;
}

export interface GameWritingStoryFormData {
  projectMode: "game_writing";
  title: string;
  tone: string[];
  questEngine?: GameWritingQuestEngine;
}

export type StoryModeConfig =
  | Record<string, never>
  | NewsletterModeConfig
  | ScreenplayModeConfig
  | ComicsModeConfig
  | GameWritingModeConfig;

export type StoryFormData =
  | FictionStoryFormData
  | NewsletterStoryFormData
  | ScreenplayStoryFormData
  | ComicsStoryFormData
  | GameWritingStoryFormData;
```

```ts
// src/app/lib/projectMode.ts
export function isGameWritingFormData(
  value: StoryFormData
): value is GameWritingStoryFormData {
  return value.projectMode === "game_writing";
}

export function getGameWritingModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): GameWritingModeConfig | null {
  if (story.projectMode !== "game_writing" || !story.modeConfig) {
    return null;
  }

  return parseGameWritingModeConfig(story.modeConfig);
}

export function parseGameWritingModeConfig(
  input: unknown
): GameWritingModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<GameWritingModeConfig>;
  if (
    candidate.draftingPreference !== "hybrid_quest_brief"
    || candidate.formatStyle !== "quest_brief"
  ) {
    return null;
  }

  return {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine:
      candidate.questEngine === "main_quest"
      || candidate.questEngine === "side_quest"
      || candidate.questEngine === "questline"
        ? candidate.questEngine
        : undefined,
  };
}
```

```ts
// src/app/lib/projectMode.ts
export function parseStoryModeConfig(
  projectMode: ProjectMode,
  input: unknown
): StoryModeConfig | null {
  if (projectMode === "newsletter") return parseNewsletterModeConfig(input);
  if (projectMode === "screenplay") return parseScreenplayModeConfig(input);
  if (projectMode === "comics") return parseComicsModeConfig(input);
  if (projectMode === "game_writing") return parseGameWritingModeConfig(input);
  return {};
}

export function getProjectModeLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Newsletter";
  if (mode === "screenplay") return "Screenplay";
  if (mode === "comics") return "Comics";
  if (mode === "game_writing") return "Game Writing";
  return "Fiction";
}

export function getProjectUnitLabel(
  mode: ProjectMode,
  options: { count?: number; capitalize?: boolean; abbreviated?: boolean } = {}
): string {
  const { count = 1, capitalize = false, abbreviated = false } = options;

  if (mode === "game_writing") {
    const singular = abbreviated
      ? "Q."
      : capitalize
        ? "Quest"
        : "quest";
    const plural = capitalize ? "Quests" : "quests";
    return count === 1 ? singular : plural;
  }

  if (mode === "comics") {
    const singular = abbreviated
      ? "Pg."
      : capitalize
        ? "Page"
        : "page";
    const plural = capitalize ? "Pages" : "pages";
    return count === 1 ? singular : plural;
  }

  if (mode === "screenplay") {
    const singular = abbreviated
      ? "Sc."
      : capitalize
        ? "Scene"
        : "scene";
    const plural = capitalize ? "Scenes" : "scenes";
    return count === 1 ? singular : plural;
  }

  const singular =
    mode === "newsletter"
      ? abbreviated
        ? "Iss."
        : capitalize
          ? "Issue"
          : "issue"
      : abbreviated
        ? "Ch."
        : capitalize
          ? "Chapter"
          : "chapter";

  const plural =
    mode === "newsletter"
      ? capitalize
        ? "Issues"
        : "issues"
      : capitalize
        ? "Chapters"
        : "chapters";

  return count === 1 ? singular : plural;
}

export function getContinueActionLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Continue Issue";
  if (mode === "screenplay") return "Continue Scene";
  if (mode === "comics") return "Continue Page";
  if (mode === "game_writing") return "Continue Quest";
  return "Continue Story";
}

export function getLoadingContinueLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Writing the next issue...";
  if (mode === "screenplay") return "Writing the next scene...";
  if (mode === "comics") return "Writing the next page...";
  if (mode === "game_writing") return "Writing the next quest...";
  return "Writing the next chapter...";
}
```

```ts
// src/app/lib/modes/gameWriting.ts
import { buildGameWritingPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildGameWritingMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[]
): string {
  const existingNames = existingEntries.map((entry) => entry.name).join(", ");

  return `You are a game narrative analyst. Read the following quest brief and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, quests, items, factions, lore, or dialogue branches.\n` : ""}
For each entry, output JSON with: name, type (one of: character, location, quest, item, faction, lore, dialogue_branch), description, and optionally aliases and customFields.

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
    .map((entry) => `- ${entry.name} (${entry.entryType})${entry.description ? `: ${entry.description.slice(0, 100)}` : ""}`)
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
    description: "Quest pressure, unresolved outcomes, branch obligations, and follow-up hooks.",
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
    dialogue_branch: ["player_option", "npc_response", "intended_outcome", "quest_impact"],
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
```

```ts
// src/app/lib/modes/planning.ts
export function buildGameWritingPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "QUEST PRESSURE TO HONOR:",
    dueHeadingPrefix: "OUTCOMES DUE BY",
    openHeading: "OTHER OPEN QUEST DEPENDENCIES:",
    notesHeading: "DESIGN NOTES",
    keyRevealLabel: "Expected branch turn or consequence",
    openLoopsLabel: (unitLabelLowercase) =>
      `Consequences meant to stay open after this ${unitLabelLowercase}`,
  });
}
```

```ts
// src/app/lib/modes/registry.ts
import { gameWritingMode } from "./gameWriting.ts";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
  screenplay: screenplayMode,
  comics: comicsMode,
  game_writing: gameWritingMode,
};
```

- [x] **Step 4: Run the mode tests again and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts`

Expected: PASS with game-writing labels, config parsing, registry wiring, and quest-native planning phrasing all green.

- [x] **Step 5: Commit the game-writing foundation**

```bash
git add supabase/migrations/018_game_writing_mode_alignment.sql src/app/types/story.ts src/app/lib/projectMode.ts src/app/lib/projectMode.test.ts src/app/lib/modes/gameWriting.ts src/app/lib/modes/planning.ts src/app/lib/modes/registry.ts src/app/lib/planningContext.test.ts
git commit -m "feat: add game writing mode foundation"
```

### Task 2: Add quest drafting prompts and story-bible support

**Files:**
- Create: `src/app/lib/prompts/gameWriting.ts`
- Create: `src/app/lib/prompts/gameWriting.test.ts`
- Modify: `src/app/lib/prompts/index.ts`
- Modify: `src/app/lib/prompts/bible.ts`
- Modify: `src/app/api/generate-story/route.ts`

- [x] **Step 1: Write the failing game-writing prompt tests**

```ts
// src/app/lib/prompts/gameWriting.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const gameWritingForm = {
  projectMode: "game_writing" as const,
  title: "Ashes of Red Hollow",
  tone: ["tense", "political"],
  questEngine: "main_quest" as const,
};

const gameWritingStory: Story = {
  id: "story-1",
  title: "Ashes of Red Hollow",
  projectMode: "game_writing",
  modeConfig: {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "main_quest",
  },
  chapters: [
    {
      id: "quest-1",
      chapterNumber: 1,
      content: "QUEST 1\nPremise: The magistrate offers the player a dangerous bargain.",
      summary: "The player receives the first main-quest offer and sees the political stakes.",
      wordCount: 12,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["tense", "political"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 12,
};

test("game writing first-quest prompt requests hybrid quest brief structure", () => {
  const prompt = buildChapter1Prompt(gameWritingForm);

  assert.match(prompt, /^Title: Ashes of Red Hollow/m);
  assert.match(prompt, /Write Quest 1/i);
  assert.match(prompt, /Player Goal:/i);
  assert.match(prompt, /Dialogue Choices:/i);
  assert.doesNotMatch(prompt, /Write Chapter 1/i);
});

test("game writing continuation prompt uses quest language and choice pressure", () => {
  const prompt = buildContinuationPrompt(
    gameWritingStory,
    2,
    "=== MEMORY ===\nThe magistrate wants a public confession.",
    "=== PLANNING GUIDANCE ===\nTARGET QUEST PLAN:\n- Intent: Force the first faction split."
  );

  assert.match(prompt, /QUEST 2 INSTRUCTIONS:/);
  assert.match(prompt, /hybrid quest brief/i);
  assert.match(prompt, /embedded dialogue choices/i);
  assert.doesNotMatch(prompt, /CHAPTER 2 INSTRUCTIONS:/);
});

test("game writing bible generation prompt asks for quest-by-quest planning", () => {
  const prompt = buildBibleGenerationPrompt(
    "QUEST 1\nPremise: The magistrate offers the player a dangerous bargain.",
    {
      storyTitle: "Ashes of Red Hollow",
      fandomContext: "",
      projectMode: "game_writing",
      modeConfig: {
        draftingPreference: "hybrid_quest_brief",
        formatStyle: "quest_brief",
        questEngine: "main_quest",
      },
    }
  );

  assert.match(prompt, /quest-by-quest/i);
  assert.match(prompt, /player objective/i);
  assert.doesNotMatch(prompt, /chapter-by-chapter/i);
});
```

- [x] **Step 2: Run the prompt test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/gameWriting.test.ts`

Expected: FAIL because `buildChapter1Prompt`, `buildContinuationPrompt`, and `buildBibleGenerationPrompt` do not yet handle `game_writing`.

- [x] **Step 3: Implement the game-writing prompt builders and route them through shared entry points**

```ts
// src/app/lib/prompts/gameWriting.ts
import { getGameWritingModeConfig } from "../projectMode.ts";
import type { GameWritingStoryFormData, Story } from "../../types/story.ts";

export function buildGameWritingQuest1Prompt(
  form: GameWritingStoryFormData
): string {
  const tone = form.tone.join(" + ");

  return `You are a sharp narrative designer writing the opening quest for a game-writing project.

TITLE: ${form.title}
TONE: ${tone}
${form.questEngine ? `QUEST ENGINE: ${form.questEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: hybrid_quest_brief

Write Quest 1 as a hybrid quest brief.
- Use a QUEST heading.
- Include a clear premise and player objective.
- Structure the quest around key stages or progression beats.
- Include embedded dialogue choices with intended outcomes.
- Describe consequences, blockers, rewards, and follow-up hooks in prose.
- Keep the writing specific, readable, and collaborator-friendly.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Quest 1 text only]`;
}

export function buildGameWritingContinuationPrompt(
  story: Story,
  questNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getGameWritingModeConfig(story);
  const questHistory = story.chapters
    .map((quest, index) => {
      const label = `Quest ${index + 1}`;
      const isRecent = index >= story.chapters.length - 2;
      if (isRecent) return `--- ${label} ---\n${quest.content}`;
      if (quest.summary) return `--- ${label} (Summary) ---\n${quest.summary}`;
      return `--- ${label} ---\n${quest.content}`;
    })
    .join("\n\n");

  return `You are continuing a game-writing project with quest-based narrative design.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: hybrid_quest_brief
${modeConfig?.questEngine ? `QUEST ENGINE: ${modeConfig.questEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS QUESTS:
${questHistory}

QUEST ${questNumber} INSTRUCTIONS:
1. Continue directly from prior quest pressure and open consequences.
2. Write the next quest as a hybrid quest brief with embedded dialogue choices.
3. Preserve factions, quest hooks, rewards, and unresolved outcomes already established.
4. Use planning guidance when it is specific, but never force beats that contradict project truth.
5. Keep the quest readable for collaborators rather than drifting into pseudo-code.

Write Quest ${questNumber} now (just the quest text, no extra commentary):`;
}
```

```ts
// src/app/lib/prompts/index.ts
import {
  getNewsletterModeConfig,
  isComicsFormData,
  isGameWritingFormData,
  isNewsletterFormData,
  isScreenplayFormData,
} from "../projectMode.ts";
import {
  buildGameWritingContinuationPrompt,
  buildGameWritingQuest1Prompt,
} from "./gameWriting.ts";

export function buildChapter1Prompt(form: StoryFormData): string {
  if (isNewsletterFormData(form)) return buildNewsletterIssue1Prompt(form);
  if (isScreenplayFormData(form)) return buildScreenplayScene1Prompt(form);
  if (isComicsFormData(form)) return buildComicsPage1Prompt(form);
  if (isGameWritingFormData(form)) return buildGameWritingQuest1Prompt(form);
  return buildFictionChapter1Prompt(form);
}

export function buildContinuationPrompt(
  story: Story,
  chapterNum: number,
  storyContext?: string,
  planningContext?: string
): string {
  if (story.projectMode === "newsletter") {
    return buildNewsletterContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  if (story.projectMode === "screenplay") {
    return buildScreenplayContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  if (story.projectMode === "comics") {
    return buildComicsContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  if (story.projectMode === "game_writing") {
    return buildGameWritingContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  return buildFictionContinuationPrompt(
    story,
    chapterNum,
    storyContext,
    planningContext
  );
}
```

```ts
// src/app/lib/prompts/bible.ts
if (options.projectMode === "game_writing") {
  const modeConfig = options.modeConfig;
  const questEngine =
    modeConfig && "questEngine" in modeConfig ? modeConfig.questEngine : "";

  return `You are a game narrative memory analyst. Extract reusable project truth and quest-by-quest planning from the opening quest brief.

GAME WRITING CONTEXT:
- Title: ${options.storyTitle}
- Drafting preference: hybrid_quest_brief
${questEngine ? `- Quest engine: ${questEngine}` : ""}

Return ONLY a valid JSON object with these top-level keys: characters, world, synopsis, genre, style_guide, outline, notes.

Use this guidance while filling the existing story-bible structure:
- Treat the source text as Quest 1, not a chapter, scene, or page.
- Make the outline quest-by-quest rather than chapter-by-chapter.
- Preserve player objective, branch pressure, faction stakes, and follow-up dependencies in notes.
- Extract quests, items, factions, lore, and dialogue branches only from what is actually established in the draft.

OPENING QUEST TEXT:
${chapter1}`;
}
```

```ts
// src/app/api/generate-story/route.ts
import {
  isComicsFormData,
  isGameWritingFormData,
  isNewsletterFormData,
  isScreenplayFormData,
} from "../../lib/projectMode";

// ...
} else if (isGameWritingFormData(body)) {
  if (
    body.title.trim().length < 2
    || !Array.isArray(body.tone)
    || body.tone.length < 1
  ) {
    return NextResponse.json(
      { error: "Missing required game-writing fields" },
      { status: 400 }
    );
  }
} else if (
  !body.characters
  || !Array.isArray(body.characters)
  || body.characters.filter((c: string) => c.trim().length > 0).length < 2
  || !body.tone
  || !Array.isArray(body.tone)
  || body.tone.length < 1
  || !body.rating
  || !body.relationshipType
) {
  return NextResponse.json(
    { error: "Missing required fiction fields" },
    { status: 400 }
  );
}
```

- [x] **Step 4: Run the prompt test again and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/gameWriting.test.ts`

Expected: PASS with first-quest prompting, continuation behavior, and quest-native bible generation all green.

- [x] **Step 5: Commit the prompt slice**

```bash
git add src/app/lib/prompts/gameWriting.ts src/app/lib/prompts/gameWriting.test.ts src/app/lib/prompts/index.ts src/app/lib/prompts/bible.ts src/app/api/generate-story/route.ts
git commit -m "feat: add game writing drafting prompts"
```

### Task 3: Add the quest handoff output and game-writing export behavior

**Files:**
- Modify: `src/app/types/adaptation.ts`
- Modify: `src/app/lib/adaptations.ts`
- Modify: `src/app/lib/adaptations.test.ts`
- Modify: `src/app/lib/prompts/adaptation.ts`
- Modify: `src/app/lib/storyExport.ts`
- Modify: `src/app/lib/storyExport.test.ts`
- Modify: `src/app/components/editor/AdaptTab.tsx`

- [x] **Step 1: Write the failing output and export tests**

```ts
// src/app/lib/adaptations.test.ts
test("game writing mode exposes quest handoff output", () => {
  const presets = getAdaptationPresetsForMode("game_writing");

  assert.deepEqual(
    presets.map((preset) => preset.type),
    [
      "quest_handoff_sheet",
      "short_summary",
      "public_teaser",
      "newsletter_recap",
    ]
  );
});

test("fiction mode does not expose quest-only outputs", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "quest_handoff_sheet"),
    false
  );
});
```

```ts
// src/app/lib/storyExport.test.ts
test("game writing projects export as structured plain text", () => {
  const story = {
    id: "story-1",
    title: "Ashes of Red Hollow",
    projectMode: "game_writing",
    modeConfig: {
      draftingPreference: "hybrid_quest_brief",
      formatStyle: "quest_brief",
      questEngine: "main_quest",
    },
    chapters: [
      {
        id: "quest-1",
        chapterNumber: 1,
        content: "QUEST 1\nPremise: The magistrate offers the player a bargain.",
        wordCount: 10,
      },
    ],
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: ["tense", "political"],
    tropes: [],
    createdAt: "",
    updatedAt: "",
    wordCount: 10,
  } satisfies Story;

  const exportFile = buildStoryExportFile(story);

  assert.equal(exportFile.extension, "txt");
  assert.match(exportFile.content, /Mode: Game Writing/);
  assert.match(exportFile.content, /Drafting preference: hybrid_quest_brief/);
  assert.match(exportFile.content, /Quest engine: main_quest/);
  assert.match(exportFile.content, /Quest 1/);
});
```

- [x] **Step 2: Run the output/export tests and verify they fail**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: FAIL because `quest_handoff_sheet` is not yet a supported output type and export does not handle `game_writing`.

- [x] **Step 3: Implement the quest handoff output and export path**

```ts
// src/app/types/adaptation.ts
export type AdaptationOutputType =
  | "short_summary"
  | "newsletter_recap"
  | "screenplay_beat_sheet"
  | "screenplay_scene_pages"
  | "comic_page_beat_sheet"
  | "quest_handoff_sheet"
  | "public_teaser"
  | "issue_subject_line"
  | "issue_deck"
  | "issue_section_package"
  | "issue_hook_variants"
  | "issue_cta_variants"
  | "issue_send_checklist";
```

```ts
// src/app/lib/adaptations.ts
export const ADAPTATION_PRESETS: AdaptationPreset[] = [
  {
    type: "quest_handoff_sheet",
    label: "Quest Handoff Sheet",
    description:
      "Turn the source quest brief into a structured production-facing handoff for narrative and quest collaborators.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
    supportedModes: ["game_writing"],
  },
];

const preferredOrder: AdaptationOutputType[] =
  projectMode === "newsletter"
    ? [
        "issue_subject_line",
        "issue_deck",
        "issue_section_package",
        "issue_hook_variants",
        "issue_cta_variants",
        "issue_send_checklist",
        "newsletter_recap",
        "public_teaser",
        "short_summary",
      ]
    : projectMode === "screenplay"
      ? [
          "screenplay_beat_sheet",
          "screenplay_scene_pages",
          "short_summary",
          "public_teaser",
          "newsletter_recap",
        ]
      : projectMode === "comics"
        ? [
            "comic_page_beat_sheet",
            "short_summary",
            "public_teaser",
            "newsletter_recap",
          ]
        : projectMode === "game_writing"
          ? [
              "quest_handoff_sheet",
              "short_summary",
              "public_teaser",
              "newsletter_recap",
            ]
          : [
              "short_summary",
              "newsletter_recap",
              "public_teaser",
              "screenplay_beat_sheet",
              "comic_page_beat_sheet",
            ];
```

```ts
// src/app/lib/prompts/adaptation.ts
import {
  getComicsModeConfig,
  getGameWritingModeConfig,
  getNewsletterModeConfig,
  getProjectUnitLabel,
  getScreenplayModeConfig,
} from "../projectMode";

export function getAdaptationMaxTokens(
  outputType: AdaptationOutputType
): number {
  switch (outputType) {
    case "short_summary":
      return 350;
    case "public_teaser":
      return 450;
    case "issue_subject_line":
      return 300;
    case "issue_deck":
      return 350;
    case "issue_section_package":
      return 800;
    case "issue_cta_variants":
      return 450;
    case "issue_send_checklist":
      return 650;
    case "issue_hook_variants":
      return 650;
    case "newsletter_recap":
      return 800;
    case "screenplay_beat_sheet":
      return 1000;
    case "screenplay_scene_pages":
      return 1200;
    case "quest_handoff_sheet":
      return 1100;
    case "comic_page_beat_sheet":
      return 1000;
    default:
      return 800;
  }
}

function buildFormatInstructions(outputType: AdaptationOutputType): string {
  switch (outputType) {
    case "short_summary":
      return `FORMAT INSTRUCTIONS:
- Write one tight paragraph of 120 to 170 words.
- Capture the key turn, emotional movement, and source-unit consequence.
- Keep it grounded and spoiler-aware, but do not become vague.`;
    case "newsletter_recap":
      return `FORMAT INSTRUCTIONS:
- Start with a short headline on its own line.
- Then write 2 to 3 short recap paragraphs in a lively newsletter voice.
- End with a brief "Why it matters:" line.
- Keep the prose readable and audience-facing.`;
    case "screenplay_beat_sheet":
      return `FORMAT INSTRUCTIONS:
- Write 6 to 9 numbered beats.
- Each beat should be one or two sentences focused on visual action and dramatic movement.
- Use screenplay-friendly cues and scene logic, but stay in beat-sheet form rather than full script pages.
- Preserve the source unit's emotional turns and sequence of revelations.`;
    case "screenplay_scene_pages":
      return `FORMAT INSTRUCTIONS:
- Write screenplay scene pages in Fountain-compatible plain text.
- Use scene headings, action, dialogue, and transitions only when useful.
- Preserve the source unit's order of events, tone, and dramatic reveals.`;
    case "quest_handoff_sheet":
      return `FORMAT INSTRUCTIONS:
- Write a structured quest handoff with these headings:
  Premise
  Player Objective
  Core Stages
  Branch Highlights
  Key NPCs / Factions / Items
  Rewards / Consequences
  Open Implementation Notes
- Keep each section concise and production-facing.
- Preserve quest pressure, branch intent, and unresolved follow-up hooks.
- Do not turn this into pseudo-code or a full dialogue script.`;
    case "comic_page_beat_sheet":
      return `FORMAT INSTRUCTIONS:
- Write 4 to 8 numbered page beats.
- Focus on visual action, reveal placement, density shifts, and end-of-page pressure.
- Keep each beat to one or two sentences.
- Preserve the source page's continuity, not just its premise.`;
    default:
      return `FORMAT INSTRUCTIONS:
- Match the target output's label and goal closely.
- Preserve continuity, tone, and source-unit identity.
- Output only final artifact text with no commentary.`;
  }
}

function buildProjectContextBlock({
  storyTitle,
  projectMode,
  modeConfig,
  fandom,
  customFandom,
  characters,
  tone,
  tropes,
}: {
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  fandom: string;
  customFandom?: string;
  characters: string[];
  tone: string[];
  tropes: string[];
}): string {
  const gameWritingConfig = getGameWritingModeConfig({
    projectMode,
    modeConfig,
  });
  const comicsConfig = getComicsModeConfig({
    projectMode,
    modeConfig,
  });
  const newsletterConfig = getNewsletterModeConfig({
    projectMode,
    modeConfig,
  });
  const screenplayConfig = getScreenplayModeConfig({
    projectMode,
    modeConfig,
  });

  return [
    `${projectMode === "newsletter" ? "SERIES" : "STORY"}: ${storyTitle}`,
    projectMode === "newsletter"
      ? "MODE: Newsletter"
      : projectMode === "screenplay"
        ? "MODE: Screenplay"
        : projectMode === "comics"
          ? "MODE: Comics"
          : projectMode === "game_writing"
            ? "MODE: Game Writing"
            : `FANDOM: ${customFandom?.trim() || fandom || "Original work"}`,
    gameWritingConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${gameWritingConfig.draftingPreference}`
      : "",
    gameWritingConfig?.questEngine
      ? `QUEST ENGINE: ${gameWritingConfig.questEngine}`
      : "",
    comicsConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${comicsConfig.draftingPreference}`
      : "",
    characters.length > 0 ? `CORE CHARACTERS: ${characters.join(", ")}` : "",
    tone.length > 0 ? `TONE: ${tone.join(", ")}` : "",
    tropes.length > 0 ? `TROPES: ${tropes.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
```

```ts
// src/app/lib/storyExport.ts
import {
  formatNewsletterCadence,
  getComicsModeConfig,
  getGameWritingModeConfig,
  getProjectModeLabel,
  getProjectUnitLabel,
  getScreenplayModeConfig,
  isNewsletterStory,
} from "./projectMode.ts";

export function buildPlainTextStoryExport(story: Story): string {
  const lines = [`${story.title}\n`];
  lines.push(`Mode: ${getProjectModeLabel(story.projectMode)}`);

  if (isNewsletterStory(story)) {
    const modeConfig = story.modeConfig;
    if (modeConfig && "topic" in modeConfig) {
      lines.push(`Topic: ${modeConfig.topic}`);
      lines.push(`Audience: ${modeConfig.audience}`);
      lines.push(`Cadence: ${formatNewsletterCadence(modeConfig.cadence)}`);
      lines.push(`Current angle: ${modeConfig.issueAngle}`);
      if (modeConfig.subtitle) lines.push(`Subtitle: ${modeConfig.subtitle}`);
      if (modeConfig.hookApproach) lines.push(`Hook approach: ${modeConfig.hookApproach}`);
      if (modeConfig.ctaStyle) lines.push(`CTA style: ${modeConfig.ctaStyle}`);
      if (modeConfig.recurringSections?.length) {
        lines.push(`Recurring sections: ${modeConfig.recurringSections.join(", ")}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Voice: ${story.tone.join(", ")}`);
    }
  } else if (story.projectMode === "screenplay") {
    const modeConfig = getScreenplayModeConfig(story);
    if (modeConfig) {
      lines.push(`Drafting preference: ${modeConfig.draftingPreference}`);
      lines.push(`Format: ${modeConfig.formatStyle}`);
      if (modeConfig.storyEngine) {
        lines.push(`Story engine: ${modeConfig.storyEngine}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Tone: ${story.tone.join(", ")}`);
    }
  } else if (story.projectMode === "comics") {
    const modeConfig = getComicsModeConfig(story);
    if (modeConfig) {
      lines.push(`Drafting preference: ${modeConfig.draftingPreference}`);
      lines.push(`Format: ${modeConfig.formatStyle}`);
      if (modeConfig.seriesEngine) {
        lines.push(`Series engine: ${modeConfig.seriesEngine}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Tone: ${story.tone.join(", ")}`);
    }
  } else if (story.projectMode === "game_writing") {
    const modeConfig = getGameWritingModeConfig(story);
    if (modeConfig) {
      lines.push(`Drafting preference: ${modeConfig.draftingPreference}`);
      lines.push(`Format: ${modeConfig.formatStyle}`);
      if (modeConfig.questEngine) {
        lines.push(`Quest engine: ${modeConfig.questEngine}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Tone: ${story.tone.join(", ")}`);
    }
  } else {
    if (story.fandom) lines.push(`Fandom: ${story.customFandom || story.fandom}`);
    lines.push(`Characters: ${story.characters.join(", ")}`);
    lines.push(`Relationship: ${story.relationshipType.toUpperCase()}`);
    lines.push(`Rating: ${story.rating.charAt(0).toUpperCase() + story.rating.slice(1)}`);
    if (story.setting) lines.push(`Setting: ${story.setting}`);
    lines.push(`Tone: ${story.tone.join(", ")}`);
    if (story.tropes.length) lines.push(`Tropes: ${story.tropes.join(", ")}`);
  }

  lines.push(`\n${EXPORT_DIVIDER}\n`);

  story.chapters.forEach((chapter, index) => {
    lines.push(
      `${getProjectUnitLabel(story.projectMode, { capitalize: true })} ${index + 1}\n`
    );
    lines.push(chapter.content);
    lines.push(`\n${EXPORT_DIVIDER}\n`);
  });
}
```

```ts
// src/app/components/editor/AdaptTab.tsx
const OUTPUT_ICON_MAP: Partial<Record<AdaptationOutputType, LucideIcon>> = {
  screenplay_beat_sheet: Clapperboard,
  screenplay_scene_pages: FileText,
  comic_page_beat_sheet: PanelsTopLeft,
  quest_handoff_sheet: ScrollText,
};
```

- [x] **Step 4: Run the output/export tests again and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: PASS with quest-handoff output filtering, default output selection, and game-writing export behavior green.

- [x] **Step 5: Commit the output/export slice**

```bash
git add src/app/types/adaptation.ts src/app/lib/adaptations.ts src/app/lib/adaptations.test.ts src/app/lib/prompts/adaptation.ts src/app/lib/storyExport.ts src/app/lib/storyExport.test.ts src/app/components/editor/AdaptTab.tsx
git commit -m "feat: add quest handoff output"
```

### Task 4: Wire game-writing project creation and setup UI

**Files:**
- Create: `src/app/lib/gameWritingModeConfig.ts`
- Create: `src/app/lib/gameWritingModeConfig.test.ts`
- Create: `src/app/components/editor/GameWritingSetupPanel.tsx`
- Modify: `src/app/components/CreateStoryTab.tsx`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [x] **Step 1: Write the failing game-writing setup helper test**

```ts
// src/app/lib/gameWritingModeConfig.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GAME_WRITING_MODE_CONFIG,
  GAME_WRITING_QUEST_ENGINES,
  labelGameWritingQuestEngine,
} from "./gameWritingModeConfig.ts";

test("game writing mode config exposes default setup values", () => {
  assert.deepEqual(GAME_WRITING_QUEST_ENGINES, [
    "main_quest",
    "side_quest",
    "questline",
  ]);
  assert.deepEqual(DEFAULT_GAME_WRITING_MODE_CONFIG, {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine: "main_quest",
  });
});

test("labelGameWritingQuestEngine formats quest engine labels for UI", () => {
  assert.equal(labelGameWritingQuestEngine("main_quest"), "Main quest");
  assert.equal(labelGameWritingQuestEngine("side_quest"), "Side quest");
  assert.equal(labelGameWritingQuestEngine("questline"), "Questline");
});
```

- [x] **Step 2: Run the helper test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/gameWritingModeConfig.test.ts`

Expected: FAIL because the helper file does not exist yet.

- [x] **Step 3: Implement the shared game-writing setup helper and UI wiring**

```ts
// src/app/lib/gameWritingModeConfig.ts
import type {
  GameWritingModeConfig,
  GameWritingQuestEngine,
} from "../types/story";

export const GAME_WRITING_QUEST_ENGINES: GameWritingQuestEngine[] = [
  "main_quest",
  "side_quest",
  "questline",
];

export const DEFAULT_GAME_WRITING_MODE_CONFIG: GameWritingModeConfig = {
  draftingPreference: "hybrid_quest_brief",
  formatStyle: "quest_brief",
  questEngine: "main_quest",
};

export function labelGameWritingQuestEngine(value: GameWritingQuestEngine) {
  switch (value) {
    case "side_quest":
      return "Side quest";
    case "questline":
      return "Questline";
    default:
      return "Main quest";
  }
}
```

```tsx
// src/app/components/editor/GameWritingSetupPanel.tsx
"use client";

import { ChevronDown, Gamepad2 } from "lucide-react";
import {
  DEFAULT_GAME_WRITING_MODE_CONFIG,
  GAME_WRITING_QUEST_ENGINES,
  labelGameWritingQuestEngine,
} from "../../lib/gameWritingModeConfig";
import type { GameWritingModeConfig } from "../../types/story";

interface GameWritingSetupPanelProps {
  gameWritingConfigDraft: GameWritingModeConfig;
  savingGameWritingConfig: boolean;
  gameWritingConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: GameWritingModeConfig) => void;
}

export default function GameWritingSetupPanel({
  gameWritingConfigDraft,
  savingGameWritingConfig,
  gameWritingConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: GameWritingSetupPanelProps) {
  const selectedQuestEngine =
    gameWritingConfigDraft.questEngine
    ?? DEFAULT_GAME_WRITING_MODE_CONFIG.questEngine;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Game writing setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control how future quests generate and how scope pressure is framed.
            Existing quests stay untouched.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSetup}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            showSetup
              ? "border-zinc-600 bg-zinc-900 text-white"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
          }`}
        >
          {showSetup ? "Hide setup" : "Open setup"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showSetup ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {showSetup && (
        <div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-200">
                <Gamepad2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Future generation defaults
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Game-writing v1 always drafts as hybrid quest briefs. The quest engine
                  shapes scope, consequence pressure, and payoff horizon.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {GAME_WRITING_QUEST_ENGINES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onConfigChange({
                    ...gameWritingConfigDraft,
                    questEngine: option,
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedQuestEngine === option
                    ? "border-sky-500 bg-sky-500/15 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {labelGameWritingQuestEngine(option)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 ${savingGameWritingConfig ? "border-sky-500/40 bg-sky-500/10 text-sky-200" : "border-zinc-700 bg-zinc-950/80 text-zinc-300"}`}>
              {savingGameWritingConfig ? "Saving game-writing setup..." : "Game-writing setup saved automatically"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Drafting: Hybrid quest brief
            </span>
          </div>

          {gameWritingConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {gameWritingConfigError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

```tsx
// src/app/components/CreateStoryTab.tsx
import { BookOpen, Clapperboard, ChevronDown, Gamepad2, Loader2, Mail, PanelsTopLeft, Sparkles } from "lucide-react";
import type {
  ComicsSeriesEngine,
  GameWritingQuestEngine,
  NewsletterCadence,
  ProjectMode,
  Rating,
  RelationshipType,
  ScreenplayDraftingPreference,
  ScreenplayStoryEngine,
  Story,
  StoryFormData,
} from "../types/story";
import {
  DEFAULT_GAME_WRITING_MODE_CONFIG,
  GAME_WRITING_QUEST_ENGINES,
  labelGameWritingQuestEngine,
} from "../lib/gameWritingModeConfig";

const [gameWritingTitle, setGameWritingTitle] = useState("");
const [gameWritingTone, setGameWritingTone] = useState<string[]>([]);
const [gameWritingQuestEngine, setGameWritingQuestEngine] =
  useState<GameWritingQuestEngine>(
    DEFAULT_GAME_WRITING_MODE_CONFIG.questEngine ?? "main_quest"
  );
const [showGameWritingOptions, setShowGameWritingOptions] = useState(false);

const canSubmit =
  projectMode === "fiction"
    ? filledCharacters.length >= 2 && fictionTone.length >= 1 && !busy
    : projectMode === "newsletter"
      ? newsletterTitle.trim().length >= 2
        && newsletterTopic.trim().length >= 3
        && newsletterAudience.trim().length >= 3
        && newsletterIssueAngle.trim().length >= 8
        && newsletterTone.length >= 1
        && !busy
      : projectMode === "screenplay"
        ? screenplayTitle.trim().length >= 2 && screenplayTone.length >= 1 && !busy
        : projectMode === "comics"
          ? comicsTitle.trim().length >= 2 && comicsTone.length >= 1 && !busy
          : gameWritingTitle.trim().length >= 2 && gameWritingTone.length >= 1 && !busy;

if (projectMode === "game_writing") {
  const formData: StoryFormData = {
    projectMode: "game_writing",
    title: gameWritingTitle.trim(),
    tone: gameWritingTone,
    questEngine: gameWritingQuestEngine,
  };

  const story = await createStoryInDB({
    title: gameWritingTitle.trim(),
    projectMode: "game_writing",
    modeConfig: {
      ...DEFAULT_GAME_WRITING_MODE_CONFIG,
      questEngine: gameWritingQuestEngine,
    },
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: gameWritingTone,
    tropes: [],
  });

  if (!story) {
    throw new Error("Please sign in before creating a new project.");
  }

  onStoryCreated(story, formData);
  return;
}

<ModeButton
  label="Game Writing"
  active={projectMode === "game_writing"}
  onClick={() => setProjectMode("game_writing")}
/>

{projectMode === "game_writing" && (
  <>
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-sky-500/15 p-2 text-sky-200">
          <Gamepad2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">
            Game Writing
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Start with a title, tone, and quest scope so future quests know how
            hard to push consequence and follow-up pressure.
          </p>
        </div>
      </div>
    </div>

    <Field
      label="Project title"
      helper="This is the working title and will stay attached to the game-writing project."
    >
      <input
        type="text"
        value={gameWritingTitle}
        onChange={(event) => setGameWritingTitle(event.target.value)}
        placeholder="Ashes of Red Hollow"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
      />
    </Field>

    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">Tone</p>
      <p className="mb-3 text-xs leading-5 text-zinc-500">
        Pick the narrative energy the system should preserve across quests.
      </p>
      <ToneSelector
        label="Tone"
        showLabel={false}
        selected={gameWritingTone}
        onChange={setGameWritingTone}
      />
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <button
        type="button"
        onClick={() => setShowGameWritingOptions((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-white">More options</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Quest scope and future consequence defaults.
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${showGameWritingOptions ? "rotate-180" : ""}`}
        />
      </button>

      {showGameWritingOptions && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-300">Quest engine</p>
          <div className="flex flex-wrap gap-2">
            {GAME_WRITING_QUEST_ENGINES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGameWritingQuestEngine(option)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  gameWritingQuestEngine === option
                    ? "border-sky-500 bg-sky-500/15 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {labelGameWritingQuestEngine(option)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </>
)}
```

```tsx
// src/app/components/editor/ArtifactsTab.tsx
import {
  getComicsModeConfig,
  getGameWritingModeConfig,
  getNewsletterModeConfig,
  getProjectUnitLabel,
  getScreenplayModeConfig,
} from "../../lib/projectMode";
import type {
  ComicsModeConfig,
  GameWritingModeConfig,
  NewsletterModeConfig,
  ProjectMode,
  ScreenplayModeConfig,
  StoryModeConfig,
} from "../../types/story";
import GameWritingSetupPanel from "./GameWritingSetupPanel";

const gameWritingModeConfig = useMemo(
  () =>
    getGameWritingModeConfig({
      projectMode,
      modeConfig,
    }),
  [modeConfig, projectMode]
);

const [gameWritingConfigDraft, setGameWritingConfigDraft] =
  useState<GameWritingModeConfig | null>(gameWritingModeConfig);
const [savingGameWritingConfig, setSavingGameWritingConfig] = useState(false);
const [gameWritingConfigError, setGameWritingConfigError] = useState<string | null>(null);
const [showGameWritingSetup, setShowGameWritingSetup] = useState(false);
const gameWritingConfigTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  setGameWritingConfigDraft(gameWritingModeConfig);
}, [gameWritingModeConfig]);

const handleGameWritingConfigChange = (nextValue: GameWritingModeConfig) => {
  setGameWritingConfigDraft(nextValue);
  setGameWritingConfigError(null);

  if (gameWritingConfigTimerRef.current) {
    clearTimeout(gameWritingConfigTimerRef.current);
  }

  gameWritingConfigTimerRef.current = setTimeout(() => {
    setSavingGameWritingConfig(true);
    void requestJson<{ modeConfig: GameWritingModeConfig }>(
      `/api/stories/${storyId}/mode-config`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modeConfig: nextValue }),
      }
    )
      .then((data) => {
        setGameWritingConfigDraft(data.modeConfig);
        onModeConfigUpdated?.(data.modeConfig);
      })
      .catch((error: unknown) => {
        setGameWritingConfigError(
          getErrorMessage(error, "Failed to save game-writing setup")
        );
      })
      .finally(() => {
        setSavingGameWritingConfig(false);
      });
  }, 700);
};

{projectMode === "game_writing" && gameWritingConfigDraft && (
  <GameWritingSetupPanel
    gameWritingConfigDraft={gameWritingConfigDraft}
    savingGameWritingConfig={savingGameWritingConfig}
    gameWritingConfigError={gameWritingConfigError}
    showSetup={showGameWritingSetup}
    onToggleSetup={() => setShowGameWritingSetup((prev) => !prev)}
    onConfigChange={handleGameWritingConfigChange}
  />
)}
```

- [x] **Step 4: Run the helper test again and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/gameWritingModeConfig.test.ts`

Expected: PASS with default config values and quest-engine labels green.

- [x] **Step 5: Run TypeScript to catch wiring mistakes**

Run: `npx tsc --noEmit`

Expected: PASS with the new game-writing form state, mode config, and setup panel fully typed.

- [x] **Step 6: Run lint to catch React and import issues**

Run: `npm run lint`

Expected: PASS with no new lint errors in `CreateStoryTab`, `ArtifactsTab`, or `GameWritingSetupPanel`.

- [x] **Step 7: Commit the setup flow**

```bash
git add src/app/lib/gameWritingModeConfig.ts src/app/lib/gameWritingModeConfig.test.ts src/app/components/editor/GameWritingSetupPanel.tsx src/app/components/CreateStoryTab.tsx src/app/components/editor/ArtifactsTab.tsx
git commit -m "feat: add game writing project setup flow"
```

### Task 5: Record rollout status and run final verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-04-06-game-writing-mode.md`

- [x] **Step 1: Update product status and check off the completed plan**

```md
<!-- CLAUDE.md -->
14. Comics mode v1 (page-based comic scripting, comics-native planning/memory semantics, comic beat-sheet output, structured text export)
15. Game writing mode v1 (quest-based drafting, systems-aware quest memory, quest handoff output, structured text export)

**Phase C: Mode Pack Expansion** (in progress)
1. Screenplay mode - scenes, beat sheets, act structure, formatted output (completed 2026-04-06)
2. Comics / graphic narrative mode - pages/panels, visual pacing, script format (completed 2026-04-06)
3. Game writing / narrative design mode - quests, branching, dialogue trees (completed 2026-04-06)
4. Non-fiction / articles / essays mode - sections, arguments, sources, bibliography
```

```md
<!-- docs/superpowers/plans/2026-04-06-game-writing-mode.md -->
- [x] **Step 1: Write the failing game-writing mode helper tests**
- [x] **Step 2: Run the failing mode tests**
- [x] **Step 3: Implement the game-writing type, mode, planning, and migration foundation**
- [x] **Step 4: Run the mode tests again and verify they pass**
- [x] **Step 5: Commit the game-writing foundation**
```

- [x] **Step 2: Run the focused game-writing regression suite**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts src/app/lib/prompts/gameWriting.test.ts src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts src/app/lib/gameWritingModeConfig.test.ts`

Expected: PASS with game-writing mode foundation, planning phrasing, prompt behavior, outputs, export, and setup helpers all green.

- [x] **Step 3: Run the full typecheck**

Run: `npx tsc --noEmit`

Expected: PASS

- [x] **Step 4: Run lint**

Run: `npm run lint`

Expected: PASS

- [x] **Step 5: Commit the rollout docs**

```bash
git add CLAUDE.md docs/superpowers/plans/2026-04-06-game-writing-mode.md
git commit -m "docs: record game writing mode rollout"
```
