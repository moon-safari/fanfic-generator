# Screenplay Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add screenplay as a first-class project mode with a durable drafting preference, screenplay-native prompts/planning/memory defaults, screenplay outputs, and screenplay-aware export.

**Architecture:** Extend the existing mode-pack system rather than creating a screenplay-only subsystem. Screenplay becomes a third `ProjectMode`, stores a small `ScreenplayModeConfig`, plugs into shared prompt/context/adaptation helpers, and adds a focused screenplay setup surface plus a mode-aware export helper that can emit `.fountain` when the canonical draft is script pages.

**Tech Stack:** TypeScript, Next.js App Router, React, Node test runner, Supabase, ESLint

---

### Task 1: Add screenplay domain types and mode-pack foundation

**Files:**
- Create: `src/app/lib/projectMode.test.ts`
- Create: `src/app/lib/modes/screenplay.ts`
- Modify: `src/app/types/story.ts`
- Modify: `src/app/lib/projectMode.ts`
- Modify: `src/app/lib/modes/planning.ts`
- Modify: `src/app/lib/modes/registry.ts`

- [x] **Step 1: Write the failing screenplay mode helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
  getProjectModeLabel,
  getProjectUnitLabel,
  parseScreenplayModeConfig,
} from "./projectMode.ts";
import { getModeConfig } from "./modes/registry.ts";

test("screenplay mode exposes scene labels and screenplay defaults", () => {
  const mode = getModeConfig("screenplay");

  assert.equal(getProjectModeLabel("screenplay"), "Screenplay");
  assert.equal(getProjectUnitLabel("screenplay"), "scene");
  assert.equal(
    getProjectUnitLabel("screenplay", { capitalize: true }),
    "Scene"
  );
  assert.equal(getContinueActionLabel("screenplay"), "Continue Scene");
  assert.equal(
    getLoadingContinueLabel("screenplay"),
    "Writing the next scene..."
  );
  assert.equal(mode.contentUnitSingular, "scene");
  assert.equal(mode.planningSchema.outline.description, "Scene-by-scene plan and status map.");
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "prop",
    "faction",
    "setpiece",
    "theme",
  ]);
});

test("parseScreenplayModeConfig normalizes valid screenplay config", () => {
  const parsed = parseScreenplayModeConfig({
    draftingPreference: "script_pages",
    formatStyle: "fountain",
    storyEngine: "pilot",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "script_pages",
    formatStyle: "fountain",
    storyEngine: "pilot",
  });
});

test("parseScreenplayModeConfig rejects incomplete screenplay config", () => {
  assert.equal(parseScreenplayModeConfig({ draftingPreference: "script_pages" }), null);
  assert.equal(parseScreenplayModeConfig({ formatStyle: "fountain" }), null);
});
```

- [x] **Step 2: Run the new mode-helper test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts`

Expected: FAIL because `screenplay` is not yet part of `ProjectMode`, the registry has no screenplay mode, and screenplay parsing/label helpers do not exist.

- [x] **Step 3: Implement the minimal screenplay type, helper, and registry foundation**

```ts
// src/app/types/story.ts
export type ProjectMode = "fiction" | "newsletter" | "screenplay";

export type ScreenplayDraftingPreference = "script_pages" | "beat_draft";
export type ScreenplayStoryEngine = "feature" | "pilot" | "short";

export interface ScreenplayModeConfig {
  draftingPreference: ScreenplayDraftingPreference;
  formatStyle: "fountain";
  storyEngine?: ScreenplayStoryEngine;
}

export interface ScreenplayStoryFormData {
  projectMode: "screenplay";
  title: string;
  draftingPreference: ScreenplayDraftingPreference;
  tone: string[];
  storyEngine?: ScreenplayStoryEngine;
}

export type StoryModeConfig =
  | Record<string, never>
  | NewsletterModeConfig
  | ScreenplayModeConfig;

export type StoryFormData =
  | FictionStoryFormData
  | NewsletterStoryFormData
  | ScreenplayStoryFormData;
```

