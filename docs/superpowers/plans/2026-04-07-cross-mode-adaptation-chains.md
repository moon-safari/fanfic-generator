# Cross-Mode Adaptation Chains Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lineage-aware cross-mode adaptation chains so a fiction chapter can generate saved screenplay scene pages and a saved comic page beat sheet on the same source project.

**Architecture:** Extend the existing adaptation chain system instead of replacing it. Add lineage columns to `adaptation_outputs`, thread that metadata through the shared adaptation types and Supabase persistence helper, teach the chain prompt/runtime about workflow step identity, and surface cross-mode workflow outputs in Outputs and Project without unlocking screenplay/comics single-output generation for fiction projects.

**Tech Stack:** Next.js App Router, TypeScript, React hooks/components, Supabase/Postgres migrations, `node:test`

---

### Task 1: Add Cross-Mode Chain Metadata And Selectable Output Helpers

**Files:**
- Modify: `src/app/types/adaptation.ts`
- Modify: `src/app/lib/adaptations.ts`
- Test: `src/app/lib/adaptations.test.ts`

- [ ] **Step 1: Write the failing registry/helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdaptationChainPreset,
  getAdaptationChainPresetsForMode,
  getAdaptationDerivedMode,
  getSelectableAdaptationOutputTypes,
} from "./adaptations.ts";

test("fiction mode exposes the story-to-screen-to-comic chain without unlocking screenplay singles", () => {
  const fictionChains = getAdaptationChainPresetsForMode("fiction");

  assert.equal(
    fictionChains.some((preset) => preset.id === "story_to_screen_to_comic"),
    true
  );
  assert.equal(
    fictionChains[0]?.id,
    "story_to_screen_to_comic"
  );
});

test("cross-mode chain metadata identifies derived mode families", () => {
  assert.equal(getAdaptationDerivedMode("screenplay_scene_pages"), "screenplay");
  assert.equal(getAdaptationDerivedMode("comic_page_beat_sheet"), "comics");
  assert.equal(getAdaptationDerivedMode("short_summary"), null);

  const preset = getAdaptationChainPreset("story_to_screen_to_comic");

  assert.deepEqual(
    preset.steps.map((step) => [step.outputType, step.source]),
    [
      ["screenplay_scene_pages", "chapter"],
      ["comic_page_beat_sheet", "previous"],
    ]
  );
});

test("selectable outputs include active cross-mode workflow steps and saved derivatives", () => {
  const selectable = getSelectableAdaptationOutputTypes({
    projectMode: "fiction",
    selectedChainId: "story_to_screen_to_comic",
    savedOutputTypes: ["comic_page_beat_sheet"],
  });

  assert.equal(selectable.includes("short_summary"), true);
  assert.equal(selectable.includes("screenplay_scene_pages"), true);
  assert.equal(selectable.includes("comic_page_beat_sheet"), true);
});
```

- [ ] **Step 2: Run the registry test to confirm the gap**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts
```

Expected: FAIL because `story_to_screen_to_comic`, `getAdaptationDerivedMode(...)`, and `getSelectableAdaptationOutputTypes(...)` do not exist yet.

- [ ] **Step 3: Implement the shared chain metadata in types and registry**

```ts
// src/app/types/adaptation.ts
export type AdaptationChainId =
  | "promo_chain"
  | "summary_to_recap"
  | "summary_to_teaser"
  | "issue_package"
  | "story_to_screen_to_comic";

export interface ChapterAdaptationResult {
  id?: string;
  storyId: string;
  outputType: AdaptationOutputType;
  chapterId: string;
  chapterNumber: number;
  content: string;
  contextSource: StoryContextSource;
  generatedAt: string;
  updatedAt: string;
  persisted: boolean;
  chainId?: AdaptationChainId | null;
  chainStepIndex?: number | null;
  sourceOutputId?: string | null;
  sourceOutputType?: AdaptationOutputType | null;
}
```

