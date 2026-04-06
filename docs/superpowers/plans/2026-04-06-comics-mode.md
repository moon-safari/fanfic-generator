# Comics Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add comics as a first-class project mode with page-based drafting, comics-native planning and memory semantics, a `comic_page_beat_sheet` output, structured text export, and aligned Supabase migration source of truth.

**Architecture:** Extend the existing mode-pack system rather than building a comics-only subsystem. Comics becomes a fourth `ProjectMode`, stores a narrow `ComicsModeConfig`, plugs into shared prompt/context/adaptation/export helpers, and reuses the existing Project/Artifacts setup flow with a small comics-specific panel.

**Tech Stack:** TypeScript, Next.js App Router, React, Supabase SQL migrations, Node test runner, ESLint

---

### Task 1: Add comics mode foundation and align `stories.project_mode`

**Files:**
- Create: `supabase/migrations/016_project_mode_alignment.sql`
- Create: `src/app/lib/modes/comics.ts`
- Modify: `src/app/types/story.ts`
- Modify: `src/app/lib/projectMode.ts`
- Modify: `src/app/lib/projectMode.test.ts`
- Modify: `src/app/lib/modes/planning.ts`
- Modify: `src/app/lib/modes/registry.ts`
- Modify: `src/app/lib/planningContext.test.ts`

- [x] **Step 1: Write the failing comics mode helper tests**

```ts
// src/app/lib/projectMode.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
  getProjectModeLabel,
  getProjectUnitLabel,
  parseComicsModeConfig,
  parseStoryModeConfig,
} from "./projectMode.ts";
import { getModeConfig } from "./modes/registry.ts";

test("comics mode exposes page labels and comics defaults", () => {
  const mode = getModeConfig("comics");

  assert.equal(getProjectModeLabel("comics"), "Comics");
  assert.equal(getProjectUnitLabel("comics"), "page");
  assert.equal(getProjectUnitLabel("comics", { capitalize: true }), "Page");
  assert.equal(getContinueActionLabel("comics"), "Continue Page");
  assert.equal(getLoadingContinueLabel("comics"), "Writing the next page...");
  assert.equal(mode.contentUnitSingular, "page");
  assert.equal(mode.planningSchema.outline.description, "Page-by-page plan and status map.");
  assert.deepEqual(mode.coreTypes, [
    "character",
    "location",
    "visual_motif",
    "panel_layout",
    "narrative_device",
  ]);
});

test("parseComicsModeConfig normalizes valid comics config", () => {
  const parsed = parseComicsModeConfig({
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });
});

test("parseStoryModeConfig supports comics mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("comics", {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "graphic_novel",
    }),
    {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "graphic_novel",
    }
  );
});
```

```ts
// src/app/lib/planningContext.test.ts
test("comics mode uses page-native planning phrasing", () => {
  const mode = getModeConfig("comics");

  assert.equal(mode.planningUnitLabel, "page beat");
  assert.equal(mode.planningSchema.notes.title, "Visual Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "comics",
  });

  assert.match(prompt, /TARGET PAGE PLAN:/);
  assert.match(prompt, /VISUAL AND STORY PRESSURE TO HONOR:/);
  assert.match(prompt, /REVEALS DUE BY PAGE 4:/);
});
```

- [x] **Step 2: Run the failing mode tests**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts`

Expected: FAIL because `comics` is not yet part of `ProjectMode`, there is no comics mode registry entry, and the parsing/label helpers do not exist.

- [x] **Step 3: Implement the comics type, mode, planning, and migration foundation**

```sql
-- supabase/migrations/016_project_mode_alignment.sql
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_project_mode_check;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_project_mode_check
  CHECK (project_mode IN ('fiction', 'newsletter', 'screenplay', 'comics'));
```

```ts
// src/app/types/story.ts
export type ProjectMode = "fiction" | "newsletter" | "screenplay" | "comics";

export type ComicsDraftingPreference = "comic_script_pages";
export type ComicsSeriesEngine = "issue" | "one_shot" | "graphic_novel";

export interface ComicsModeConfig {
  draftingPreference: ComicsDraftingPreference;
  formatStyle: "comic_script";
  seriesEngine?: ComicsSeriesEngine;
}

