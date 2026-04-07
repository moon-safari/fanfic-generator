# Non-Fiction Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add non-fiction as a first-class project mode with section-based drafting, source-aware memory and planning semantics, an `argument_evidence_brief` output, structured export, and aligned Supabase constraint coverage.

**Architecture:** Extend the existing mode-pack system rather than introducing a separate research workflow. Non-fiction becomes a sixth `ProjectMode`, stores a narrow `NonFictionModeConfig`, plugs into shared prompt/context/adaptation/export helpers, and reuses the existing Project/Artifacts setup flow with a small non-fiction-specific setup panel.

**Tech Stack:** TypeScript, Next.js App Router, React, Supabase SQL migrations, Node test runner, ESLint

---

### Task 1: Add non-fiction mode foundation and align Supabase check constraints

**Files:**
- Create: `supabase/migrations/019_non_fiction_mode_alignment.sql`
- Create: `src/app/lib/modes/nonFiction.ts`
- Modify: `src/app/types/story.ts`
- Modify: `src/app/lib/projectMode.ts`
- Modify: `src/app/lib/projectMode.test.ts`
- Modify: `src/app/lib/modes/planning.ts`
- Modify: `src/app/lib/modes/registry.ts`
- Modify: `src/app/lib/planningContext.test.ts`

- [x] **Step 1: Write the failing non-fiction mode helper tests**

```ts
// src/app/lib/projectMode.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
  getProjectModeLabel,
  getProjectUnitLabel,
  parseNonFictionModeConfig,
  parseStoryModeConfig,
} from "./projectMode.ts";
import { getModeConfig } from "./modes/registry.ts";

test("non-fiction mode exposes section labels and evidence-aware defaults", () => {
  const mode = getModeConfig("non_fiction");

  assert.equal(getProjectModeLabel("non_fiction"), "Non-Fiction");
  assert.equal(getProjectUnitLabel("non_fiction"), "section");
  assert.equal(
    getProjectUnitLabel("non_fiction", { capitalize: true }),
    "Section"
  );
  assert.equal(getContinueActionLabel("non_fiction"), "Continue Section");
  assert.equal(
    getLoadingContinueLabel("non_fiction"),
    "Writing the next section..."
  );
  assert.equal(mode.contentUnitSingular, "section");
  assert.equal(
    mode.planningSchema.outline.description,
    "Section-by-section argument structure and status map."
  );
  assert.deepEqual(mode.coreTypes, [
    "source",
    "claim",
    "topic",
    "argument",
    "evidence",
    "counterpoint",
    "quote",
  ]);
});

test("parseNonFictionModeConfig normalizes valid non-fiction config", () => {
  const parsed = parseNonFictionModeConfig({
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "essay",
  });

  assert.deepEqual(parsed, {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "essay",
  });
});

test("parseStoryModeConfig supports non-fiction mode", () => {
  assert.deepEqual(
    parseStoryModeConfig("non_fiction", {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "article",
    }),
    {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "article",
    }
  );
});
```

```ts
// src/app/lib/planningContext.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildPlanningPromptContext } from "./planningContext.ts";
import { getModeConfig } from "./modes/registry.ts";

test("non-fiction mode uses section-native planning phrasing", () => {
  const mode = getModeConfig("non_fiction");
  const outline = {
    chapters: [
      {
        number: 3,
        title: "Why the current system overstates certainty",
        summary: "Move from setup into the core argument about overclaiming.",
        intent: "Land the central claim and connect it to the strongest evidence.",
        keyReveal: "The framing problem is structural, not accidental.",
        openLoops: ["Hold the policy counterpoint for Section 4"],
        status: "planned",
      },
    ],
  };
  const notes = {
    text: "Do not overclaim beyond the labor-stat source.",
    arcs: [
      {
        id: "core-argument",
        title: "Structural argument",
        intent: "Show that the trend is durable, not anecdotal.",
        status: "active",
        horizon: "Sections 3-4",
        notes: "",
      },
    ],
    threads: [
      {
        id: "proof-gap",
        title: "Labor-stat support",
        owner: "primary evidence",
        introducedIn: 2,
        targetUnit: 3,
        status: "open",
        notes: "Name the report before escalating the claim.",
      },
    ],
  };

  assert.equal(mode.planningUnitLabel, "section beat");
  assert.equal(mode.planningSchema.notes.title, "Editorial Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 3,
    projectMode: "non_fiction",
  });

  assert.match(prompt, /TARGET SECTION PLAN:/);
  assert.match(prompt, /ARGUMENT PRESSURE TO HONOR:/);
  assert.match(prompt, /EVIDENCE DUE BY SECTION 3:/);
  assert.match(prompt, /OTHER OPEN PROOF GAPS:/);
});
```