```ts
// src/app/lib/adaptations.ts
export interface AdaptationPreset {
  type: AdaptationOutputType;
  label: string;
  description: string;
  stateSources: AdaptationWorkflowStateSource[];
  supportingOutputTypes?: AdaptationOutputType[];
  usesOfficialPackageState?: boolean;
  supportedModes?: ProjectMode[];
  derivedMode?: ProjectMode;
}

export function getAdaptationDerivedMode(
  outputType: AdaptationOutputType
): ProjectMode | null {
  return getAdaptationPreset(outputType).derivedMode ?? null;
}

export function getSelectableAdaptationOutputTypes({
  projectMode,
  selectedChainId,
  savedOutputTypes = [],
  modeConfig,
}: {
  projectMode: ProjectMode;
  selectedChainId: AdaptationChainId;
  savedOutputTypes?: AdaptationOutputType[];
  modeConfig?: StoryModeConfig;
}): AdaptationOutputType[] {
  const allowed = new Set(
    getAdaptationPresetsForMode(projectMode, modeConfig).map((preset) => preset.type)
  );

  for (const outputType of getAdaptationChainPreset(selectedChainId).outputTypes) {
    allowed.add(outputType);
  }

  for (const outputType of savedOutputTypes) {
    allowed.add(outputType);
  }

  return Array.from(allowed);
}

export const ADAPTATION_PRESETS: AdaptationPreset[] = [
  {
    type: "screenplay_scene_pages",
    label: "Screenplay Scene Pages",
    description: "Convert the source material into Fountain-compatible screenplay scene pages.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary", "screenplay_beat_sheet"],
    supportedModes: ["screenplay"],
    derivedMode: "screenplay",
  },
  {
    type: "comic_page_beat_sheet",
    label: "Comic Page Beat Sheet",
    description: "Condense the current comic page into visual pacing beats and page-turn pressure.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
    supportedModes: ["comics"],
    derivedMode: "comics",
  },
  // keep existing presets unchanged otherwise
];

export const ADAPTATION_CHAIN_PRESETS: AdaptationChainPreset[] = [
  createChainPreset({
    id: "story_to_screen_to_comic",
    label: "Story -> Screen -> Comic",
    description:
      "Turn the current chapter into screenplay scene pages, then condense those pages into a comic page beat sheet.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportedModes: ["fiction"],
    steps: [
      { outputType: "screenplay_scene_pages", source: "chapter" },
      { outputType: "comic_page_beat_sheet", source: "previous" },
    ],
  }),
  // existing presets follow
];

export function getDefaultAdaptationChainId(
  projectMode: ProjectMode
): AdaptationChainId {
  return projectMode === "newsletter"
    ? "issue_package"
    : projectMode === "fiction"
      ? "story_to_screen_to_comic"
      : "promo_chain";
}
```