export interface ComicsStoryFormData {
  projectMode: "comics";
  title: string;
  tone: string[];
  seriesEngine?: ComicsSeriesEngine;
}

export type StoryModeConfig =
  | Record<string, never>
  | NewsletterModeConfig
  | ScreenplayModeConfig
  | ComicsModeConfig;

export type StoryFormData =
  | FictionStoryFormData
  | NewsletterStoryFormData
  | ScreenplayStoryFormData
  | ComicsStoryFormData;
```

```ts
// src/app/lib/projectMode.ts
export function isComicsFormData(
  value: StoryFormData
): value is ComicsStoryFormData {
  return value.projectMode === "comics";
}

export function getComicsModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): ComicsModeConfig | null {
  if (story.projectMode !== "comics" || !story.modeConfig) {
    return null;
  }

  return parseComicsModeConfig(story.modeConfig);
}

export function parseComicsModeConfig(input: unknown): ComicsModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<ComicsModeConfig>;
  if (
    candidate.draftingPreference !== "comic_script_pages"
    || candidate.formatStyle !== "comic_script"
  ) {
    return null;
  }

  return {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine:
      candidate.seriesEngine === "issue"
      || candidate.seriesEngine === "one_shot"
      || candidate.seriesEngine === "graphic_novel"
        ? candidate.seriesEngine
        : undefined,
  };
}

export function parseStoryModeConfig(
  projectMode: ProjectMode,
  input: unknown
): StoryModeConfig | null {
  if (projectMode === "newsletter") return parseNewsletterModeConfig(input);
  if (projectMode === "screenplay") return parseScreenplayModeConfig(input);
  if (projectMode === "comics") return parseComicsModeConfig(input);
  return {};
}

export function getProjectModeLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Newsletter";
  if (mode === "screenplay") return "Screenplay";
  if (mode === "comics") return "Comics";
  return "Fiction";
}

export function getProjectUnitLabel(
  mode: ProjectMode,
  options: { count?: number; capitalize?: boolean; abbreviated?: boolean } = {}
): string {
  const { count = 1, capitalize = false, abbreviated = false } = options;

  if (mode === "comics") {
    const singular = abbreviated ? "Pg." : capitalize ? "Page" : "page";
    const plural = capitalize ? "Pages" : "pages";
    return count === 1 ? singular : plural;
  }
  if (mode === "screenplay") {
    const singular = abbreviated ? "Sc." : capitalize ? "Scene" : "scene";
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
  return "Continue Story";
}

export function getLoadingContinueLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Writing the next issue...";
  if (mode === "screenplay") return "Writing the next scene...";
  if (mode === "comics") return "Writing the next page...";
  return "Writing the next chapter...";
}
```

```ts
// src/app/lib/modes/comics.ts
import { buildComicsPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildComicsMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[]
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
    .map((entry) => `- ${entry.name} (${entry.entryType})${entry.description ? `: ${entry.description.slice(0, 100)}` : ""}`)
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
    description: "Pacing pressure, reveal placement, motif obligations, and unresolved page-turn threads.",
    emptyLabel: "Capture pacing, motif, and reveal obligations...",
    arcsHeading: "Visual and story pressure",
    threadsHeading: "Open page-turn obligations",
  },
};

export const comicsMode: ModeConfig = {
  id: "comics",
  label: "Comics",
  memoryLabel: "Memory",
  coreTypes: ["character", "location", "visual_motif", "panel_layout", "narrative_device"],
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
```

```ts
// src/app/lib/modes/planning.ts
export function buildComicsPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "VISUAL AND STORY PRESSURE TO HONOR:",
    dueHeadingPrefix: "REVEALS DUE BY",
    openHeading: "OTHER OPEN PAGE-TURN OBLIGATIONS:",
    notesHeading: "VISUAL NOTES",
    keyRevealLabel: "Expected page-turn or reveal",
    openLoopsLabel: (unitLabelLowercase) =>
      `Reveals meant to stay open after this ${unitLabelLowercase}`,
  });
}
```

```ts
// src/app/lib/modes/registry.ts
import { comicsMode } from "./comics.ts";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
  screenplay: screenplayMode,
  comics: comicsMode,
};
```

- [x] **Step 4: Run the mode tests again and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts`