- [x] **Step 2: Run the mode tests to verify they fail**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts`

Expected: FAIL because `non_fiction` is not yet part of `ProjectMode`, there is no registry entry, and the config-parsing and planning helpers do not exist yet.

- [x] **Step 3: Implement the non-fiction type, mode, planning, and migration foundation**

```sql
-- supabase/migrations/019_non_fiction_mode_alignment.sql
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_project_mode_check;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_project_mode_check
  CHECK (project_mode IN (
    'fiction',
    'newsletter',
    'screenplay',
    'comics',
    'game_writing',
    'non_fiction'
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
    'argument_evidence_brief',
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
  | "game_writing"
  | "non_fiction";

export type NonFictionDraftingPreference = "hybrid_section_draft";
export type NonFictionPieceEngine = "article" | "essay";

export interface NonFictionModeConfig {
  draftingPreference: NonFictionDraftingPreference;
  formatStyle: "article_draft";
  pieceEngine?: NonFictionPieceEngine;
}

export interface NonFictionStoryFormData {
  projectMode: "non_fiction";
  title: string;
  tone: string[];
  pieceEngine?: NonFictionPieceEngine;
}

export type StoryModeConfig =
  | Record<string, never>
  | NewsletterModeConfig
  | ScreenplayModeConfig
  | ComicsModeConfig
  | GameWritingModeConfig
  | NonFictionModeConfig;

export type StoryFormData =
  | FictionStoryFormData
  | NewsletterStoryFormData
  | ScreenplayStoryFormData
  | ComicsStoryFormData
  | GameWritingStoryFormData
  | NonFictionStoryFormData;
```

```ts
// src/app/lib/projectMode.ts
export function isNonFictionFormData(
  value: StoryFormData
): value is NonFictionStoryFormData {
  return value.projectMode === "non_fiction";
}

export function getNonFictionModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): NonFictionModeConfig | null {
  if (story.projectMode !== "non_fiction" || !story.modeConfig) {
    return null;
  }

  return parseNonFictionModeConfig(story.modeConfig);
}

export function parseNonFictionModeConfig(
  input: unknown
): NonFictionModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<NonFictionModeConfig>;
  if (
    candidate.draftingPreference !== "hybrid_section_draft"
    || candidate.formatStyle !== "article_draft"
  ) {
    return null;
  }

  return {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine:
      candidate.pieceEngine === "article" || candidate.pieceEngine === "essay"
        ? candidate.pieceEngine
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
  if (projectMode === "game_writing") return parseGameWritingModeConfig(input);
  if (projectMode === "non_fiction") return parseNonFictionModeConfig(input);
  return {};
}

export function getProjectModeLabel(mode: ProjectMode): string {
  if (mode === "newsletter") return "Newsletter";
  if (mode === "screenplay") return "Screenplay";
  if (mode === "comics") return "Comics";
  if (mode === "game_writing") return "Game Writing";
  if (mode === "non_fiction") return "Non-Fiction";
  return "Fiction";
}

export function getProjectUnitLabel(
  mode: ProjectMode,
  options: { count?: number; capitalize?: boolean; abbreviated?: boolean } = {}
): string {
  const { count = 1, capitalize = false, abbreviated = false } = options;

  if (mode === "non_fiction") {
    const singular = abbreviated
      ? "Sec."
      : capitalize
        ? "Section"
        : "section";
    const plural = capitalize ? "Sections" : "sections";
    return count === 1 ? singular : plural;
  }

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
  if (mode === "non_fiction") return "Continue Section";
  if (mode === "newsletter") return "Continue Issue";
  if (mode === "screenplay") return "Continue Scene";
  if (mode === "comics") return "Continue Page";
  if (mode === "game_writing") return "Continue Quest";
  return "Continue Story";
}

export function getLoadingContinueLabel(mode: ProjectMode): string {
  if (mode === "non_fiction") return "Writing the next section...";
  if (mode === "newsletter") return "Writing the next issue...";
  if (mode === "screenplay") return "Writing the next scene...";
  if (mode === "comics") return "Writing the next page...";
  if (mode === "game_writing") return "Writing the next quest...";
  return "Writing the next chapter...";
}
```

```ts
// src/app/lib/modes/planning.ts
export function buildNonFictionPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "ARGUMENT PRESSURE TO HONOR:",
    dueHeadingPrefix: "EVIDENCE DUE BY",
    openHeading: "OTHER OPEN PROOF GAPS:",
    notesHeading: "EDITORIAL NOTES",
    keyRevealLabel: "Expected claim, turn, or section move",
    openLoopsLabel: (unitLabelLowercase) =>
      `Claims or proof questions meant to stay open after this ${unitLabelLowercase}`,
  });
}
```

```ts
// src/app/lib/modes/nonFiction.ts
import { buildNonFictionPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildNonFictionMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[]
): string {
  const existingNames = existingEntries.map((entry) => entry.name).join(", ");

  return `You are a non-fiction research assistant extracting structured project memory.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW sources, claims, topics, arguments, evidence, counterpoints, or quotes.\n` : ""}For each entry, output JSON with: name, type (one of: source, claim, topic, argument, evidence, counterpoint, quote), description, and optionally aliases and customFields.

Section draft:
${content}`;
}

function buildNonFictionSuggestionPrompt(
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

  return `You are reviewing Section ${contentUnitNumber} of a non-fiction project. Suggest updates to structured memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use planning as context for section intent, evidence obligations, and open proof gaps.
Only suggest memory updates for sources, claims, evidence, counterpoints, topics, arguments, or quotes actually established in the section draft.
Do not suggest a canonical memory change solely because it was planned.

Section draft:
${content}`;
}

const nonFictionPlanningSchema: PlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description: "The working thesis and project-level promise of the article or essay.",
    emptyLabel: "Add a short project synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Voice, evidence standards, and editorial guardrails for the piece.",
    emptyLabel: "Define voice, framing, and evidence guardrails...",
  },
  outline: {
    title: "Outline",
    description: "Section-by-section argument structure and status map.",
    emptyLabel: "Add planned section beats...",
    openLoopsLabel: "Open proof gaps",
  },
  notes: {
    title: "Editorial Notes",
    description: "Proof gaps, source follow-ups, counterpoints, and framing guidance.",
    emptyLabel: "Capture unresolved evidence gaps and editorial notes...",
    arcsHeading: "Argument pressure",
    threadsHeading: "Open proof gaps",
  },
};

export const nonFictionMode: ModeConfig = {
  id: "non_fiction",
  label: "Non-Fiction",
  memoryLabel: "Sources & Claims",
  coreTypes: [
    "source",
    "claim",
    "topic",
    "argument",
    "evidence",
    "counterpoint",
    "quote",
  ],
  typeLabels: {
    source: "Source",
    claim: "Claim",
    topic: "Topic",
    argument: "Argument",
    evidence: "Evidence",
    counterpoint: "Counterpoint",
    quote: "Quote",
  },
  typeIcons: {
    source: "BookOpen",
    claim: "ScrollText",
    topic: "Hash",
    argument: "Scale",
    evidence: "FileCheck",
    counterpoint: "AlertTriangle",
    quote: "Quote",
  },
  fieldSuggestions: {
    source: ["author", "publication", "published_at", "source_type", "credibility_notes", "relevance"],
    claim: ["section_role", "support_status", "linked_sources", "caveat"],
    topic: ["scope", "framing", "audience_relevance", "related_claims"],
    argument: ["thesis_role", "section_span", "intended_effect", "dependencies"],
    evidence: ["evidence_type", "supports_claim", "source_link", "confidence", "notes"],
    counterpoint: ["target_claim", "response_strategy", "severity"],
    quote: ["speaker", "source", "usage_context", "attribution"],
  },
  contentUnitSingular: "section",
  contentUnitPlural: "sections",
  buildMemoryGenerationPrompt: buildNonFictionMemoryPrompt,
  buildSuggestionPrompt: buildNonFictionSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for non-fiction piece "${title}":`,
  planningUnitLabel: "section beat",
  planningSchema: nonFictionPlanningSchema,
  buildPlanningPrompt: buildNonFictionPlanningPrompt,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