- [ ] **Step 4: Re-run the registry test**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts
```

Expected: PASS with the new fiction workflow and derived-mode helpers covered.

- [ ] **Step 5: Commit the registry foundation**

```bash
git add src/app/types/adaptation.ts src/app/lib/adaptations.ts src/app/lib/adaptations.test.ts
git commit -m "feat: add cross-mode adaptation chain metadata"
```

### Task 2: Persist Chain Lineage And Strengthen Chained Prompt Framing

**Files:**
- Create: `supabase/migrations/020_adaptation_chain_lineage.sql`
- Modify: `src/app/lib/prompts/adaptation.ts`
- Modify: `src/app/lib/supabase/adaptations.ts`
- Modify: `src/app/api/adapt/chain/route.ts`
- Test: `src/app/lib/prompts/adaptation.test.ts`

- [ ] **Step 1: Write the failing prompt test for workflow lineage framing**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChapterAdaptationPrompt,
  buildChainedAdaptationPrompt,
} from "./adaptation.ts";

const baseInput = {
  storyTitle: "Glass Hour",
  projectMode: "fiction" as const,
  fandom: "Original work",
  characters: ["Mara", "Iven"],
  tone: ["tense"],
  tropes: ["bargain"],
  chapterNumber: 7,
  chapterSummary: "Mara forces the terms into the open.",
  storyContext: "Mara currently controls the Star-Key.",
  planningContext: "TARGET CHAPTER PLAN:\n- Turn the bargain into a public cost.",
};

test("chapter prompts label the active workflow step", () => {
  const prompt = buildChapterAdaptationPrompt({
    ...baseInput,
    outputType: "screenplay_scene_pages",
    chapterContent: "Mara opens the case in front of Iven.",
    workflowLabel: "Story -> Screen -> Comic",
    currentStepLabel: "Screenplay Scene Pages",
  });

  assert.match(prompt, /ACTIVE WORKFLOW: Story -> Screen -> Comic/);
  assert.match(prompt, /CURRENT STEP: Screenplay Scene Pages/);
});

test("chained prompts keep the source artifact subordinate to original truth", () => {
  const prompt = buildChainedAdaptationPrompt({
    ...baseInput,
    outputType: "comic_page_beat_sheet",
    sourceLabel: "Screenplay Scene Pages",
    sourceContent: "INT. ARCHIVE - NIGHT",
    workflowLabel: "Story -> Screen -> Comic",
    currentStepLabel: "Comic Page Beat Sheet",
    immediateSourceLabel: "Screenplay Scene Pages",
  });

  assert.match(prompt, /CURRENT STEP: Comic Page Beat Sheet/);
  assert.match(prompt, /IMMEDIATE SOURCE: Screenplay Scene Pages/);
  assert.match(
    prompt,
    /Use the immediate source as a bridge artifact, not as permission to contradict the original draft\./
  );
});
```

- [ ] **Step 2: Run the prompt test to confirm the missing fields**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/adaptation.test.ts
```

Expected: FAIL because `currentStepLabel` / `immediateSourceLabel` are not supported yet and the stronger chain-truth language is missing.

- [ ] **Step 3: Add the database lineage migration**

```sql
-- supabase/migrations/020_adaptation_chain_lineage.sql
ALTER TABLE public.adaptation_outputs
  ADD COLUMN IF NOT EXISTS chain_id text,
  ADD COLUMN IF NOT EXISTS chain_step_index integer,
  ADD COLUMN IF NOT EXISTS source_output_id uuid REFERENCES public.adaptation_outputs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_output_type text;

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_chain_step_index_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_chain_step_index_check
  CHECK (chain_step_index IS NULL OR chain_step_index >= 0);

ALTER TABLE public.adaptation_outputs
  DROP CONSTRAINT IF EXISTS adaptation_outputs_source_output_type_check;

ALTER TABLE public.adaptation_outputs
  ADD CONSTRAINT adaptation_outputs_source_output_type_check
  CHECK (
    source_output_type IS NULL
    OR source_output_type IN (
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
    )
  );

CREATE INDEX IF NOT EXISTS idx_adaptation_outputs_chain_id
  ON public.adaptation_outputs(chain_id);

CREATE INDEX IF NOT EXISTS idx_adaptation_outputs_source_output_id
  ON public.adaptation_outputs(source_output_id);
```

- [ ] **Step 4: Thread lineage through prompt builders, Supabase mapping, and the chain route**

```ts
// src/app/lib/prompts/adaptation.ts
interface BuildChapterAdaptationPromptInput {
  // existing fields...
  workflowLabel?: string;
  currentStepLabel?: string;
}

interface BuildChainedAdaptationPromptInput {
  // existing fields...
  workflowLabel?: string;
  currentStepLabel?: string;
  immediateSourceLabel?: string;
}