Expected: PASS with comics labels, config parsing, registry wiring, and page-native planning phrasing all green.

- [x] **Step 5: Commit the comics foundation**

```bash
git add supabase/migrations/016_project_mode_alignment.sql src/app/types/story.ts src/app/lib/projectMode.ts src/app/lib/projectMode.test.ts src/app/lib/modes/comics.ts src/app/lib/modes/planning.ts src/app/lib/modes/registry.ts src/app/lib/planningContext.test.ts
git commit -m "feat: add comics mode foundation"
```

### Task 2: Add comics drafting prompts and story-bible support

**Files:**
- Create: `src/app/lib/prompts/comics.ts`
- Create: `src/app/lib/prompts/comics.test.ts`
- Modify: `src/app/lib/prompts/index.ts`
- Modify: `src/app/lib/prompts/bible.ts`

- [x] **Step 1: Write the failing comics prompt tests**

```ts
// src/app/lib/prompts/comics.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildChapter1Prompt, buildContinuationPrompt } from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const comicsForm = {
  projectMode: "comics" as const,
  title: "Ash Canary",
  tone: ["tense", "mythic"],
  seriesEngine: "issue" as const,
};

const comicsStory: Story = {
  id: "story-1",
  title: "Ash Canary",
  projectMode: "comics",
  modeConfig: {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  },
  chapters: [
    {
      id: "page-1",
      chapterNumber: 1,
      content: "PAGE 1\nPanel 1: The city hangs under a storm halo.",
      summary: "The city and heroine are introduced under storm pressure.",
      wordCount: 13,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["tense", "mythic"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 13,
};

test("comics first-page prompt requests numbered panels and page format", () => {
  const prompt = buildChapter1Prompt(comicsForm);

  assert.match(prompt, /^Title: Ash Canary/m);
  assert.match(prompt, /Write Page 1/i);
  assert.match(prompt, /numbered panels/i);
  assert.doesNotMatch(prompt, /Write Scene 1/i);
});

test("comics continuation prompt uses page language and comic-script guidance", () => {
  const prompt = buildContinuationPrompt(
    comicsStory,
    2,
    "=== MEMORY ===\nThe Ash Canary symbol marks the skyline.",
    "=== PLANNING GUIDANCE ===\nTARGET PAGE PLAN:\n- Intent: End on a page-turn reveal."
  );

  assert.match(prompt, /PAGE 2 INSTRUCTIONS:/);
  assert.match(prompt, /comic script/i);
  assert.match(prompt, /page-turn/i);
  assert.doesNotMatch(prompt, /SCENE 2 INSTRUCTIONS:/);
});

test("comics bible generation prompt asks for page-by-page planning", () => {
  const prompt = buildBibleGenerationPrompt("PAGE 1\nPanel 1: The city hangs under a storm halo.", {
    storyTitle: "Ash Canary",
    fandomContext: "",
    projectMode: "comics",
    modeConfig: {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "issue",
    },
  });

  assert.match(prompt, /page-by-page/i);
  assert.match(prompt, /Page 1/i);
  assert.doesNotMatch(prompt, /Scene 1/i);
});
```

- [x] **Step 2: Run the prompt test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/comics.test.ts`

Expected: FAIL because `buildChapter1Prompt`, `buildContinuationPrompt`, and `buildBibleGenerationPrompt` do not yet handle `comics`.

- [x] **Step 3: Implement the comics prompt builders and route them through shared prompt entry points**

```ts
// src/app/lib/prompts/comics.ts
import { getComicsModeConfig } from "../projectMode.ts";
import type { ComicsStoryFormData, Story } from "../../types/story.ts";

