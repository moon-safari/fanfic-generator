# Mode-Aware Planning Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move planning semantics into `ModeConfig` so planning prompt assembly and planning artifact copy are mode-aware without changing the stored `outline` + `notes` shape.

**Architecture:** Add typed planning metadata and a mode-owned planning prompt builder to the mode registry, then refactor shared planning/artifact helpers to consume that config instead of fiction-first conditionals. Keep the storage model and existing planning editors stable; only thread mode-aware labels into helper paths that already know `projectMode`.

**Tech Stack:** TypeScript, Next.js App Router codebase, Node test runner, ESLint

---

### Task 1: Lock the B4 behavior with failing pure-helper tests

**Files:**
- Create: `src/app/lib/planningContext.test.ts`
- Create: `src/app/lib/artifacts.test.ts`
- Modify: `src/app/lib/planningContext.ts`
- Modify: `src/app/lib/artifacts.ts`

- [ ] **Step 1: Write the failing planning-context tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildPlanningPromptContext } from "./planningContext.ts";
import { getModeConfig } from "./modes/registry.ts";

const outline = {
  chapters: [
    {
      number: 4,
      title: "The Terms of the Bargain",
      summary: "Mara finally states the price of the Star-Key.",
      intent: "Force the confrontation into the open.",
      keyReveal: "Mara bargained away her claim to the key.",
      openLoops: ["Who now controls the Star-Key?"],
      status: "planned",
    },
  ],
} as const;

const notes = {
  text: "Keep the promise ledger legible.",
  arcs: [
    {
      id: "price-of-power",
      title: "The price of power",
      intent: "Show every gain costing Mara something real.",
      status: "active",
      horizon: "Before the midpoint",
    },
  ],
  threads: [
    {
      id: "star-key-custody",
      title: "Star-Key custody",
      owner: "Mara",
      targetUnit: 4,
      status: "open",
      notes: "Resolve who physically holds it after the reveal.",
    },
  ],
} as const;

test("fiction mode exposes planning metadata and fiction phrasing", () => {
  const mode = getModeConfig("fiction");

  assert.equal(mode.planningUnitLabel, "beat");
  assert.equal(mode.planningSchema.notes.title, "Planning Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "fiction",
  });

  assert.match(prompt, /TARGET CHAPTER PLAN:/);
  assert.match(prompt, /ACTIVE ARCS TO HONOR:/);
  assert.match(prompt, /THREADS DUE BY CHAPTER 4:/);
});

test("newsletter mode uses newsletter-native planning phrasing", () => {
  const mode = getModeConfig("newsletter");

  assert.equal(mode.planningUnitLabel, "topic slot");
  assert.equal(mode.planningSchema.notes.title, "Editorial Notes");

  const prompt = buildPlanningPromptContext({
    outline,
    notes,
    unitNumber: 4,
    projectMode: "newsletter",
  });

  assert.match(prompt, /TARGET ISSUE PLAN:/);
  assert.match(prompt, /EDITORIAL THROUGHLINES TO HONOR:/);
  assert.match(prompt, /OPEN PROMISES DUE BY ISSUE 4:/);
});
```

- [ ] **Step 2: Run the planning-context test and verify it fails for the expected reason**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/planningContext.test.ts`

Expected: FAIL because `ModeConfig` does not yet expose planning fields and newsletter-specific planning phrasing does not exist.

- [ ] **Step 3: Write the failing artifact-metadata tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getArtifactSubtypeLabel,
  getPlanningArtifactConfig,
  formatPlanningArtifactContent,
} from "./artifacts.ts";

test("newsletter planning artifacts use newsletter-aware labels and descriptions", () => {
  const config = getPlanningArtifactConfig("newsletter");

  assert.equal(config.outline.description, "Issue-by-issue plan and status map.");
  assert.equal(config.notes.title, "Editorial Notes");
  assert.equal(getArtifactSubtypeLabel("notes", "newsletter"), "Editorial Notes");
});

test("newsletter planning artifacts format notes with editorial labels", () => {
  const text = formatPlanningArtifactContent(
    "notes",
    {
      text: "Keep the audience promise specific.",
      arcs: [
        {
          id: "trust-loop",
          title: "Trust-building series",
          intent: "Deepen the weekly point of view.",
          status: "active",
        },
      ],
      threads: [
        {
          id: "cta-followup",
          title: "CTA follow-up",
          targetUnit: 5,
          status: "open",
        },
      ],
    },
    undefined,
    "newsletter"
  );

  assert.match(text, /Editorial throughlines:/);
  assert.match(text, /Open promises:/);
  assert.match(text, /Target payoff: Issue 5/);
});
```

- [ ] **Step 4: Run the artifact test and verify it fails**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/artifacts.test.ts`

Expected: FAIL because artifact helpers still derive planning copy from shared fiction-first defaults.

- [ ] **Step 5: Commit the red tests**

```bash
git add src/app/lib/planningContext.test.ts src/app/lib/artifacts.test.ts
git commit -m "test: cover mode aware planning foundation"
```

### Task 2: Add typed planning config to the mode registry

**Files:**
- Modify: `src/app/lib/modes/types.ts`
- Modify: `src/app/lib/modes/fiction.ts`
- Modify: `src/app/lib/modes/newsletter.ts`

- [ ] **Step 1: Extend the mode types with planning metadata**

```ts
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
  // existing fields...
  planningUnitLabel: string;
  planningSchema: PlanningSchema;
  buildPlanningPrompt: (args: ModePlanningPromptArgs) => string;
}
```

- [ ] **Step 2: Implement fiction planning metadata and builder**