```

```ts
// src/app/lib/modes/registry.ts
import { nonFictionMode } from "./nonFiction.ts";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  comics: comicsMode,
  fiction: fictionMode,
  game_writing: gameWritingMode,
  newsletter: newsletterMode,
  non_fiction: nonFictionMode,
  screenplay: screenplayMode,
};
```

- [x] **Step 4: Run the mode tests again and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts`

Expected: PASS with non-fiction labels, config parsing, registry wiring, migration-safe types, and section-native planning phrasing all green.

- [x] **Step 5: Commit the non-fiction foundation**

```bash
git add supabase/migrations/019_non_fiction_mode_alignment.sql src/app/types/story.ts src/app/lib/projectMode.ts src/app/lib/projectMode.test.ts src/app/lib/modes/nonFiction.ts src/app/lib/modes/planning.ts src/app/lib/modes/registry.ts src/app/lib/planningContext.test.ts
git commit -m "feat: add non-fiction mode foundation"
```

### Task 2: Add non-fiction drafting prompts and story-bible support

**Files:**
- Create: `src/app/lib/prompts/nonFiction.ts`
- Create: `src/app/lib/prompts/nonFiction.test.ts`
- Modify: `src/app/lib/prompts/index.ts`
- Modify: `src/app/lib/prompts/bible.ts`
- Modify: `src/app/api/generate-story/route.ts`

- [x] **Step 1: Write the failing non-fiction prompt tests**

```ts
// src/app/lib/prompts/nonFiction.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapter1Prompt,
  buildContinuationPrompt,
} from "./index.ts";
import { buildBibleGenerationPrompt } from "./bible.ts";
import type { Story } from "../../types/story.ts";

const nonFictionForm = {
  projectMode: "non_fiction" as const,
  title: "The Cost of Pretending Everything Scales",
  tone: ["sharp", "analytical"],
  pieceEngine: "article" as const,
};

const nonFictionStory: Story = {
  id: "story-1",
  title: "The Cost of Pretending Everything Scales",
  projectMode: "non_fiction",
  modeConfig: {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "article",
  },
  chapters: [
    {
      id: "section-1",
      chapterNumber: 1,
      content:
        "SECTION 1\nPurpose: Establish the system problem.\nClaim cue: The market rewards false certainty.\nEvidence cue: Creator interviews and hiring slowdown data.\nDraft: The opening frames the core pressure.",
      summary: "Section 1 frames the thesis and names the first proof burden.",
      wordCount: 31,
    },
  ],
  fandom: "",
  characters: [],
  relationshipType: "gen",
  rating: "teen",
  tone: ["sharp", "analytical"],
  tropes: [],
  createdAt: "",
  updatedAt: "",
  wordCount: 31,
};

test("non-fiction first-section prompt requests hybrid section draft structure", () => {
  const prompt = buildChapter1Prompt(nonFictionForm);

  assert.match(prompt, /^Title: The Cost of Pretending Everything Scales/m);
  assert.match(prompt, /Write Section 1/i);
  assert.match(prompt, /Claim cue:/i);
  assert.match(prompt, /Evidence cue:/i);
  assert.doesNotMatch(prompt, /Write Chapter 1/i);
});

test("non-fiction continuation prompt uses section language and evidence pressure", () => {
  const prompt = buildContinuationPrompt(
    nonFictionStory,
    2,
    "=== MEMORY ===\n- Labor-stat report (source): strongest quantitative support so far.",
    "=== PLANNING GUIDANCE ===\nTARGET SECTION PLAN:\n- Intent: Move from setup into the structural argument."
  );

  assert.match(prompt, /SECTION 2 INSTRUCTIONS:/);
  assert.match(prompt, /hybrid section draft/i);
  assert.match(prompt, /inline claim\/evidence cues/i);
  assert.doesNotMatch(prompt, /CHAPTER 2 INSTRUCTIONS:/);
});

test("non-fiction bible generation prompt asks for section-by-section argument planning", () => {
  const prompt = buildBibleGenerationPrompt(
    "SECTION 1\nPurpose: Establish the system problem.\nClaim cue: The market rewards false certainty.",
    {
      storyTitle: "The Cost of Pretending Everything Scales",
      fandomContext: "",
      projectMode: "non_fiction",
      modeConfig: {
        draftingPreference: "hybrid_section_draft",
        formatStyle: "article_draft",
        pieceEngine: "article",
      },
    }
  );

  assert.match(prompt, /section-by-section/i);
  assert.match(prompt, /source-aware/i);
  assert.doesNotMatch(prompt, /chapter-by-chapter/i);
});
```