export function buildComicsPage1Prompt(form: ComicsStoryFormData): string {
  const tone = form.tone.join(" + ");

  return `You are a sharp comics writer building the opening page of a standard paged comic.

TITLE: ${form.title}
TONE: ${tone}
${form.seriesEngine ? `SERIES ENGINE: ${form.seriesEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: comic_script_pages

Write Page 1 as a comic script page.
- Use a PAGE heading.
- Use numbered panels.
- Keep panel descriptions visual, concise, and drawable.
- Separate dialogue, captions, SFX, and lettering notes clearly when needed.
- End the page with momentum or a page-turn hook.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Page 1 text only]`;
}

export function buildComicsContinuationPrompt(
  story: Story,
  pageNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getComicsModeConfig(story);
  const pageHistory = story.chapters
    .map((page, index) => {
      const label = `Page ${index + 1}`;
      const isRecent = index >= story.chapters.length - 2;
      if (isRecent) return `--- ${label} ---\n${page.content}`;
      if (page.summary) return `--- ${label} (Summary) ---\n${page.summary}`;
      return `--- ${label} ---\n${page.content}`;
    })
    .join("\n\n");

  return `You are continuing a paged comic project.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: comic_script_pages
${modeConfig?.seriesEngine ? `SERIES ENGINE: ${modeConfig.seriesEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS PAGES:
${pageHistory}

PAGE ${pageNumber} INSTRUCTIONS:
1. Continue directly from the prior page's pressure.
2. Write the next page as a comic script page with numbered panels.
3. Keep visual continuity, motif continuity, and who-is-on-page continuity coherent.
4. Control dialogue and caption density so the page still feels readable.
5. End with propulsion, compression, or a page-turn reveal.

Write Page ${pageNumber} now (page text only):`;
}
```

```ts
// src/app/lib/prompts/index.ts
import {
  isComicsFormData,
  isNewsletterFormData,
  isScreenplayFormData,
} from "../projectMode.ts";
import {
  buildComicsContinuationPrompt,
  buildComicsPage1Prompt,
} from "./comics.ts";

export function buildChapter1Prompt(form: StoryFormData): string {
  if (isNewsletterFormData(form)) return buildNewsletterIssue1Prompt(form);
  if (isScreenplayFormData(form)) return buildScreenplayScene1Prompt(form);
  if (isComicsFormData(form)) return buildComicsPage1Prompt(form);
  return buildFictionChapter1Prompt(form);
}

export function buildContinuationPrompt(
  story: Story,
  chapterNum: number,
  storyContext?: string,
  planningContext?: string
): string {
  if (story.projectMode === "newsletter") {
    return buildNewsletterContinuationPrompt(story, chapterNum, storyContext, planningContext);
  }
  if (story.projectMode === "screenplay") {
    return buildScreenplayContinuationPrompt(story, chapterNum, storyContext, planningContext);
  }
  if (story.projectMode === "comics") {
    return buildComicsContinuationPrompt(story, chapterNum, storyContext, planningContext);
  }
  return buildFictionContinuationPrompt(story, chapterNum, storyContext, planningContext);
}
```

```ts
// src/app/lib/prompts/bible.ts
if (options.projectMode === "comics") {
  const modeConfig = options.modeConfig;
  const seriesEngine =
    modeConfig && "seriesEngine" in modeConfig ? modeConfig.seriesEngine : "";

  return `You are a comic story-memory analyst. Extract reusable project truth and page-by-page planning from the opening page of a paged comic.

COMICS CONTEXT:
- Title: ${options.storyTitle}
- Drafting preference: comic_script_pages
${seriesEngine ? `- Series engine: ${seriesEngine}` : ""}

Return ONLY a valid JSON object with these top-level keys: characters, world, synopsis, genre, style_guide, outline, notes.
Set outline.chapters[0].title to "Page 1" and make notes.text preserve visual motifs, pacing pressure, and page-turn obligations.

OPENING PAGE TEXT:
${chapter1}`;
}
```

- [x] **Step 4: Run the prompt test again and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/comics.test.ts`

Expected: PASS with comics page-generation, continuation, and bible-generation behavior green.

- [x] **Step 5: Commit the comics prompt slice**

```bash
git add src/app/lib/prompts/comics.ts src/app/lib/prompts/comics.test.ts src/app/lib/prompts/index.ts src/app/lib/prompts/bible.ts
git commit -m "feat: add comics drafting prompts"
```

### Task 3: Add comics outputs, export behavior, and adaptation-output alignment

**Files:**
- Create: `supabase/migrations/017_adaptation_output_alignment.sql`
- Modify: `src/app/types/adaptation.ts`
- Modify: `src/app/lib/adaptations.ts`
- Modify: `src/app/lib/adaptations.test.ts`
- Modify: `src/app/lib/prompts/adaptation.ts`
- Modify: `src/app/lib/storyExport.ts`
- Modify: `src/app/lib/storyExport.test.ts`

- [x] **Step 1: Write the failing output and export tests**

```ts
// src/app/lib/adaptations.test.ts
test("comics mode exposes comic page beat sheet output", () => {
  const presets = getAdaptationPresetsForMode("comics", {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine: "issue",
  });

  assert.equal(
    presets.some((preset) => preset.type === "comic_page_beat_sheet"),
    true
  );
});

test("fiction mode does not expose comics-only outputs", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "comic_page_beat_sheet"),
    false
  );
});

test("comics mode defaults to the beat-sheet output", () => {
  assert.equal(
    getDefaultAdaptationOutputType("comics", {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "issue",
    }),
    "comic_page_beat_sheet"
  );
});
```

```ts
// src/app/lib/storyExport.test.ts
test("comics projects export as structured plain text", () => {
  const story: Story = {
    id: "comics-1",
    title: "Ash Canary",
    projectMode: "comics",
    modeConfig: {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: "issue",
    },
    chapters: [
      {
        id: "page-1",
        chapterNumber: 1,
        content: "PAGE 1\nPanel 1: The city hangs under a storm halo.",
        wordCount: 13,
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
    wordCount: 13,
  };

  const file = buildStoryExportFile(story);

  assert.equal(file.extension, "txt");
  assert.match(file.filename, /^Ash_Canary\.txt$/);
  assert.match(file.content, /Mode: Comics/);
  assert.match(file.content, /PAGE 1/);
});
```

- [x] **Step 2: Run the output/export tests and verify they fail**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: FAIL because `comic_page_beat_sheet` does not exist yet and the export helper has no comics branch.

- [x] **Step 3: Implement the comics output type, export path, and migration alignment**

```sql
-- supabase/migrations/017_adaptation_output_alignment.sql
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
// src/app/types/adaptation.ts
export type AdaptationOutputType =
  | "short_summary"
  | "newsletter_recap"
  | "screenplay_beat_sheet"
  | "screenplay_scene_pages"
  | "comic_page_beat_sheet"
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
const screenplayConfig =
  projectMode === "screenplay"
    ? getScreenplayModeConfig({ projectMode, modeConfig })
    : null;

{
  type: "comic_page_beat_sheet",
  label: "Comic Page Beat Sheet",
  description: "Condense the current comic page into visual pacing beats and page-turn pressure.",
  stateSources: ["draft", "memory", "plans", "saved_outputs"],
  supportingOutputTypes: ["short_summary"],
  supportedModes: ["comics"],
},

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
            "newsletter_recap",
          ]
        : [
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
  getNewsletterModeConfig,
  getProjectUnitLabel,
  getScreenplayModeConfig,
} from "../projectMode";

case "comic_page_beat_sheet":
  return 1000;

case "comic_page_beat_sheet":
  return `FORMAT INSTRUCTIONS:
- Write 4 to 8 numbered page beats.
- Focus on visual action, reveal placement, density shifts, and end-of-page pressure.
- Keep each beat to one or two sentences.
- Preserve the source page's continuity, not just its premise.`;

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
        : `FANDOM: ${customFandom?.trim() || fandom || "Original work"}`,
  comicsConfig?.draftingPreference
    ? `DRAFTING PREFERENCE: ${comicsConfig.draftingPreference}`
    : "",
  comicsConfig?.seriesEngine ? `SERIES ENGINE: ${comicsConfig.seriesEngine}` : "",
  newsletterConfig?.topic ? `TOPIC: ${newsletterConfig.topic}` : "",
  newsletterConfig?.audience ? `AUDIENCE: ${newsletterConfig.audience}` : "",
  newsletterConfig?.cadence ? `CADENCE: ${newsletterConfig.cadence}` : "",
  newsletterConfig?.issueAngle ? `CURRENT ANGLE: ${newsletterConfig.issueAngle}` : "",
  newsletterConfig?.subtitle ? `SUBTITLE: ${newsletterConfig.subtitle}` : "",
  newsletterConfig?.hookApproach ? `HOOK APPROACH: ${newsletterConfig.hookApproach}` : "",
  newsletterConfig?.ctaStyle ? `CTA STYLE: ${newsletterConfig.ctaStyle}` : "",
  newsletterConfig?.recurringSections?.length
    ? `RECURRING SECTIONS: ${newsletterConfig.recurringSections.join(", ")}`
    : "",
  screenplayConfig?.draftingPreference
    ? `DRAFTING PREFERENCE: ${screenplayConfig.draftingPreference}`
    : "",
  screenplayConfig?.storyEngine
    ? `STORY ENGINE: ${screenplayConfig.storyEngine}`
    : "",
  characters.length > 0 ? `CORE CHARACTERS: ${characters.join(", ")}` : "",
  tone.length > 0 ? `TONE: ${tone.join(", ")}` : "",
  tropes.length > 0 ? `TROPES: ${tropes.join(", ")}` : "",
].filter(Boolean).join("\n");
```

```ts
// src/app/lib/storyExport.ts
import {
  formatNewsletterCadence,
  getComicsModeConfig,
  getProjectModeLabel,
  getProjectUnitLabel,
  getScreenplayModeConfig,
  isNewsletterStory,
} from "./projectMode.ts";