function buildWorkflowStateBlock({
  outputType,
  existingOutputs,
  packageSelection,
  workflowLabel,
  currentStepLabel,
  immediateSourceLabel,
}: {
  outputType: AdaptationOutputType;
  existingOutputs?: ChapterAdaptationResult[];
  packageSelection?: NewsletterIssuePackageSelectionValues | null;
  workflowLabel?: string;
  currentStepLabel?: string;
  immediateSourceLabel?: string;
}): string {
  // ...
  blocks.push(`WORKFLOW STATE:
${workflowLabel ? `ACTIVE WORKFLOW: ${workflowLabel}\n` : ""}${currentStepLabel ? `CURRENT STEP: ${currentStepLabel}\n` : ""}${immediateSourceLabel ? `IMMEDIATE SOURCE: ${immediateSourceLabel}\n` : ""}THIS OUTPUT SHOULD READ FROM:
${stateSources}

ALIGNMENT RULES:
- Build on any saved workflow state instead of resetting from zero.
- Keep the new output aligned with project memory and planning context.
- Use the immediate source as a bridge artifact, not as permission to contradict the original draft.
- If the immediate source compresses or overinterprets the draft, prefer the draft, project memory, and planning context.`);
  // ...
}
```

```ts
// src/app/lib/supabase/adaptations.ts
type DbAdaptationOutputRow = {
  id: string;
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  output_type: AdaptationOutputType;
  content: string;
  context_source: StoryContextSource;
  chain_id: AdaptationChainId | null;
  chain_step_index: number | null;
  source_output_id: string | null;
  source_output_type: AdaptationOutputType | null;
  created_at: string;
  updated_at: string;
};

export async function upsertAdaptationOutput(
  supabase: SupabaseClient,
  input: {
    storyId: string;
    chapterId: string;
    chapterNumber: number;
    outputType: AdaptationOutputType;
    content: string;
    contextSource: StoryContextSource;
    chainId?: AdaptationChainId | null;
    chainStepIndex?: number | null;
    sourceOutputId?: string | null;
    sourceOutputType?: AdaptationOutputType | null;
  }
): Promise<ChapterAdaptationResult | null> {
  // include chain_id, chain_step_index, source_output_id, source_output_type in upsert payload
}

function mapAdaptationOutputRow(row: DbAdaptationOutputRow): ChapterAdaptationResult {
  return {
    id: row.id,
    storyId: row.story_id,
    outputType: row.output_type,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number,
    content: row.content,
    contextSource: row.context_source,
    generatedAt: row.created_at,
    updatedAt: row.updated_at,
    persisted: true,
    chainId: row.chain_id,
    chainStepIndex: row.chain_step_index,
    sourceOutputId: row.source_output_id,
    sourceOutputType: row.source_output_type,
  };
}
```

```ts
// src/app/api/adapt/chain/route.ts
let previousResult: ChapterAdaptationResult | null = null;

for (const [chainStepIndex, step] of chain.steps.entries()) {
  const stepLabel = getAdaptationPreset(step.outputType).label;
  const immediateSourceLabel =
    step.source === "previous" && previousResult
      ? getAdaptationPreset(previousResult.outputType).label
      : undefined;

  const prompt =
    step.source === "previous" && previousResult
      ? buildChainedAdaptationPrompt({
          // existing fields...
          sourceLabel: immediateSourceLabel ?? "Previous output",
          sourceContent: previousResult.content,
          workflowLabel: chain.label,
          currentStepLabel: stepLabel,
          immediateSourceLabel,
        })
      : buildChapterAdaptationPrompt({
          // existing fields...
          workflowLabel: chain.label,
          currentStepLabel: stepLabel,
        });

  const result = await persistChainedOutput(source, step.outputType, content, {
    chainId,
    chainStepIndex,
    sourceOutputId:
      step.source === "previous" ? previousResult?.id ?? null : null,
    sourceOutputType:
      step.source === "previous" ? previousResult?.outputType ?? null : null,
  });

  previousResult = result;
}

async function persistChainedOutput(
  source: AdaptationSourceData,
  outputType: ChapterAdaptationResult["outputType"],
  content: string,
  lineage: {
    chainId: AdaptationChainId;
    chainStepIndex: number;
    sourceOutputId: string | null;
    sourceOutputType: AdaptationOutputType | null;
  }
): Promise<ChapterAdaptationResult> {
  // seed the optimistic result with lineage metadata
  // pass lineage fields through upsertAdaptationOutput(...)
}
```

- [ ] **Step 5: Re-run the prompt test, then typecheck the route/persistence changes**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/prompts/adaptation.test.ts
npx tsc --noEmit
```