```ts
// src/app/lib/projectMode.ts
export function isScreenplayFormData(
  value: StoryFormData
): value is ScreenplayStoryFormData {
  return value.projectMode === "screenplay";
}

export function getScreenplayModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): ScreenplayModeConfig | null {
  if (story.projectMode !== "screenplay" || !story.modeConfig) {
    return null;
  }

  return parseScreenplayModeConfig(story.modeConfig);
}

export function parseScreenplayModeConfig(
  input: unknown
): ScreenplayModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<ScreenplayModeConfig>;
  if (
    (candidate.draftingPreference !== "script_pages"
      && candidate.draftingPreference !== "beat_draft")
    || candidate.formatStyle !== "fountain"
  ) {
    return null;
  }

  return {
    draftingPreference: candidate.draftingPreference,
    formatStyle: "fountain",
    storyEngine:
      candidate.storyEngine === "feature"
      || candidate.storyEngine === "pilot"
      || candidate.storyEngine === "short"
        ? candidate.storyEngine
        : undefined,
  };
}
```

```ts
// src/app/lib/projectMode.ts
export function getProjectModeLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Newsletter";
  if (mode === "screenplay") return "Screenplay";
  return "Fiction";
}

export function getProjectUnitLabel(
  mode: ProjectMode,
  options: { count?: number; capitalize?: boolean; abbreviated?: boolean } = {}
): string {
  if (mode === "screenplay") {
    const { count = 1, capitalize = false, abbreviated = false } = options;
    const singular = abbreviated
      ? "Sc."
      : capitalize
        ? "Scene"
        : "scene";
    const plural = capitalize ? "Scenes" : "scenes";
    return count === 1 ? singular : plural;
  }

  // existing fiction / newsletter branches remain
}

export function getContinueActionLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Continue Issue";
  if (mode === "screenplay") return "Continue Scene";
  return "Continue Story";
}

export function getLoadingContinueLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Writing the next issue...";
  if (mode === "screenplay") return "Writing the next scene...";
  return "Writing the next chapter...";
}
```

```ts
// src/app/lib/modes/screenplay.ts
import {
  buildScreenplayPlanningPrompt,
} from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildScreenplayMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[]
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
    .map((entry) => `- ${entry.name} (${entry.entryType})${entry.description ? `: ${entry.description.slice(0, 100)}` : ""}`)
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
    description: "Act pressure, character arcs, motifs, and unresolved setup-payoff obligations.",
    emptyLabel: "Capture act pressure, motifs, and unresolved setup-payoff threads...",
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
```

```ts
// src/app/lib/modes/planning.ts
export function buildScreenplayPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "CHARACTER AND ACT PRESSURE TO HONOR:",
    dueHeadingPrefix: "SETUP-PAYOFF THREADS DUE BY",
    openHeading: "OTHER OPEN SETUP-PAYOFF THREADS:",
    notesHeading: "STORY NOTES",
    keyRevealLabel: "Expected turn or reveal",
    openLoopsLabel: (unitLabelLowercase) =>
      `Threads meant to stay open after this ${unitLabelLowercase}`,
  });
}
```

```ts
// src/app/lib/modes/registry.ts
import { screenplayMode } from "./screenplay.ts";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
  screenplay: screenplayMode,
};
```