if (story.projectMode === "comics") {
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
}
```

- [x] **Step 4: Run the output/export tests again and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: PASS with comics-only output filtering, default output selection, and comics export behavior green.

- [x] **Step 5: Commit the comics output/export slice**

```bash
git add supabase/migrations/017_adaptation_output_alignment.sql src/app/types/adaptation.ts src/app/lib/adaptations.ts src/app/lib/adaptations.test.ts src/app/lib/prompts/adaptation.ts src/app/lib/storyExport.ts src/app/lib/storyExport.test.ts
git commit -m "feat: add comics outputs and export"
```

### Task 4: Wire comics project creation and comics setup UI

**Files:**
- Create: `src/app/components/editor/ComicsSetupPanel.tsx`
- Modify: `src/app/components/CreateStoryTab.tsx`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [x] **Step 1: Add the comics setup panel component**

```tsx
// src/app/components/editor/ComicsSetupPanel.tsx
"use client";

import type { ReactNode } from "react";
import { BookOpenText, ChevronDown } from "lucide-react";
import type { ComicsModeConfig, ComicsSeriesEngine } from "../../types/story";

interface ComicsSetupPanelProps {
  comicsConfigDraft: ComicsModeConfig;
  savingComicsConfig: boolean;
  comicsConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: ComicsModeConfig) => void;
}