```ts
const fictionPlanningSchema = {
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
} satisfies PlanningSchema;

export const fictionMode: ModeConfig = {
  // existing fields...
  planningUnitLabel: "beat",
  planningSchema: fictionPlanningSchema,
  buildPlanningPrompt: (args) => buildFictionPlanningPrompt(args),
};
```

- [ ] **Step 3: Implement newsletter planning metadata and builder**

```ts
const newsletterPlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description: "The core promise and direction of the publication.",
    emptyLabel: "Add a short publication synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Voice, cadence, pacing, and editorial guardrails.",
    emptyLabel: "Define tone, cadence, pacing, and editorial rules...",
  },
  outline: {
    title: "Outline",
    description: "Issue-by-issue plan and status map.",
    emptyLabel: "Add planned issue slots and beats...",
    openLoopsLabel: "Carry forward",
  },
  notes: {
    title: "Editorial Notes",
    description: "Audience promises, editorial throughlines, open promises, and research.",
    emptyLabel: "Capture editorial notes, throughlines, and unresolved promises...",
    arcsHeading: "Editorial throughlines",
    threadsHeading: "Open promises",
  },
} satisfies PlanningSchema;

export const newsletterMode: ModeConfig = {
  // existing fields...
  planningUnitLabel: "topic slot",
  planningSchema: newsletterPlanningSchema,
  buildPlanningPrompt: (args) => buildNewsletterPlanningPrompt(args),
};
```

- [ ] **Step 4: Run the planning-context test and verify it still fails on shared-helper delegation gaps**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/planningContext.test.ts`

Expected: FAIL or partial FAIL until `planningContext.ts` and `artifacts.ts` start consuming the new config.

- [ ] **Step 5: Commit the mode-config foundation**

```bash
git add src/app/lib/modes/types.ts src/app/lib/modes/fiction.ts src/app/lib/modes/newsletter.ts
git commit -m "feat: add mode owned planning config"
```

### Task 3: Refactor shared planning and artifact helpers to consume mode config

**Files:**
- Modify: `src/app/lib/planningContext.ts`
- Modify: `src/app/lib/artifacts.ts`
- Modify: `src/app/lib/artifactsHelpers.ts`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Delegate planning prompt assembly through the active mode**

```ts
import { getModeConfig } from "./modes/registry";

export function buildPlanningPromptContext(args: {
  outline?: BibleOutlineContent | null;
  notes?: BibleNotesContent | null;
  unitNumber: number;
  projectMode: ProjectMode;
}) {
  const mode = getModeConfig(args.projectMode);
  return mode.buildPlanningPrompt(args);
}
```

- [ ] **Step 2: Make planning artifact metadata mode-aware**

```ts
export function getPlanningArtifactConfig(projectMode: ProjectMode) {
  const { planningSchema } = getModeConfig(projectMode);
  return {
    synopsis: planningSchema.synopsis,
    style_guide: planningSchema.styleGuide,
    outline: planningSchema.outline,
    notes: planningSchema.notes,
  };
}

export function getArtifactSubtypeLabel(
  subtype: ProjectArtifact["subtype"],
  projectMode: ProjectMode = "fiction"
) {
  if (isPlanningArtifactSubtype(subtype)) {
    return getPlanningArtifactConfig(projectMode)[subtype].title;
  }

  return getAdaptationPreset(subtype).label;
}
```

- [ ] **Step 3: Thread `projectMode` through artifact helper call sites**

```ts
export function formatArtifactListMeta(
  artifact: ProjectArtifact,
  unitLabelAbbreviated: string,
  projectMode: ProjectMode
) {
  return [
    labelArtifactKind(artifact.kind),
    getArtifactSubtypeLabel(artifact.subtype, projectMode),
    // ...
  ].join(" | ");
}
```

```tsx
getArtifactSubtypeLabel(effectiveTypeFilter, projectMode)
formatArtifactListMeta(artifact, unitLabelAbbreviated, projectMode)
```

- [ ] **Step 4: Re-run the focused tests and verify they pass**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/planningContext.test.ts src/app/lib/artifacts.test.ts`

Expected: PASS with newsletter-specific planning phrasing and artifact labels now resolved via mode config.

- [ ] **Step 5: Commit the shared-helper refactor**

```bash
git add src/app/lib/planningContext.ts src/app/lib/artifacts.ts src/app/lib/artifactsHelpers.ts src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: make planning helpers mode aware"
```

### Task 4: Full verification and handoff

**Files:**
- Modify: `docs/superpowers/plans/2026-04-06-mode-aware-planning-foundation.md`

- [ ] **Step 1: Run the full focused verification set**

Run: `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/planningContext.test.ts src/app/lib/artifacts.test.ts`

Expected: PASS

Run: `npx tsc --noEmit`

Expected: PASS

Run: `npm run lint`

Expected: PASS

- [ ] **Step 2: Review the requirements against the shipped diff**

Checklist:
- `ModeConfig` owns planning metadata
- planning prompt assembly delegates through mode config
- planning artifact labels/descriptions come from mode config
- `outline` + `notes` storage and existing editors remain intact

- [ ] **Step 3: Commit the final B4 implementation**

```bash
git add src/app/lib/planningContext.test.ts src/app/lib/artifacts.test.ts src/app/lib/modes/types.ts src/app/lib/modes/fiction.ts src/app/lib/modes/newsletter.ts src/app/lib/planningContext.ts src/app/lib/artifacts.ts src/app/lib/artifactsHelpers.ts src/app/components/editor/ArtifactsTab.tsx docs/superpowers/plans/2026-04-06-mode-aware-planning-foundation.md
git commit -m "feat: add mode aware planning foundation"
```