- [x] **Step 4: Run the mode-helper test and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts`

Expected: PASS with screenplay labels, config parsing, and mode registry behavior all green.

- [x] **Step 5: Commit the screenplay mode foundation**

```bash
git add src/app/lib/projectMode.test.ts src/app/lib/modes/screenplay.ts src/app/types/story.ts src/app/lib/projectMode.ts src/app/lib/modes/planning.ts src/app/lib/modes/registry.ts
git commit -m "feat: add screenplay mode foundation"
```

### Task 2: Add screenplay scene-generation and planning-aware prompt builders

**Files:**
- Create: `src/app/lib/prompts/screenplay.test.ts`
- Create: `src/app/lib/prompts/screenplay.ts`
- Modify: `src/app/lib/prompts/index.ts`
- Modify: `src/app/lib/prompts/bible.ts`
- Modify: `src/app/hooks/useStoryStreaming.ts`

- [x] **Step 1: Write the failing screenplay prompt tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const screenplayForm = {
  projectMode: "screenplay" as const,
  title: "Glass Hour",
  draftingPreference: "script_pages" as const,
  tone: ["tense", "visual"],
  storyEngine: "pilot" as const,
};

const screenplayStory: Story = {
  id: "story-1",
  title: "Glass Hour",
  projectMode: "screenplay",
  modeConfig: {
    draftingPreference: "beat_draft",
    formatStyle: "fountain",
    storyEngine: "pilot",
  },
  chapters: [
    {
      id: "scene-1",
      chapterNumber: 1,
      content: "INT. SUBWAY PLATFORM - NIGHT\nMara waits as the train screams in.",
      summary: "Mara waits for the handoff.",
      wordCount: 13,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["tense", "visual"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 13,
};

test("screenplay scene-one prompt uses fountain instructions for script pages", () => {
  const prompt = buildChapter1Prompt(screenplayForm);

  assert.match(prompt, /^Title: Glass Hour/m);
  assert.match(prompt, /Write Scene 1/i);
  assert.match(prompt, /Fountain-compatible/i);
  assert.doesNotMatch(prompt, /Write Chapter 1/i);
});

test("screenplay continuation prompt uses scene language and beat-draft guidance", () => {
  const prompt = buildContinuationPrompt(
    screenplayStory,
    2,
    "=== MEMORY ===\nMara carries the briefcase.",
    "=== PLANNING GUIDANCE ===\nTARGET SCENE PLAN:\n- Intent: Force the handoff into the open."
  );

  assert.match(prompt, /SCENE 2 INSTRUCTIONS:/);
  assert.match(prompt, /scene-beat draft/i);
  assert.doesNotMatch(prompt, /CHAPTER 2 INSTRUCTIONS:/);
});

test("screenplay bible generation prompt asks for scene planning rather than chapters", () => {
  const prompt = buildBibleGenerationPrompt("INT. SUBWAY PLATFORM - NIGHT", {
    storyTitle: "Glass Hour",
    fandomContext: "",
    projectMode: "screenplay",
    modeConfig: {
      draftingPreference: "script_pages",
      formatStyle: "fountain",
      storyEngine: "pilot",
    },
  });

  assert.match(prompt, /serialized screenplay/i);
  assert.match(prompt, /Scene 1/i);
  assert.match(prompt, /scene-by-scene/i);
  assert.doesNotMatch(prompt, /Issue 1/i);
});
```

- [x] **Step 2: Run the screenplay prompt test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/screenplay.test.ts`

Expected: FAIL because screenplay branches do not yet exist in the main generation/continuation/story-bible prompt builders.

- [x] **Step 3: Implement the screenplay prompt builders and dispatcher branches**

```ts
// src/app/lib/prompts/screenplay.ts
import { getScreenplayModeConfig } from "../projectMode";
import type {
  ScreenplayStoryFormData,
  Story,
} from "../../types/story";