Expected: the prompt test PASSes and TypeScript reports no errors for the new lineage fields.

- [ ] **Step 6: Commit the lineage plumbing**

```bash
git add supabase/migrations/020_adaptation_chain_lineage.sql src/app/lib/prompts/adaptation.ts src/app/lib/prompts/adaptation.test.ts src/app/lib/supabase/adaptations.ts src/app/api/adapt/chain/route.ts
git commit -m "feat: persist adaptation chain lineage"
```

### Task 3: Support Cross-Mode Workflow Preview In Outputs

**Files:**
- Modify: `src/app/hooks/useChapterAdaptation.ts`
- Modify: `src/app/components/editor/AdaptTab.tsx`
- Modify: `src/app/lib/adaptations.ts`
- Test: `src/app/lib/adaptations.test.ts`

- [ ] **Step 1: Add the failing regression test for selectable cross-mode outputs**

```ts
test("saved cross-mode derivatives stay selectable on fiction projects", () => {
  const selectable = getSelectableAdaptationOutputTypes({
    projectMode: "fiction",
    selectedChainId: "promo_chain",
    savedOutputTypes: ["screenplay_scene_pages", "comic_page_beat_sheet"],
  });

  assert.equal(selectable.includes("screenplay_scene_pages"), true);
  assert.equal(selectable.includes("comic_page_beat_sheet"), true);
});
```

- [ ] **Step 2: Run the registry test suite again**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts
```

Expected: FAIL if the selectable helper still drops saved cross-mode outputs.

- [ ] **Step 3: Update the hook so workflow results do not get reset back to fiction defaults**

```ts
// src/app/hooks/useChapterAdaptation.ts
const selectableOutputTypes = useMemo(
  () =>
    getSelectableAdaptationOutputTypes({
      projectMode,
      modeConfig,
      selectedChainId,
      savedOutputTypes: Object.keys(resultsByType) as AdaptationOutputType[],
    }),
  [modeConfig, projectMode, resultsByType, selectedChainId]
);

useEffect(() => {
  if (!selectableOutputTypes.includes(activeOutputType)) {
    setActiveOutputType(getDefaultOutputType(projectMode, modeConfig));
  }

  if (!isChainIdEnabled(selectedChainId, projectMode)) {
    setSelectedChainId(getDefaultChainId(projectMode));
  }
}, [
  activeOutputType,
  modeConfig,
  projectMode,
  selectableOutputTypes,
  selectedChainId,
]);
```

- [ ] **Step 4: Update the Outputs panel to render cross-mode badges and lineage-aware current previews**

```tsx
// src/app/components/editor/AdaptTab.tsx
const activePreset = getAdaptationPreset(activeOutputType);

{selectedChainPreset.outputTypes.map((outputType) => {
  const derivedMode = getAdaptationDerivedMode(outputType);
  const isCrossMode = Boolean(derivedMode && derivedMode !== projectMode);

  return (
    <button key={outputType} type="button" onClick={() => onSelectOutputType(outputType)}>
      <div className="flex items-center gap-2">
        <span>{getPresetLabel(outputType)}</span>
        {isCrossMode && (
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cyan-200">
            {derivedMode === "screenplay" ? "Screenplay" : "Comics"}
          </span>
        )}
      </div>
    </button>
  );
})}
```

```tsx
// src/app/components/editor/AdaptTab.tsx
{currentResult && currentResult.chainId && (
  <p className="text-xs text-zinc-500">
    {[
      `Generated via ${getAdaptationChainPreset(currentResult.chainId).label}`,
      currentResult.sourceOutputType
        ? `Derived from ${getPresetLabel(currentResult.sourceOutputType)}`
        : "Derived directly from the current chapter",
    ].join(" | ")}
  </p>
)}
```

- [ ] **Step 5: Re-run the registry tests and typecheck the hook/UI**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts
npx tsc --noEmit
```