- [x] **Step 2: Run the prompt test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/nonFiction.test.ts`

Expected: FAIL because `buildChapter1Prompt`, `buildContinuationPrompt`, and `buildBibleGenerationPrompt` do not yet handle `non_fiction`.

- [x] **Step 3: Implement the non-fiction prompt builders and route them through shared entry points**

```ts
// src/app/lib/prompts/nonFiction.ts
import { getNonFictionModeConfig } from "../projectMode.ts";
import type {
  NonFictionStoryFormData,
  Story,
} from "../../types/story.ts";

export function buildNonFictionSection1Prompt(
  form: NonFictionStoryFormData
): string {
  const tone = form.tone.join(" + ");

  return `You are a rigorous non-fiction writer building the opening section of an article or essay project.

TITLE: ${form.title}
TONE: ${tone}
${form.pieceEngine ? `PIECE ENGINE: ${form.pieceEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: hybrid_section_draft

Write Section 1 as a hybrid section draft with inline claim/evidence cues.
- The draft should read like a real article or essay section, not an outline dump.
- Keep the section readable and collaborator-friendly while making support burdens explicit.
- Use concrete, source-aware phrasing without pretending unproven claims are settled.

RECOMMENDED HEADING SHAPE:
- Purpose:
- Claim cue:
- Evidence cue:
- Draft:
- Counterpoint / caveat:
- Transition:

SECTION 1 GOALS:
1. Establish the article's opening problem or frame quickly.
2. Land one clear claim or thesis move.
3. Name the strongest available evidence cue without fabricating support.
4. Leave a live transition into Section 2.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Section 1 text only]`;
}

export function buildNonFictionContinuationPrompt(
  story: Story,
  sectionNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getNonFictionModeConfig(story);
  const sectionHistory = story.chapters
    .map((section, index) => {
      const label = `Section ${index + 1}`;
      const isRecent = index >= story.chapters.length - 2;

      if (isRecent) return `--- ${label} ---\n${section.content}`;
      if (section.summary) return `--- ${label} (Summary) ---\n${section.summary}`;
      return `--- ${label} ---\n${section.content}`;
    })
    .join("\n\n");

  return `You are continuing a non-fiction project as an evidence-aware writer.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: hybrid_section_draft
${modeConfig?.pieceEngine ? `PIECE ENGINE: ${modeConfig.pieceEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS SECTIONS:
${sectionHistory}

SECTION ${sectionNumber} INSTRUCTIONS:
1. Continue directly from the prior section's argument flow and proof burden.
2. Write the next section as a hybrid section draft with inline claim/evidence cues.
3. Keep claims proportional to the evidence actually established so far.
4. Preserve source continuity, counterpoints, and unresolved proof gaps already in the project.
5. Use planning guidance to sharpen section intent, but do not canonize planned evidence that is not in the draft.
6. End with transition pressure that makes the next section feel necessary.

Write Section ${sectionNumber} now (section text only):`;
}
```

```ts
// src/app/lib/prompts/index.ts
import {
  isComicsFormData,
  isGameWritingFormData,
  isNewsletterFormData,
  isNonFictionFormData,
  isScreenplayFormData,
} from "../projectMode.ts";
import {
  buildNonFictionContinuationPrompt,
  buildNonFictionSection1Prompt,
} from "./nonFiction.ts";

export function buildChapter1Prompt(form: StoryFormData): string {
  if (isNewsletterFormData(form)) return buildNewsletterIssue1Prompt(form);
  if (isScreenplayFormData(form)) return buildScreenplayScene1Prompt(form);
  if (isComicsFormData(form)) return buildComicsPage1Prompt(form);
  if (isGameWritingFormData(form)) return buildGameWritingQuest1Prompt(form);
  if (isNonFictionFormData(form)) return buildNonFictionSection1Prompt(form);
  return buildFictionChapter1Prompt(form);
}

export function buildContinuationPrompt(
  story: Story,
  chapterNum: number,
  storyContext?: string,
  planningContext?: string
): string {
  if (story.projectMode === "non_fiction") {
    return buildNonFictionContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

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
if (options.projectMode === "non_fiction") {
  const modeConfig = options.modeConfig;
  const draftingPreference =
    modeConfig && "draftingPreference" in modeConfig
      ? modeConfig.draftingPreference
      : "hybrid_section_draft";
  const pieceEngine =
    modeConfig && "pieceEngine" in modeConfig ? modeConfig.pieceEngine : "";

  return `You are a non-fiction project-memory analyst. Extract reusable project truth and section-by-section argument planning from the opening section draft.

NON-FICTION CONTEXT:
- Title: ${options.storyTitle}
- Drafting preference: ${draftingPreference}
${pieceEngine ? `- Piece engine: ${pieceEngine}` : ""}

Return ONLY a valid JSON object with these top-level keys: characters, world, synopsis, genre, style_guide, outline, notes.

Use this guidance while filling the existing story-bible structure:
- Treat the source text as Section 1, not a chapter, scene, page, or quest.
- Make the outline section-by-section and keep the unit language section-native.
- Keep notes source-aware by preserving proof gaps, counterpoints, and follow-up evidence needs.
- Extract recurring people, institutions, topics, and cited reference pressure only from what the section actually establishes.

OPENING SECTION TEXT:
${chapter1}`;
}
```

```ts
// src/app/api/generate-story/route.ts
import {
  isComicsFormData,
  isGameWritingFormData,
  isNewsletterFormData,
  isNonFictionFormData,
  isScreenplayFormData,
} from "../../lib/projectMode";

if (isNewsletterFormData(body)) {
  if (
    body.title.trim().length < 2
    || body.newsletterTopic.trim().length < 3
    || body.audience.trim().length < 3
    || body.issueAngle.trim().length < 8
    || !Array.isArray(body.tone)
    || body.tone.length < 1
  ) {
    return NextResponse.json(
      { error: "Missing required newsletter fields" },
      { status: 400 }
    );
  }
} else if (isScreenplayFormData(body)) {
  if (
    body.title.trim().length < 2
    || !Array.isArray(body.tone)
    || body.tone.length < 1
    || (body.draftingPreference !== "script_pages"
      && body.draftingPreference !== "beat_draft")
  ) {
    return NextResponse.json(
      { error: "Missing required screenplay fields" },
      { status: 400 }
    );
  }
} else if (isComicsFormData(body)) {
  if (
    body.title.trim().length < 2
    || !Array.isArray(body.tone)
    || body.tone.length < 1
  ) {
    return NextResponse.json(
      { error: "Missing required comics fields" },
      { status: 400 }
    );
  }
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
} else if (isNonFictionFormData(body)) {
  if (
    body.title.trim().length < 2
    || !Array.isArray(body.tone)
    || body.tone.length < 1
  ) {
    return NextResponse.json(
      { error: "Missing required non-fiction fields" },
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

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/nonFiction.test.ts`

Expected: PASS with first-section prompting, continuation behavior, and section-native bible generation all green.

- [x] **Step 5: Commit the non-fiction prompt slice**

```bash
git add src/app/lib/prompts/nonFiction.ts src/app/lib/prompts/nonFiction.test.ts src/app/lib/prompts/index.ts src/app/lib/prompts/bible.ts src/app/api/generate-story/route.ts
git commit -m "feat: add non-fiction drafting prompts"
```

### Task 3: Add the argument-evidence brief output and non-fiction export behavior

**Files:**
- Modify: `src/app/types/adaptation.ts`
- Modify: `src/app/lib/adaptations.ts`
- Modify: `src/app/lib/adaptations.test.ts`
- Modify: `src/app/lib/prompts/adaptation.ts`
- Modify: `src/app/lib/storyExport.ts`
- Modify: `src/app/lib/storyExport.test.ts`

- [x] **Step 1: Write the failing output and export tests**

```ts
// src/app/lib/adaptations.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdaptationPresetsForMode,
  getDefaultAdaptationOutputType,
} from "./adaptations.ts";

test("non-fiction mode exposes argument evidence brief first", () => {
  const presets = getAdaptationPresetsForMode("non_fiction", {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "article",
  });

  assert.deepEqual(
    presets.map((preset) => preset.type),
    [
      "argument_evidence_brief",
      "short_summary",
      "public_teaser",
      "newsletter_recap",
    ]
  );
});

test("non-fiction mode defaults to the evidence brief output", () => {
  assert.equal(
    getDefaultAdaptationOutputType("non_fiction", {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "essay",
    }),
    "argument_evidence_brief"
  );
});

test("fiction mode does not expose non-fiction-only outputs", () => {
  const presets = getAdaptationPresetsForMode("fiction");

  assert.equal(
    presets.some((preset) => preset.type === "argument_evidence_brief"),
    false
  );
});
```

```ts
// src/app/lib/storyExport.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildStoryExportFile } from "./storyExport.ts";
import type { Story } from "../types/story.ts";

test("non-fiction projects export as structured plain text", () => {
  const story = {
    id: "non-fiction-1",
    title: "The Cost of Pretending Everything Scales",
    projectMode: "non_fiction",
    modeConfig: {
      draftingPreference: "hybrid_section_draft",
      formatStyle: "article_draft",
      pieceEngine: "article",
    },
    chapters: [
      {
        id: "section-1",
        chapterNumber: 1,
        content:
          "SECTION 1\nPurpose: Establish the system problem.\nClaim cue: The market rewards false certainty.",
        wordCount: 14,
      },
    ],
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: ["sharp", "analytical"],
    tropes: [],
    createdAt: "",
    updatedAt: "",
    wordCount: 14,
  } satisfies Story;

  const exportFile = buildStoryExportFile(story);

  assert.equal(exportFile.extension, "txt");
  assert.match(exportFile.content, /Mode: Non-Fiction/);
  assert.match(exportFile.content, /Drafting preference: hybrid_section_draft/);
  assert.match(exportFile.content, /Piece engine: article/);
  assert.match(exportFile.content, /Section 1/);
});
```

- [x] **Step 2: Run the output/export tests and verify they fail**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: FAIL because `argument_evidence_brief` is not yet a supported output type and export does not yet handle `non_fiction`.

- [x] **Step 3: Implement the non-fiction output and export path**

```ts
// src/app/types/adaptation.ts
export type AdaptationOutputType =
  | "short_summary"
  | "newsletter_recap"
  | "screenplay_beat_sheet"
  | "screenplay_scene_pages"
  | "comic_page_beat_sheet"
  | "quest_handoff_sheet"
  | "argument_evidence_brief"
  | "public_teaser"
  | "issue_subject_line"
  | "issue_deck"
  | "issue_section_package"
  | "issue_hook_variants"
  | "issue_cta_variants"
  | "issue_send_checklist";
```

Add this object to `ADAPTATION_PRESETS` in `src/app/lib/adaptations.ts`:

```ts
{
  type: "argument_evidence_brief",
  label: "Argument & Evidence Brief",
  description:
    "Turn the source section into a production-facing breakdown of argument moves, evidence, cited support, and proof gaps.",
  stateSources: ["draft", "memory", "plans", "saved_outputs"],
  supportingOutputTypes: ["short_summary"],
  supportedModes: ["non_fiction"],
}
```

```ts
// src/app/lib/adaptations.ts
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
    : projectMode === "game_writing"
      ? [
          "quest_handoff_sheet",
          "short_summary",
          "public_teaser",
          "newsletter_recap",
        ]
    : projectMode === "non_fiction"
      ? [
          "argument_evidence_brief",
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
  getNonFictionModeConfig,
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
    case "argument_evidence_brief":
      return 1100;
    default:
      return 800;
  }
}

function buildFormatInstructions(outputType: AdaptationOutputType): string {
  switch (outputType) {
    case "argument_evidence_brief":
      return `FORMAT INSTRUCTIONS:
- Write a structured non-fiction brief with these headings:
  Main argument
  Section claims
  Evidence used
  Cited sources
  Counterpoints / caveats
  Proof gaps / follow-up needs
- Keep each section concise and production-facing.
- Preserve the written section's actual support level instead of upgrading tentative claims into certainties.
- Use the planning layer as context for intent, but ground the brief in what the section really establishes.`;
    case "short_summary":
      return `FORMAT INSTRUCTIONS:
- Write one tight paragraph of 120 to 170 words.
- Capture the key turn, emotional movement, and source-unit consequence.
- Keep it grounded and spoiler-aware, but do not become vague.`;
    default:
      return `FORMAT INSTRUCTIONS:
- Adapt the chapter faithfully into the requested format.`;
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
  const newsletterConfig = getNewsletterModeConfig({
    projectMode,
    modeConfig,
  });
  const comicsConfig = getComicsModeConfig({
    projectMode,
    modeConfig,
  });
  const screenplayConfig = getScreenplayModeConfig({
    projectMode,
    modeConfig,
  });
  const nonFictionConfig = getNonFictionModeConfig({
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
      : projectMode === "non_fiction"
        ? "MODE: Non-Fiction"
      : `FANDOM: ${customFandom?.trim() || fandom || "Original work"}`,
    nonFictionConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${nonFictionConfig.draftingPreference}`
      : "",
    nonFictionConfig?.pieceEngine
      ? `PIECE ENGINE: ${nonFictionConfig.pieceEngine}`
      : "",
    gameWritingConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${gameWritingConfig.draftingPreference}`
      : "",
    gameWritingConfig?.questEngine
      ? `QUEST ENGINE: ${gameWritingConfig.questEngine}`
      : "",
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
    comicsConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${comicsConfig.draftingPreference}`
      : "",
    comicsConfig?.seriesEngine
      ? `SERIES ENGINE: ${comicsConfig.seriesEngine}`
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
  getNonFictionModeConfig,
  getProjectModeLabel,
  getProjectUnitLabel,
  getScreenplayModeConfig,
  isNewsletterStory,
} from "./projectMode.ts";

export function buildPlainTextStoryExport(story: Story): string {
  const lines = [`${story.title}\n`];
  lines.push(`Mode: ${getProjectModeLabel(story.projectMode)}`);

  if (story.projectMode === "non_fiction") {
    const modeConfig = getNonFictionModeConfig(story);
    if (modeConfig) {
      lines.push(`Drafting preference: ${modeConfig.draftingPreference}`);
      lines.push(`Format: ${modeConfig.formatStyle}`);
      if (modeConfig.pieceEngine) {
        lines.push(`Piece engine: ${modeConfig.pieceEngine}`);
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
  } else if (isNewsletterStory(story)) {
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

  return lines.join("\n");
}
```

- [x] **Step 4: Run the output/export tests again and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts`

Expected: PASS with the non-fiction output ordering, default output, prompt formatting branch, and plain-text export all green.

- [x] **Step 5: Commit the output and export slice**

```bash
git add src/app/types/adaptation.ts src/app/lib/adaptations.ts src/app/lib/adaptations.test.ts src/app/lib/prompts/adaptation.ts src/app/lib/storyExport.ts src/app/lib/storyExport.test.ts
git commit -m "feat: add non-fiction evidence brief output"
```

### Task 4: Wire non-fiction project creation and setup UI

**Files:**
- Create: `src/app/lib/nonFictionModeConfig.ts`
- Create: `src/app/lib/nonFictionModeConfig.test.ts`
- Create: `src/app/components/editor/NonFictionSetupPanel.tsx`
- Modify: `src/app/components/CreateStoryTab.tsx`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [x] **Step 1: Write the failing non-fiction mode-config helper tests**

```ts
// src/app/lib/nonFictionModeConfig.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_NON_FICTION_MODE_CONFIG,
  NON_FICTION_PIECE_ENGINES,
  labelNonFictionPieceEngine,
} from "./nonFictionModeConfig.ts";

test("non-fiction mode config exposes default setup values", () => {
  assert.deepEqual(NON_FICTION_PIECE_ENGINES, ["article", "essay"]);
  assert.deepEqual(DEFAULT_NON_FICTION_MODE_CONFIG, {
    draftingPreference: "hybrid_section_draft",
    formatStyle: "article_draft",
    pieceEngine: "article",
  });
});

test("labelNonFictionPieceEngine formats piece-engine labels for UI", () => {
  assert.equal(labelNonFictionPieceEngine("article"), "Article");
  assert.equal(labelNonFictionPieceEngine("essay"), "Essay");
});
```

- [x] **Step 2: Run the helper test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/nonFictionModeConfig.test.ts`

Expected: FAIL because the non-fiction setup helper does not exist yet.

- [x] **Step 3: Implement the non-fiction setup helper and UI wiring**

```ts
// src/app/lib/nonFictionModeConfig.ts
import type {
  NonFictionModeConfig,
  NonFictionPieceEngine,
} from "../types/story";

export const NON_FICTION_PIECE_ENGINES: NonFictionPieceEngine[] = [
  "article",
  "essay",
];

export const DEFAULT_NON_FICTION_MODE_CONFIG: NonFictionModeConfig = {
  draftingPreference: "hybrid_section_draft",
  formatStyle: "article_draft",
  pieceEngine: "article",
};

export function labelNonFictionPieceEngine(value: NonFictionPieceEngine) {
  return value === "essay" ? "Essay" : "Article";
}
```

```tsx
// src/app/components/editor/NonFictionSetupPanel.tsx
"use client";

import type { ReactNode } from "react";
import { ChevronDown, FileText } from "lucide-react";
import {
  DEFAULT_NON_FICTION_MODE_CONFIG,
  NON_FICTION_PIECE_ENGINES,
  labelNonFictionPieceEngine,
} from "../../lib/nonFictionModeConfig";
import type { NonFictionModeConfig } from "../../types/story";

interface NonFictionSetupPanelProps {
  nonFictionConfigDraft: NonFictionModeConfig;
  savingNonFictionConfig: boolean;
  nonFictionConfigError: string | null;
  showSetup: boolean;
  onToggleSetup: () => void;
  onConfigChange: (draft: NonFictionModeConfig) => void;
}

export default function NonFictionSetupPanel({
  nonFictionConfigDraft,
  savingNonFictionConfig,
  nonFictionConfigError,
  showSetup,
  onToggleSetup,
  onConfigChange,
}: NonFictionSetupPanelProps) {
  const selectedPieceEngine =
    nonFictionConfigDraft.pieceEngine
    ?? DEFAULT_NON_FICTION_MODE_CONFIG.pieceEngine;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Non-fiction setup</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Control how future sections frame argument pressure and article flow.
            Existing sections stay untouched.
          </p>
        </div>
        <button type="button" onClick={onToggleSetup} className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium">
          {showSetup ? "Hide setup" : "Open setup"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSetup ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showSetup && (
        <div className="mt-4 space-y-4">
          <div className="rounded-3xl border border-stone-500/20 bg-stone-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-stone-500/10 p-2 text-stone-200">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  Future generation defaults
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Non-fiction v1 always drafts as a hybrid section draft. The
                  piece engine shapes whether future sections lean article-sharp
                  or essay-reflective.
                </p>
              </div>
            </div>
          </div>

          <OptionGroup
            label="Piece engine"
            helper="This shapes structure pressure, voice, and section transitions for future sections."
          >
            {NON_FICTION_PIECE_ENGINES.map((option) => (
              <ToggleButton
                key={option}
                active={selectedPieceEngine === option}
                onClick={() =>
                  onConfigChange({
                    ...nonFictionConfigDraft,
                    pieceEngine: option,
                  })
                }
              >
                {labelNonFictionPieceEngine(option)}
              </ToggleButton>
            ))}
          </OptionGroup>

          {nonFictionConfigError && (
            <div className="rounded-2xl border border-red-700 bg-red-900/40 px-3 py-3 text-sm text-red-200">
              {nonFictionConfigError}
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
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-stone-500 bg-stone-500/15 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
```

```tsx
// src/app/components/CreateStoryTab.tsx
import {
  BookOpen,
  Clapperboard,
  ChevronDown,
  FileText,
  Gamepad2,
  Loader2,
  Mail,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";
import {
  NonFictionPieceEngine,
  ProjectMode,
  StoryFormData,
} from "../types/story";
import {
  DEFAULT_NON_FICTION_MODE_CONFIG,
  NON_FICTION_PIECE_ENGINES,
  labelNonFictionPieceEngine,
} from "../lib/nonFictionModeConfig";

const [nonFictionTitle, setNonFictionTitle] = useState("");
const [nonFictionTone, setNonFictionTone] = useState<string[]>([]);
const [nonFictionPieceEngine, setNonFictionPieceEngine] =
  useState<NonFictionPieceEngine>(
    DEFAULT_NON_FICTION_MODE_CONFIG.pieceEngine ?? "article"
  );
const [showNonFictionOptions, setShowNonFictionOptions] = useState(false);

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
      : projectMode === "game_writing"
        ? gameWritingTitle.trim().length >= 2 && gameWritingTone.length >= 1 && !busy
      : nonFictionTitle.trim().length >= 2 && nonFictionTone.length >= 1 && !busy;

<ModeButton
  label="Non-Fiction"
  active={projectMode === "non_fiction"}
  onClick={() => setProjectMode("non_fiction")}
/>

if (projectMode === "non_fiction") {
  const formData: StoryFormData = {
    projectMode: "non_fiction",
    title: nonFictionTitle.trim(),
    tone: nonFictionTone,
    pieceEngine: nonFictionPieceEngine,
  };

  const story = await createStoryInDB({
    title: nonFictionTitle.trim(),
    projectMode: "non_fiction",
    modeConfig: {
      ...DEFAULT_NON_FICTION_MODE_CONFIG,
      pieceEngine: nonFictionPieceEngine,
    },
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "teen",
    tone: nonFictionTone,
    tropes: [],
  });

  if (!story) {
    throw new Error("Please sign in before creating a new project.");
  }

  onStoryCreated(story, formData);
  return;
}

{projectMode === "non_fiction" ? (
  <>
    <div className="rounded-2xl border border-stone-500/20 bg-stone-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-stone-500/15 p-2 text-stone-200">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
            Non-Fiction
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Start with a title, tone, and piece shape so future sections know
            how tightly to frame argument and evidence.
          </p>
        </div>
      </div>
    </div>

    <Field
      label="Project title"
      helper="This is the working title and will stay attached to the article or essay project."
    >
      <input
        type="text"
        value={nonFictionTitle}
        onChange={(event) => setNonFictionTitle(event.target.value)}
        placeholder="The Cost of Pretending Everything Scales"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-stone-500 focus:outline-none"
      />
    </Field>

    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">Tone</p>
      <p className="mb-3 text-xs leading-5 text-zinc-500">
        Pick the voice and energy the system should preserve across sections.
      </p>
      <ToneSelector
        label="Tone"
        showLabel={false}
        selected={nonFictionTone}
        onChange={setNonFictionTone}
      />
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <button
        type="button"
        onClick={() => setShowNonFictionOptions((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-white">More options</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Article or essay shaping for future sections.
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${
            showNonFictionOptions ? "rotate-180" : ""
          }`}
        />
      </button>

      {showNonFictionOptions && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-300">
            Piece engine
          </p>
          <p className="mb-3 text-xs leading-5 text-zinc-500">
            This shapes whether future sections lean article-sharp or essay-reflective.
          </p>
          <div className="flex flex-wrap gap-2">
            {NON_FICTION_PIECE_ENGINES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setNonFictionPieceEngine(option)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  nonFictionPieceEngine === option
                    ? "border-stone-500 bg-stone-500/15 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {labelNonFictionPieceEngine(option)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  </>
) : null}

{projectMode === "newsletter"
  ? "Start newsletter project"
  : projectMode === "screenplay"
    ? "Start screenplay project"
    : projectMode === "comics"
      ? "Start comics project"
    : projectMode === "game_writing"
      ? "Start game writing project"
    : projectMode === "non_fiction"
      ? "Start non-fiction project"
      : "Start fiction project"}
```

```tsx
// src/app/components/editor/ArtifactsTab.tsx
import {
  getComicsModeConfig,
  getGameWritingModeConfig,
  getNewsletterModeConfig,
  getNonFictionModeConfig,
  getProjectUnitLabel,
  getScreenplayModeConfig,
} from "../../lib/projectMode";
import type {
  NonFictionModeConfig,
  StoryModeConfig,
} from "../../types/story";
import NonFictionSetupPanel from "./NonFictionSetupPanel";

const nonFictionModeConfig = useMemo(
  () =>
    getNonFictionModeConfig({
      projectMode,
      modeConfig,
    }),
  [modeConfig, projectMode]
);

const [nonFictionConfigDraft, setNonFictionConfigDraft] =
  useState<NonFictionModeConfig | null>(nonFictionModeConfig);
const [savingNonFictionConfig, setSavingNonFictionConfig] = useState(false);
const [nonFictionConfigError, setNonFictionConfigError] = useState<string | null>(
  null
);
const [showNonFictionSetup, setShowNonFictionSetup] = useState(false);
const nonFictionConfigTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
  null
);

useEffect(() => {
  setNonFictionConfigDraft(nonFictionModeConfig);
}, [nonFictionModeConfig]);

const handleNonFictionConfigChange = (nextValue: NonFictionModeConfig) => {
  setNonFictionConfigDraft(nextValue);
  setNonFictionConfigError(null);

  if (nonFictionConfigTimerRef.current) {
    clearTimeout(nonFictionConfigTimerRef.current);
  }

  nonFictionConfigTimerRef.current = setTimeout(() => {
    setSavingNonFictionConfig(true);
    void requestJson<{ modeConfig: NonFictionModeConfig }>(
      `/api/stories/${storyId}/mode-config`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modeConfig: nextValue }),
      }
    )
      .then((data) => {
        setNonFictionConfigDraft(data.modeConfig);
        onModeConfigUpdated?.(data.modeConfig);
      })
      .catch((error: unknown) => {
        setNonFictionConfigError(
          getErrorMessage(error, "Failed to save non-fiction setup")
        );
      })
      .finally(() => {
        setSavingNonFictionConfig(false);
      });
  }, 700);
};

{projectMode === "non_fiction" && nonFictionConfigDraft && (
  <NonFictionSetupPanel
    nonFictionConfigDraft={nonFictionConfigDraft}
    savingNonFictionConfig={savingNonFictionConfig}
    nonFictionConfigError={nonFictionConfigError}
    showSetup={showNonFictionSetup}
    onToggleSetup={() => setShowNonFictionSetup((prev) => !prev)}
    onConfigChange={handleNonFictionConfigChange}
  />
)}
```

- [x] **Step 4: Run the helper test again and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/nonFictionModeConfig.test.ts`

Expected: PASS with non-fiction defaults and piece-engine labels all green. The creation/setup UI should now compile cleanly against the shared mode-config route.

- [x] **Step 5: Commit the non-fiction setup flow**

```bash
git add src/app/lib/nonFictionModeConfig.ts src/app/lib/nonFictionModeConfig.test.ts src/app/components/editor/NonFictionSetupPanel.tsx src/app/components/CreateStoryTab.tsx src/app/components/editor/ArtifactsTab.tsx
git commit -m "feat: add non-fiction project setup flow"
```

### Task 5: Record rollout status and run final verification

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-04-06-non-fiction-mode.md`

- [x] **Step 1: Update product status in `CLAUDE.md`**

```md
## 2026-04-06 - Phase C4 non-fiction mode shipped

- Added `non_fiction` as a first-class project mode for article/essay workflows.
- Canonical draft is a hybrid section draft with inline claim/evidence cues.
- Added source-aware memory defaults, section-native planning phrasing, and `argument_evidence_brief`.
- Added structured plain-text export and lightweight project/setup controls.
```

- [x] **Step 2: Check off the completed boxes in this plan file as each task lands**

```md
- [x] **Step 4: Run the helper test again and verify it passes**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/nonFictionModeConfig.test.ts`

Expected: PASS with non-fiction defaults and piece-engine labels all green. The creation/setup UI should now compile cleanly against the shared mode-config route.
```

- [x] **Step 3: Run the focused regression suite**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/projectMode.test.ts src/app/lib/planningContext.test.ts src/app/lib/prompts/nonFiction.test.ts src/app/lib/adaptations.test.ts src/app/lib/storyExport.test.ts src/app/lib/nonFictionModeConfig.test.ts`

Expected: PASS with the non-fiction mode foundation, prompts, output ordering, export path, and setup helper coverage all green.

- [x] **Step 4: Run full static verification**

Run: `npx tsc --noEmit`
Expected: PASS with no TypeScript errors.

Run: `npm run lint`
Expected: PASS with no lint violations.

- [x] **Step 5: Commit the rollout docs**

```bash
git add CLAUDE.md docs/superpowers/plans/2026-04-06-non-fiction-mode.md
git commit -m "docs: record non-fiction mode rollout"
```