export function buildScreenplayScene1Prompt(
  form: ScreenplayStoryFormData
): string {
  const tone = form.tone.join(" + ");
  const formatSection =
    form.draftingPreference === "script_pages"
      ? `Write Scene 1 as Fountain-compatible screenplay pages.
- Use a clear slug line.
- Keep action visual and concise.
- Use dialogue only when it sharpens the dramatic turn.
- Output screenplay text, not prose paragraphs.`
      : `Write Scene 1 as a scene-beat draft.
- Focus on objective, pressure, turn, and scene-end propulsion.
- Keep it visual and playable.
- Do not write full screenplay pages yet.`;

  return `You are a sharp screenwriter building the opening scene of a screenplay project.

TITLE: ${form.title}
TONE: ${tone}
${form.storyEngine ? `STORY ENGINE: ${form.storyEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: ${form.draftingPreference}

${formatSection}

SCENE 1 GOALS:
1. Start with an immediate visual hook.
2. Establish pressure quickly.
3. End the scene with a turn, reveal, or propulsion beat.
4. Keep the writing lean, specific, and screenable.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Scene 1 text only]`;
}

export function buildScreenplayContinuationPrompt(
  story: Story,
  sceneNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getScreenplayModeConfig(story);
  const draftingPreference = modeConfig?.draftingPreference ?? "script_pages";
  const sceneHistory = story.chapters
    .map((scene, index) => {
      const isRecent = index >= story.chapters.length - 2;
      const label = `Scene ${index + 1}`;
      if (isRecent) {
        return `--- ${label} ---\n${scene.content}`;
      }
      if (scene.summary) {
        return `--- ${label} (Summary) ---\n${scene.summary}`;
      }
      return `--- ${label} ---\n${scene.content}`;
    })
    .join("\n\n");

  const formatInstruction =
    draftingPreference === "script_pages"
      ? "Write the next scene as Fountain-compatible screenplay pages."
      : "Write the next scene as a scene-beat draft that can later convert cleanly into screenplay pages.";

  return `You are continuing a screenplay project.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: ${draftingPreference}
${modeConfig?.storyEngine ? `STORY ENGINE: ${modeConfig.storyEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS SCENES:
${sceneHistory}

SCENE ${sceneNumber} INSTRUCTIONS:
1. Continue directly from the prior scene's dramatic pressure.
2. Keep scene logic, blocking consequences, and payoff obligations coherent.
3. ${formatInstruction}
4. End with momentum into the next scene rather than summary.

Write Scene ${sceneNumber} now (scene text only):`;
}
```

```ts
// src/app/lib/prompts/index.ts
import { isNewsletterFormData, isScreenplayFormData } from "../projectMode";
import {
  buildScreenplayScene1Prompt,
  buildScreenplayContinuationPrompt,
} from "./screenplay";

export function buildChapter1Prompt(form: StoryFormData): string {
  if (isNewsletterFormData(form)) {
    return buildNewsletterIssue1Prompt(form);
  }

  if (isScreenplayFormData(form)) {
    return buildScreenplayScene1Prompt(form);
  }

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
if (options.projectMode === "screenplay") {
  const modeConfig = options.modeConfig;
  const draftingPreference =
    modeConfig && "draftingPreference" in modeConfig
      ? modeConfig.draftingPreference
      : "script_pages";
  const storyEngine =
    modeConfig && "storyEngine" in modeConfig ? modeConfig.storyEngine : "";

  return `You are a screenplay story-memory analyst. Extract reusable project truth and planning from the opening scene of a serialized screenplay.

SCREENPLAY CONTEXT:
- Title: ${options.storyTitle}
- Drafting preference: ${draftingPreference}
${storyEngine ? `- Story engine: ${storyEngine}` : ""}

Return ONLY a valid JSON object with exactly this structure...

{
  "synopsis": {
    "text": "2-3 sentence synopsis of the screenplay premise and what Scene 1 establishes"
  },
  "outline": {
    "chapters": [
      {
        "number": 1,
        "title": "Scene 1",
        "summary": "What the opening scene does",
        "intent": "What dramatic job the scene is doing",
        "keyReveal": "The scene's main turn or reveal",
        "openLoops": ["What must carry forward into later scenes"],
        "status": "written"
      }
    ]
  },
  "notes": {
    "text": "Act pressure, motifs, and setup-payoff obligations to preserve",
    "arcs": [],
    "threads": []
  }
}

OPENING SCENE TEXT:
${chapter1}`;
}
```

```ts
// src/app/hooks/useStoryStreaming.ts
const initialFailureMessage =
  storyRef.current.projectMode === "newsletter"
    ? "Failed to generate the first issue"
    : storyRef.current.projectMode === "screenplay"
      ? "Failed to generate the first scene"
      : "Failed to generate story";

const continueFailureMessage =
  story.projectMode === "newsletter"
    ? "Failed to continue the issue sequence"
    : story.projectMode === "screenplay"
      ? "Failed to continue the screenplay"
      : "Failed to continue story";
```

- [x] **Step 4: Run the screenplay prompt test and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/screenplay.test.ts`

Expected: PASS with screenplay-specific scene prompts and screenplay story-bible generation prompt wording.

- [x] **Step 5: Commit the screenplay prompt layer**

```bash
git add src/app/lib/prompts/screenplay.test.ts src/app/lib/prompts/screenplay.ts src/app/lib/prompts/index.ts src/app/lib/prompts/bible.ts src/app/hooks/useStoryStreaming.ts
git commit -m "feat: add screenplay drafting prompts"
```

### Task 3: Add screenplay outputs, preference-aware defaults, and export formatting

**Files:**
- Create: `src/app/lib/adaptations.test.ts`
- Create: `src/app/lib/storyExport.ts`
- Create: `src/app/lib/storyExport.test.ts`
- Modify: `src/app/types/adaptation.ts`
- Modify: `src/app/lib/adaptations.ts`
- Modify: `src/app/lib/prompts/adaptation.ts`
- Modify: `src/app/hooks/useChapterAdaptation.ts`
- Modify: `src/app/components/editor/AdaptTab.tsx`
- Modify: `src/app/components/editor/StoryEditor.tsx`
- Modify: `src/app/components/StoryViewer.tsx`

- [x] **Step 1: Write the failing outputs/export tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdaptationPresetsForMode,
  getDefaultAdaptationOutputType,
} from "./adaptations.ts";
import { buildStoryExportFile } from "./storyExport.ts";
import type { Story } from "../types/story.ts";

test("screenplay mode exposes screenplay-only outputs", () => {
  const presets = getAdaptationPresetsForMode("screenplay", {
    draftingPreference: "script_pages",
    formatStyle: "fountain",
  });

  assert.equal(presets.some((preset) => preset.type === "screenplay_scene_pages"), true);
  assert.equal(presets.some((preset) => preset.type === "screenplay_beat_sheet"), true);
});

test("screenplay preference changes the default output emphasis", () => {
  assert.equal(
    getDefaultAdaptationOutputType("screenplay", {
      draftingPreference: "script_pages",
      formatStyle: "fountain",
    }),
    "screenplay_beat_sheet"
  );

  assert.equal(
    getDefaultAdaptationOutputType("screenplay", {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
    }),
    "screenplay_scene_pages"
  );
});

test("screenplay script pages export as fountain", () => {
  const story: Story = {
    id: "screenplay-1",
    title: "Glass Hour",
    projectMode: "screenplay",
    modeConfig: {
      draftingPreference: "script_pages",
      formatStyle: "fountain",
    },
    chapters: [
      {
        id: "scene-1",
        chapterNumber: 1,
        content: "INT. SUBWAY PLATFORM - NIGHT\nMara waits with the briefcase.",
        wordCount: 9,
      },
    ],
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: ["tense"],
    tropes: [],
    createdAt: "",
    updatedAt: "",
    wordCount: 9,
  };

  const file = buildStoryExportFile(story);

  assert.equal(file.extension, "fountain");
  assert.equal(file.mimeType, "text/plain;charset=utf-8");
  assert.match(file.filename, /^Glass_Hour\.fountain$/);
  assert.match(file.content, /^Title: Glass Hour/m);
  assert.match(file.content, /INT\. SUBWAY PLATFORM - NIGHT/);
});
```

- [x] **Step 2: Run the outputs/export tests and verify they fail**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: FAIL because screenplay does not yet have a dedicated `screenplay_scene_pages` output, adaptation defaults do not consider screenplay preference, and export still always returns `.txt`.

- [x] **Step 3: Implement screenplay output types, ordering, and export**

```ts
// src/app/types/adaptation.ts
export type AdaptationOutputType =
  | "short_summary"
  | "newsletter_recap"
  | "public_teaser"
  | "screenplay_beat_sheet"
  | "screenplay_scene_pages"
  | "issue_subject_line"
  | "issue_deck"
  | "issue_section_package"
  | "issue_hook_variants"
  | "issue_cta_variants"
  | "issue_send_checklist";
```

```ts
// src/app/lib/adaptations.ts
import { getScreenplayModeConfig } from "./projectMode";
import type { ProjectMode, StoryModeConfig } from "../types/story";

export function getAdaptationPresetsForMode(
  projectMode: ProjectMode,
  modeConfig?: StoryModeConfig
): AdaptationPreset[] {
  const filtered = ADAPTATION_PRESETS.filter(
    (preset) =>
      !preset.supportedModes || preset.supportedModes.includes(projectMode)
  );

  const screenplayConfig =
    projectMode === "screenplay"
      ? getScreenplayModeConfig({ projectMode, modeConfig })
      : null;

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
        ? screenplayConfig?.draftingPreference === "beat_draft"
          ? [
              "screenplay_scene_pages",
              "screenplay_beat_sheet",
              "short_summary",
              "public_teaser",
            ]
          : [
              "screenplay_beat_sheet",
              "screenplay_scene_pages",
              "short_summary",
              "public_teaser",
            ]
        : [
            "short_summary",
            "newsletter_recap",
            "public_teaser",
            "screenplay_beat_sheet",
          ];

  return filtered.sort(
    (left, right) =>
      preferredOrder.indexOf(left.type) - preferredOrder.indexOf(right.type)
  );
}

export function getDefaultAdaptationOutputType(
  projectMode: ProjectMode,
  modeConfig?: StoryModeConfig
): AdaptationOutputType {
  return getAdaptationPresetsForMode(projectMode, modeConfig)[0]?.type ?? "short_summary";
}
```

```ts
// src/app/lib/adaptations.ts
{
  type: "screenplay_beat_sheet",
  label: "Screenplay Beat Sheet",
  description: "Translate the source scene into visual beats for revision or packaging.",
  stateSources: ["draft", "memory", "plans", "saved_outputs"],
  supportingOutputTypes: ["short_summary"],
  supportedModes: ["screenplay"],
},
{
  type: "screenplay_scene_pages",
  label: "Screenplay Scene Pages",
  description: "Convert the source material into Fountain-compatible screenplay scene pages.",
  stateSources: ["draft", "memory", "plans", "saved_outputs"],
  supportingOutputTypes: ["short_summary", "screenplay_beat_sheet"],
  supportedModes: ["screenplay"],
},
```

```ts
// src/app/lib/storyExport.ts
import { getProjectModeLabel, getProjectUnitLabel, getScreenplayModeConfig } from "./projectMode";
import type { Story } from "../types/story";

export interface StoryExportFile {
  filename: string;
  extension: "txt" | "fountain";
  mimeType: string;
  content: string;
}

export function buildStoryExportFile(story: Story): StoryExportFile {
  const safeTitle = story.title.replace(/[^a-zA-Z0-9]/g, "_") || "untitled";
  const screenplayConfig = getScreenplayModeConfig(story);

  if (
    story.projectMode === "screenplay"
    && screenplayConfig?.draftingPreference === "script_pages"
  ) {
    const header = [`Title: ${story.title}`, ""];
    const scenes = story.chapters.map((chapter) => chapter.content.trim()).join("\n\n");
    return {
      filename: `${safeTitle}.fountain`,
      extension: "fountain",
      mimeType: "text/plain;charset=utf-8",
      content: [...header, scenes].join("\n"),
    };
  }

  return {
    filename: `${safeTitle}.txt`,
    extension: "txt",
    mimeType: "text/plain;charset=utf-8",
    content: buildPlainTextStoryExport(story),
  };
}
```

```ts
// src/app/lib/prompts/adaptation.ts
if (outputType === "screenplay_scene_pages") {
  return `Transform the source material into Fountain-compatible screenplay scene pages.

Requirements:
- Use scene headings where needed.
- Keep action visual and concise.
- Preserve established facts from draft, memory, and planning.
- Output screenplay text only.`;
}
```

```ts
// src/app/hooks/useChapterAdaptation.ts
import type { ProjectMode, StoryModeConfig } from "../types/story";

export function useChapterAdaptation(
  storyId: string,
  projectMode: ProjectMode,
  modeConfig?: StoryModeConfig,
  chapterId?: string
) {
  const [activeOutputType, setActiveOutputType] =
    useState<AdaptationOutputType>(() => getDefaultOutputType(projectMode, modeConfig));

  // same idea for chain defaults and the mode-change effect
}
```

- [x] **Step 4: Wire export and adaptation consumers to the new helpers**

Update these usage points so they pass `story.modeConfig` and consume the structured export file:

```ts
// src/app/components/editor/StoryEditor.tsx
const adaptation = useChapterAdaptation(
  story.id,
  story.projectMode,
  story.modeConfig,
  chapter?.id
);

const exportFile = buildStoryExportFile(story);
const blob = new Blob([exportFile.content], { type: exportFile.mimeType });
a.download = exportFile.filename;
```

```ts
// src/app/components/StoryViewer.tsx
const exportFile = buildStoryExportFile(story);
const blob = new Blob([exportFile.content], { type: exportFile.mimeType });
a.download = exportFile.filename;
```

In `AdaptTab.tsx`, make sure the default selection copy and preset list come from the new screenplay-aware adaptation helpers so the chosen drafting preference is reflected immediately.

- [x] **Step 5: Run the outputs/export tests and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: PASS with screenplay-only outputs available, preference-aware ordering/defaults, and `.fountain` export for script-pages projects.

- [x] **Step 6: Commit the screenplay output/export layer**

```bash
git add src/app/lib/adaptations.test.ts src/app/lib/storyExport.ts src/app/lib/storyExport.test.ts src/app/types/adaptation.ts src/app/lib/adaptations.ts src/app/lib/prompts/adaptation.ts src/app/hooks/useChapterAdaptation.ts src/app/components/editor/AdaptTab.tsx src/app/components/editor/StoryEditor.tsx src/app/components/StoryViewer.tsx
git commit -m "feat: add screenplay outputs and export"
```

### Task 4: Add screenplay project creation and editable setup surfaces

**Files:**
- Modify: `src/app/lib/projectMode.test.ts`
- Create: `src/app/components/editor/ScreenplaySetupPanel.tsx`
- Modify: `src/app/components/CreateStoryTab.tsx`
- Modify: `src/app/lib/supabase/stories.ts`
- Modify: `src/app/api/generate-story/route.ts`
- Modify: `src/app/api/stories/[storyId]/mode-config/route.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx`
- Modify: `src/app/components/editor/SidePanel.tsx`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [x] **Step 1: Extend the helper tests to cover generic mode-config parsing**

```ts
import { parseStoryModeConfig } from "./projectMode.ts";

test("parseStoryModeConfig supports screenplay mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("screenplay", {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
      storyEngine: "feature",
    }),
    {
      draftingPreference: "beat_draft",
      formatStyle: "fountain",
      storyEngine: "feature",
    }
  );
});
```

- [x] **Step 2: Run the mode-helper test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts`