Expected: PASS and no TypeScript regressions for cross-mode workflow selection.

- [ ] **Step 6: Commit the Outputs-tab support**

```bash
git add src/app/hooks/useChapterAdaptation.ts src/app/components/editor/AdaptTab.tsx src/app/lib/adaptations.ts src/app/lib/adaptations.test.ts
git commit -m "feat: support cross-mode workflow previews"
```

### Task 4: Surface Lineage In Project Artifacts

**Files:**
- Modify: `src/app/types/artifact.ts`
- Modify: `src/app/lib/artifacts.ts`
- Modify: `src/app/lib/artifactsHelpers.ts`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`
- Modify: `src/app/api/artifacts/[storyId]/route.ts`
- Test: `src/app/lib/artifacts.test.ts`

- [ ] **Step 1: Write the failing artifact-lineage test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { toAdaptationArtifact } from "./artifacts.ts";

test("adaptation artifacts preserve cross-mode lineage metadata", () => {
  const artifact = toAdaptationArtifact(
    {
      id: "output-2",
      storyId: "story-1",
      chapterId: "chapter-7",
      chapterNumber: 7,
      outputType: "comic_page_beat_sheet",
      content: "1. Open on the broken archive ceiling.",
      contextSource: "story_bible",
      generatedAt: "2026-04-07T10:00:00.000Z",
      updatedAt: "2026-04-07T10:05:00.000Z",
      persisted: true,
      chainId: "story_to_screen_to_comic",
      chainStepIndex: 1,
      sourceOutputId: "output-1",
      sourceOutputType: "screenplay_scene_pages",
    },
    "fiction"
  );

  assert.equal(artifact.derivedMode, "comics");
  assert.equal(artifact.chainId, "story_to_screen_to_comic");
  assert.equal(artifact.sourceOutputType, "screenplay_scene_pages");
});
```

- [ ] **Step 2: Run the artifact test to confirm the missing fields**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/artifacts.test.ts
```

Expected: FAIL because adaptation artifacts do not carry derived-mode or lineage metadata yet.

- [ ] **Step 3: Extend artifact types and mapping**

```ts
// src/app/types/artifact.ts
export interface AdaptationArtifact extends BaseProjectArtifact {
  kind: "adaptation";
  subtype: AdaptationOutputType;
  chapterId: string;
  chapterNumber: number;
  contextSource: StoryContextSource;
  derivedMode?: ProjectMode | null;
  chainId?: AdaptationChainId | null;
  chainStepIndex?: number | null;
  sourceOutputId?: string | null;
  sourceOutputType?: AdaptationOutputType | null;
}
```

```ts
// src/app/lib/artifacts.ts
export function toAdaptationArtifact(
  result: ChapterAdaptationResult,
  projectMode: ProjectMode = "fiction"
): AdaptationArtifact {
  const preset = getAdaptationPreset(result.outputType);

  return {
    id: result.id ?? `${result.chapterId}:${result.outputType}`,
    kind: "adaptation",
    subtype: result.outputType,
    storyId: result.storyId,
    chapterId: result.chapterId,
    chapterNumber: result.chapterNumber,
    title: `${getProjectUnitLabel(projectMode, { capitalize: true })} ${result.chapterNumber} ${preset.label}`,
    description: preset.description,
    content: result.content,
    contextSource: result.contextSource,
    createdAt: result.generatedAt,
    updatedAt: result.updatedAt,
    persisted: result.persisted,
    derivedMode: getAdaptationDerivedMode(result.outputType),
    chainId: result.chainId ?? null,
    chainStepIndex: result.chainStepIndex ?? null,
    sourceOutputId: result.sourceOutputId ?? null,
    sourceOutputType: result.sourceOutputType ?? null,
  };
}
```

- [ ] **Step 4: Add artifact-side lineage helpers and render them in the Project tab**

```ts
// src/app/lib/artifactsHelpers.ts
export function formatAdaptationArtifactLineage(
  artifact: AdaptationArtifact
): string | null {
  if (!artifact.chainId) {
    return null;
  }

  const parts = [`Generated via ${getAdaptationChainPreset(artifact.chainId).label}`];

  if (artifact.sourceOutputType) {
    parts.push(`Derived from ${getAdaptationPreset(artifact.sourceOutputType).label}`);
  } else {
    parts.push("Derived directly from the current chapter");
  }

  return parts.join(" | ");
}
```

```tsx
// src/app/components/editor/ArtifactsTab.tsx
{artifact.kind === "adaptation" && artifact.derivedMode && artifact.derivedMode !== projectMode && (
  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-cyan-200">
    {getProjectModeLabel(artifact.derivedMode)}
  </span>
)}