const SERIES_ENGINES: ComicsSeriesEngine[] = [
  "issue",
  "one_shot",
  "graphic_novel",
];

export default function ComicsSetupPanel({
  comicsConfigDraft,
  savingComicsConfig,
  comicsConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: ComicsSetupPanelProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Comics setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control page-generation defaults for future work. Existing pages stay untouched.
          </p>
        </div>
        <button type="button" onClick={onToggleSetup} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white">
          {showSetup ? "Hide setup" : "Open setup"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSetup ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showSetup && (
        <div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-500/10 p-2 text-cyan-200">
                <BookOpenText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Future generation defaults</p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Comics v1 always drafts as comic script pages. Use series engine to shape scope and pacing pressure.
                </p>
              </div>
            </div>
          </div>

          <OptionGroup label="Series engine" helper="This shapes pacing and payoff horizon for future pages.">
            {SERIES_ENGINES.map((option) => (
              <ToggleButton
                key={option}
                active={comicsConfigDraft.seriesEngine === option}
                onClick={() => onConfigChange({ ...comicsConfigDraft, seriesEngine: option })}
              >
                {labelSeriesEngine(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 ${savingComicsConfig ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" : "border-zinc-700 bg-zinc-950/80 text-zinc-300"}`}>
              {savingComicsConfig ? "Saving comics setup..." : "Comics setup saved automatically"}
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-zinc-300">
              Format: Comic script pages
            </span>
          </div>

          {comicsConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {comicsConfigError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OptionGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? "border-cyan-500 bg-cyan-500/15 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function labelSeriesEngine(value: ComicsSeriesEngine) {
  switch (value) {
    case "graphic_novel":
      return "Graphic novel";
    case "one_shot":
      return "One-shot";
    default:
      return "Issue";
  }
}
```

- [x] **Step 2: Add comics project creation and setup-panel wiring**

```tsx
// src/app/components/CreateStoryTab.tsx
import type { ComicsSeriesEngine, ProjectMode, StoryFormData } from "../types/story";

const [comicsTitle, setComicsTitle] = useState("");
const [comicsTone, setComicsTone] = useState<string[]>([]);
const [comicsSeriesEngine, setComicsSeriesEngine] =
  useState<ComicsSeriesEngine>("issue");
const [showComicsOptions, setShowComicsOptions] = useState(false);

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
        : comicsTitle.trim().length >= 2 && comicsTone.length >= 1 && !busy;

if (projectMode === "comics") {
  const formData: StoryFormData = {
    projectMode: "comics",
    title: comicsTitle.trim(),
    tone: comicsTone,
    seriesEngine: comicsSeriesEngine,
  };

  const story = await createStoryInDB({
    title: comicsTitle.trim(),
    projectMode: "comics",
    modeConfig: {
      draftingPreference: "comic_script_pages",
      formatStyle: "comic_script",
      seriesEngine: comicsSeriesEngine,
    },
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: comicsTone,
    tropes: [],
  });

  if (!story) {
    throw new Error("Please sign in before creating a new project.");
  }

  onStoryCreated(story, formData);
  return;
}
```

```tsx
// src/app/components/CreateStoryTab.tsx
<ModeButton
  label="Comics"
  active={projectMode === "comics"}
  onClick={() => setProjectMode("comics")}
/>

{projectMode === "comics" && (
  <>
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        Comics
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Start with a title, a tone, and the pacing scope you want the planner to assume.
      </p>
    </div>

    <label className="block space-y-2">
      <span className="text-sm font-medium text-white">Project title</span>
      <input
        value={comicsTitle}
        onChange={(event) => setComicsTitle(event.target.value)}
        placeholder="Ash Canary"
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
      />
    </label>

    <ToneSelector selected={comicsTone} onChange={setComicsTone} />

    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Series scope</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            This shapes pacing and payoff horizon for future pages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowComicsOptions((value) => !value)}
          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-white"
        >
          {showComicsOptions ? "Hide options" : "Choose scope"}
        </button>
      </div>

      {showComicsOptions && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(["issue", "one_shot", "graphic_novel"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setComicsSeriesEngine(option)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                comicsSeriesEngine === option
                  ? "border-cyan-500 bg-cyan-500/15 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              {labelComicsSeriesEngine(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  </>
)}

function labelComicsSeriesEngine(value: ComicsSeriesEngine) {
  switch (value) {
    case "graphic_novel":
      return "Graphic novel";
    case "one_shot":
      return "One-shot";
    default:
      return "Issue";
  }
}
```

```tsx
// src/app/components/editor/ArtifactsTab.tsx
import { getComicsModeConfig, getNewsletterModeConfig, getProjectUnitLabel, getScreenplayModeConfig } from "../../lib/projectMode";
import type { ComicsModeConfig, NewsletterModeConfig, ScreenplayModeConfig, StoryModeConfig } from "../../types/story";
import ComicsSetupPanel from "./ComicsSetupPanel";

const comicsModeConfig = useMemo(
  () =>
    getComicsModeConfig({
      projectMode,
      modeConfig,
    }),
  [modeConfig, projectMode]
);

const [comicsConfigDraft, setComicsConfigDraft] =
  useState<ComicsModeConfig | null>(comicsModeConfig);
const [savingComicsConfig, setSavingComicsConfig] = useState(false);
const [comicsConfigError, setComicsConfigError] = useState<string | null>(null);
const [showComicsSetup, setShowComicsSetup] = useState(false);
const comicsConfigTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleComicsConfigChange(nextDraft: ComicsModeConfig) {
  setComicsConfigDraft(nextDraft);
  setComicsConfigError(null);

  if (comicsConfigTimerRef.current) {
    clearTimeout(comicsConfigTimerRef.current);
  }

  comicsConfigTimerRef.current = setTimeout(async () => {
    setSavingComicsConfig(true);
    try {
      const response = await requestJson<{ modeConfig: StoryModeConfig }>(
        `/api/stories/${storyId}/mode-config`,
        {
          method: "PUT",
          body: JSON.stringify(nextDraft),
        }
      );
      onModeConfigUpdated?.(response.modeConfig);
    } catch (error) {
      setComicsConfigError(getErrorMessage(error, "Failed to save comics setup."));
    } finally {
      setSavingComicsConfig(false);
    }
  }, 400);
}

{projectMode === "comics" && comicsConfigDraft && (
  <ComicsSetupPanel
    comicsConfigDraft={comicsConfigDraft}
    savingComicsConfig={savingComicsConfig}
    comicsConfigError={comicsConfigError}
    showSetup={showComicsSetup}
    onToggleSetup={() => setShowComicsSetup((value) => !value)}
    onConfigChange={handleComicsConfigChange}
  />
)}
```

- [x] **Step 3: Run TypeScript to catch wiring mistakes**

Run: `npx tsc --noEmit`

Expected: PASS with the new comics form state, mode config, and setup panel wiring fully typed.

- [x] **Step 4: Run lint to catch React and import issues**

Run: `npm run lint`

Expected: PASS with no new lint errors in `CreateStoryTab`, `ArtifactsTab`, or `ComicsSetupPanel`.

- [x] **Step 5: Commit the comics setup flow**

```bash
git add src/app/components/CreateStoryTab.tsx src/app/components/editor/ArtifactsTab.tsx src/app/components/editor/ComicsSetupPanel.tsx
git commit -m "feat: add comics project setup flow"
```

### Task 5: Record rollout status and run final verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-04-06-comics-mode.md`

- [x] **Step 1: Update product status and check off the completed plan**

```md
<!-- CLAUDE.md -->
11. Codex -> Memory rename + mode-agnostic memory engine (ModeConfig registry)
12. Phase A simplification & polish (progressive disclosure, mode-aware microcopy, empty states, 375px narrow-width pass)
13. Screenplay mode v1 (scene-based drafting, durable screenplay preferences, screenplay-native planning/memory semantics, screenplay outputs, Fountain export for script-page projects)
14. Comics mode v1 (page-based comic scripting, comics-native planning/memory semantics, comic beat-sheet output, structured text export)

**Phase C: Mode Pack Expansion** (in progress)
1. Screenplay mode — scenes, beat sheets, act structure, formatted output (completed 2026-04-06)
2. Comics / graphic narrative mode — pages/panels, visual pacing, script format (completed 2026-04-06)
3. Game writing / narrative design mode — quests, branching, dialogue trees
4. Non-fiction / articles / essays mode — sections, arguments, sources, bibliography
```

```md
<!-- docs/superpowers/plans/2026-04-06-comics-mode.md -->
- [x] **Step 1: Write the failing comics mode helper tests**
- [x] **Step 2: Run the failing mode tests**
- [x] **Step 3: Implement the comics type, mode, planning, and migration foundation**
- [x] **Step 4: Run the mode tests again and verify they pass**
- [x] **Step 5: Commit the comics foundation**
```

- [x] **Step 2: Run the focused comics regression suite**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts src/app/lib/prompts/comics.test.ts src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: PASS with comics mode foundation, planning phrasing, prompt behavior, outputs, and export all green.

- [x] **Step 3: Run the full typecheck**

Run: `npx tsc --noEmit`

Expected: PASS

- [x] **Step 4: Run lint**

Run: `npm run lint`

Expected: PASS

- [x] **Step 5: Commit the rollout docs**

```bash
git add CLAUDE.md docs/superpowers/plans/2026-04-06-comics-mode.md
git commit -m "docs: record comics mode rollout"
```