Expected: FAIL because the route/helper layer still only has newsletter-specific mode-config parsing.

- [x] **Step 3: Generalize mode-config parsing and API persistence**

```ts
// src/app/lib/projectMode.ts
export function parseStoryModeConfig(
  projectMode: ProjectMode,
  input: unknown
): StoryModeConfig | null {
  if (projectMode === "newsletter") {
    return parseNewsletterModeConfig(input);
  }
  if (projectMode === "screenplay") {
    return parseScreenplayModeConfig(input);
  }
  return {};
}
```

```ts
// src/app/api/stories/[storyId]/mode-config/route.ts
import { parseStoryModeConfig } from "../../../../lib/projectMode";

const modeConfig = parseStoryModeConfig(story.project_mode as ProjectMode, candidate);

if (!modeConfig) {
  return NextResponse.json({ error: "Invalid mode config" }, { status: 400 });
}

if ((story.project_mode as string | undefined) === "fiction") {
  return NextResponse.json(
    { error: "Mode config editing is not available for fiction projects" },
    { status: 400 }
  );
}
```

- [x] **Step 4: Add screenplay creation fields and setup UI**

In `CreateStoryTab.tsx`, add a third mode button and a screenplay form path with the minimum required fields:

```ts
const [screenplayTitle, setScreenplayTitle] = useState("");
const [screenplayTone, setScreenplayTone] = useState<string[]>([]);
const [screenplayDraftingPreference, setScreenplayDraftingPreference] =
  useState<ScreenplayDraftingPreference>("script_pages");
const [screenplayStoryEngine, setScreenplayStoryEngine] =
  useState<ScreenplayStoryEngine>("feature");

const canSubmit =
  projectMode === "fiction"
    ? ...
    : projectMode === "newsletter"
      ? ...
      : screenplayTitle.trim().length >= 2
        && screenplayTone.length >= 1
        && !busy;

const formData: StoryFormData = {
  projectMode: "screenplay",
  title: screenplayTitle.trim(),
  tone: screenplayTone,
  draftingPreference: screenplayDraftingPreference,
  storyEngine: screenplayStoryEngine,
};

const story = await createStoryInDB({
  title: screenplayTitle.trim(),
  projectMode: "screenplay",
  modeConfig: {
    draftingPreference: screenplayDraftingPreference,
    formatStyle: "fountain",
    storyEngine: screenplayStoryEngine,
  },
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: screenplayTone,
  tropes: [],
});
```