const adaptationLineage =
  selectedArtifact?.kind === "adaptation"
    ? formatAdaptationArtifactLineage(selectedArtifact)
    : null;

{adaptationLineage && (
  <p className="mt-2 text-xs text-zinc-500">{adaptationLineage}</p>
)}
```

- [ ] **Step 5: Re-run the artifact test and the focused suite**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/artifacts.test.ts src/app/lib/adaptations.test.ts src/app/lib/prompts/adaptation.test.ts
npx tsc --noEmit
```

Expected: PASS and clean compile output.

- [ ] **Step 6: Commit the Project-tab lineage work**

```bash
git add src/app/types/artifact.ts src/app/lib/artifacts.ts src/app/lib/artifactsHelpers.ts src/app/components/editor/ArtifactsTab.tsx src/app/api/artifacts/[storyId]/route.ts src/app/lib/artifacts.test.ts
git commit -m "feat: surface adaptation lineage in project artifacts"
```

### Task 5: Rollout Notes, Manual Verification, And Final Closeout

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/plans/2026-04-07-cross-mode-adaptation-chains.md`

- [ ] **Step 1: Update the product log and mark the plan complete**

```md
<!-- CLAUDE.md -->
- Phase D1 shipped: fiction projects can now run the Story -> Screen -> Comic workflow, saved outputs persist lineage in adaptation_outputs, and Outputs/Project show derived-mode lineage metadata.
```

```md
<!-- docs/superpowers/plans/2026-04-07-cross-mode-adaptation-chains.md -->
- [x] Task 1: Add Cross-Mode Chain Metadata And Selectable Output Helpers
- [x] Task 2: Persist Chain Lineage And Strengthen Chained Prompt Framing
- [x] Task 3: Support Cross-Mode Workflow Preview In Outputs
- [x] Task 4: Surface Lineage In Project Artifacts
- [x] Task 5: Rollout Notes, Manual Verification, And Final Closeout
```

- [ ] **Step 2: Run the full automated verification**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/adaptations.test.ts src/app/lib/prompts/adaptation.test.ts src/app/lib/artifacts.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all tests PASS, TypeScript PASSes, and lint PASSes.

- [ ] **Step 3: Run the manual product smoke pass**

Use the local app and verify this sequence:

```text
1. Open a fiction project with a saved chapter.
2. Go to Outputs and confirm the default workflow is Story -> Screen -> Comic.
3. Run the workflow and verify screenplay scene pages save first, then comic page beat sheet saves second.
4. Click each workflow step chip and confirm the preview stays on that cross-mode output instead of snapping back to Short Summary.
5. Confirm the comic result reads "Generated via Story -> Screen -> Comic | Derived from Screenplay Scene Pages".
6. Open Project and confirm both derived outputs appear with Screenplay / Comics badges and the same lineage text.
```

- [ ] **Step 4: Commit the rollout docs**

```bash
git add CLAUDE.md docs/superpowers/plans/2026-04-07-cross-mode-adaptation-chains.md
git commit -m "docs: record cross-mode adaptation chain rollout"
```