Create `ScreenplaySetupPanel.tsx` as the editable side-panel surface for:
- drafting preference
- story engine

Keep it parallel to `NewsletterSetupPanel`, but much smaller. It should emit a full `ScreenplayModeConfig` payload and let writers change future generation behavior without rewriting existing scenes.

- [x] **Step 5: Wire the setup panel through editor surfaces**

Update the editor shell so screenplay projects can edit their setup after creation:

```ts
// src/app/components/editor/StoryEditor.tsx
const handleModeConfigUpdated = useCallback(
  (modeConfig: StoryModeConfig, updatedAt: string) => {
    onStoryUpdated({
      ...story,
      modeConfig,
      updatedAt,
    });
  },
  [onStoryUpdated, story]
);
```

```ts
// src/app/components/editor/ArtifactsTab.tsx
if (story.projectMode === "screenplay") {
  return (
    <ScreenplaySetupPanel
      story={story}
      onSaved={onModeConfigUpdated}
    />
  );
}
```

Also widen any newsletter-specific prop types in `SidePanel.tsx` and adjacent editor components so they accept `StoryModeConfig` instead of `NewsletterModeConfig`.

- [x] **Step 6: Update the generation route to accept screenplay form data**

In `src/app/api/generate-story/route.ts`, extend request parsing so screenplay projects can generate Scene 1 from the same endpoint used by fiction/newsletter.

```ts
if (body.projectMode === "screenplay") {
  const prompt = buildChapter1Prompt(body);
  // existing streaming path remains the same
}
```

This step should stay intentionally small: screenplay uses the existing generation pipeline, just with the new mode-aware prompt builders already added in Task 2.

- [x] **Step 7: Run focused UI/helper verification**

Run:
- `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts`
- `npx tsc --noEmit`

Expected: PASS with screenplay creation/setup types compiling and the mode-config route accepting screenplay payloads.

- [x] **Step 8: Commit the screenplay setup flow**

```bash
git add src/app/lib/projectMode.test.ts src/app/components/editor/ScreenplaySetupPanel.tsx src/app/components/CreateStoryTab.tsx src/app/lib/supabase/stories.ts src/app/api/generate-story/route.ts src/app/api/stories/[storyId]/mode-config/route.ts src/app/components/editor/StoryEditor.tsx src/app/components/editor/SidePanel.tsx src/app/components/editor/ArtifactsTab.tsx
git commit -m "feat: add screenplay project setup flow"
```

### Task 5: Final verification, status updates, and rollout notes

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-04-06-screenplay-mode.md`

- [x] **Step 1: Run the focused screenplay test suite**

Run:
- `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/prompts/screenplay.test.ts src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`
- `npx tsc --noEmit`
- `npm run lint`

Expected: PASS with screenplay mode helpers, prompt builders, output/export behavior, and editor wiring all green.

- [x] **Step 2: Perform a product smoke review**

Manually verify:
- screenplay appears as a selectable project mode in the create flow
- screenplay projects use `Scene` language in primary editor actions
- changing drafting preference affects future continuation/output defaults but does not rewrite existing scenes
- `screenplay_scene_pages` and `screenplay_beat_sheet` both appear for screenplay projects
- script-pages projects export `.fountain`
- beat-draft projects export `.txt`

- [x] **Step 3: Update product status**

Add a concise shipped note to `CLAUDE.md` under the roadmap/product status section:

```md
- Screenplay mode v1 shipped: scene-based drafting, durable screenplay preferences, screenplay-native planning/memory semantics, screenplay outputs, and Fountain export for script-page projects.
```

- [x] **Step 4: Mark the plan complete and commit**

Update this plan file by checking off completed steps, then commit the final docs/status pass.

```bash
git add CLAUDE.md docs/superpowers/plans/2026-04-06-screenplay-mode.md
git commit -m "docs: record screenplay mode rollout"
```

### Notes for the implementing agent

- Keep the canonical editor as plain text. Do not build page-layout or screenplay-pagination UI in this slice.
- Preserve the existing `Title: ...` opening line protocol in generation prompts so streaming title parsing keeps working.
- Prefer small type-and-helper extractions over broad editor rewrites.
- When touching output defaults, thread `modeConfig` only where it changes behavior; avoid unrelated adaptation refactors.
- Do not add PDF or FDX export in this pass. `.fountain` plus `.txt` is the complete export scope.
