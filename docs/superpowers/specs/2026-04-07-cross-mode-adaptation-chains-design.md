# Cross-Mode Adaptation Chains

**Date:** 2026-04-07
**Status:** Proposed
**Scope:** Phase D1 foundation pass

---

## Goal

Extend the existing Outputs workflow so one project can produce **multi-step cross-mode derivatives** without splitting into separate projects.

This pass should let a writer:

- start from a source project and source content unit
- run a chained workflow that crosses mode boundaries
- save each derived step back onto the source project
- inspect what came from what
- reuse those saved derivatives later in Project and Outputs

The product goal is to make "one project, many outputs" feel real at the platform level, not just within a single mode pack.

---

## Current State

The app already has a working adaptation pipeline:

- single-output generation from the current content unit
- same-project multi-step chains like `promo_chain`, `summary_to_recap`, and `issue_package`
- saved outputs persisted in `adaptation_outputs`
- shared prompt scaffolding that can read draft, memory, plans, saved outputs, and official newsletter package state

But the current system still has two important limits:

1. chains are effectively **same-mode or same-surface** workflows
2. persisted outputs do **not record derivation lineage**

The current `adaptation_outputs` table stores:

- `story_id`
- `chapter_id`
- `chapter_number`
- `output_type`
- `content`
- `context_source`
- timestamps

That is enough for saved outputs, but not enough to answer:

- did this output come straight from the chapter or from another output?
- which workflow produced it?
- what intermediate artifact did the final result depend on?

At the UI level, Outputs is also still organized around **single-mode output presets**. That works for current mode packs, but it does not yet describe a fiction project that generates screenplay and comics artifacts as chained derivatives.

---

## Chosen Approach

Add **chain-only cross-mode workflows** on top of the existing adaptation engine, and make saved outputs **lineage-aware**.

### Recommendation

For D1 v1, ship one strong workflow first:

- `fiction chapter -> screenplay scene pages -> comic page beat sheet`

This should be available as a workflow on fiction projects, while keeping screenplay/comics outputs out of the normal fiction single-output menu.

### Why this approach

This is the right first slice because it:

- builds on the existing chain route instead of replacing it
- proves true cross-mode reuse with a concrete, legible example
- avoids cluttering every mode with every other mode's output cards
- creates the minimum viable lineage model the platform will need later

### Explicit scope rule

D1 v1 should make **cross-mode chains** real.

It should **not** yet try to solve:

- arbitrary user-authored workflow builders
- full adaptation graph editing UI
- branching lineage trees
- cross-project derivative creation
- fully standalone screenplay or comics projects generated from fiction outputs

The source of truth remains the original project. Cross-mode artifacts are saved derivatives attached to that same project.

---

## Product Shape

### Source-of-truth rule

Cross-mode chains should treat the original project as canonical truth.

That means:

- the chapter draft remains canonical
- memory remains canonical
- planning remains canonical
- chained outputs are reusable derivatives, not a new root of truth

Intermediate artifacts can guide the next step in a chain, but they should never outrank the original project truth when there is tension.

### V1 workflow

The first D1 workflow should read naturally as:

- start from a fiction chapter
- derive screenplay scene pages
- derive a comic page beat sheet from those screenplay pages

This is the strongest opening proof point because it shows:

- one source story
- two downstream narrative surfaces
- a clear sequence where the first derivative meaningfully improves the second

### Chain-only output principle

For v1, cross-mode outputs should be **workflow-scoped**, not globally unlocked as standalone output types for the source mode.

So:

- fiction projects should not suddenly show all screenplay/comics outputs in the normal output picker
- instead, those outputs appear inside the selected workflow and in saved Project artifacts after generation

This keeps the default Outputs surface understandable.

---

## Workflow Model

### Current chain model

Today each chain step already has:

- `outputType`
- `source: "chapter" | "previous"`

That basic model is still correct.

### D1 extension

D1 should keep the step model simple, but make chain presets more expressive about where they are allowed and what they produce.

Recommended additions:

- keep `supportedModes` on chain presets as the **source project mode**
- add optional output metadata that identifies the **derived mode family** for UI labeling
- allow chains to reference output types that are not part of the source mode's normal single-output preset list

The current cross-mode example would look conceptually like:

```ts
{
  id: "story_to_screen_to_comic",
  label: "Story -> Screen -> Comic",
  description:
    "Turn the current chapter into screenplay scene pages, then condense those pages into a comic page beat sheet.",
  supportedModes: ["fiction"],
  steps: [
    { outputType: "screenplay_scene_pages", source: "chapter" },
    { outputType: "comic_page_beat_sheet", source: "previous" },
  ],
}
```

This keeps the engine aligned with the current chain route and avoids a bigger workflow DSL too early.

---

## Persistence And Lineage

Lineage is the core D1 platform addition.

### Recommended schema extension

Add lineage metadata directly to `adaptation_outputs`.

Recommended new columns:

- `chain_id text null`
- `chain_step_index integer null`
- `source_output_id uuid null references public.adaptation_outputs(id) on delete set null`
- `source_output_type text null`

### Why this is enough for v1

This gives the platform the minimum answers it needs:

- which workflow produced this output
- which step in that workflow it came from
- whether it was generated directly from the chapter or from a prior output
- which output type the prior step was

That supports the key product explanation:

- "this comic page beat sheet was derived from screenplay scene pages"
- "those screenplay scene pages were derived from Chapter 7"

### Important design decision

Do **not** create a separate `adaptation_chain_runs` table in v1.

That would be useful later for full workflow history, rerun auditing, or graph exploration, but it adds complexity before the product has validated the simpler lineage model.

For the first pass, the latest saved output row should simply remember its immediate parent and workflow identity.

### Application type changes

`ChapterAdaptationResult` should grow optional lineage metadata so UI and API consumers can render it without re-querying:

- `chainId?: AdaptationChainId | null`
- `chainStepIndex?: number | null`
- `sourceOutputId?: string | null`
- `sourceOutputType?: AdaptationOutputType | null`

The first step in a chain can keep `sourceOutputId` and `sourceOutputType` null because its source is the current chapter.

---

## Prompting And Context

The current chain prompts already pass:

- story title
- project mode
- mode config
- chapter summary
- story context
- planning context
- existing outputs
- the previous artifact when `source === "previous"`

That overall structure is still right, but D1 should make the hierarchy more explicit.

### Prompt rule

In cross-mode chains, the prompt should treat the previous artifact as a **formatting scaffold and adaptation bridge**, not the sole source of truth.

Each chained step should still read from:

- original draft truth
- project memory
- planning context
- the previous artifact

### Why this matters

Without this rule, a cross-mode chain can drift into a game of telephone:

- chapter nuance gets simplified in screenplay form
- then simplified again in comic form
- and the final artifact drifts away from what the chapter actually established

The prompt should explicitly guard against that by instructing the model to preserve original story truth whenever the previous step overcompresses or overinterprets.

### Workflow lineage in prompts

Cross-mode chain prompts should also receive a readable workflow label and current step framing, such as:

- `ACTIVE WORKFLOW: Story -> Screen -> Comic`
- `CURRENT STEP: Comic Page Beat Sheet`
- `IMMEDIATE SOURCE: Screenplay Scene Pages`

That will make chained outputs more consistent and explainable.

---

## Outputs UI

### Keep the existing structure

The current Outputs tab already has two useful layers:

- workflow section
- active output preview section

D1 should extend that structure, not replace it.

### Recommended UI behavior

For selected workflow chains:

- show the workflow card as today
- add step chips or cards for each output in the selected chain
- allow those chain steps to be previewed even when they are not part of the source mode's normal output preset list

For example, on a fiction project running `Story -> Screen -> Comic`:

- the standard fiction single-output presets remain unchanged
- the workflow section exposes `Screenplay Scene Pages` and `Comic Page Beat Sheet` as workflow results
- clicking a workflow step previews that saved result in the existing result viewer

### Why this matters

This keeps the default surface simple while still making the cross-mode outputs visible, inspectable, copyable, and insertable.

### Mode-family badges

Cross-mode workflow results should show a small derived-mode badge like:

- `Screenplay`
- `Comics`

This helps the user understand that:

- the source project is still fiction
- the current output belongs to another narrative surface

---

## Project Library Behavior

The Project tab should continue to treat chained outputs as saved project artifacts.

D1 should extend that experience by surfacing lineage in artifact metadata, for example:

- `Generated via Story -> Screen -> Comic`
- `Derived from Screenplay Scene Pages`

This can stay lightweight in v1.

The important thing is that once the output is saved, the user can later find it in Project and understand where it came from.

---

## API And Runtime Changes

### Chain route

The existing `/api/adapt/chain` route should remain the single orchestration point.

It should be extended to:

- pass step index metadata to persistence
- pass parent output metadata when `source === "previous"`
- persist lineage fields on each saved result

### Persistence helper

`upsertAdaptationOutput(...)` should accept optional lineage metadata.

That keeps adaptation persistence centralized and prevents the chain route from owning raw table shape concerns.

### Output loading

Saved output loading APIs do not need a new route.

They should simply return the new lineage fields so current clients can render them when available.

---

## First Supported D1 Chain

The first chain should be:

- `Story -> Screen -> Comic`

### Source mode

- `fiction`

### Steps

1. `screenplay_scene_pages` from chapter
2. `comic_page_beat_sheet` from previous

### Why this exact chain

It is the cleanest example of adaptation depth:

- fiction chapter gives narrative truth
- screenplay scene pages translate it into visual dramatic sequencing
- comic page beat sheet then compresses that visual scene logic into page-turn pacing

This is stronger than starting with a teaser or recap chain because it demonstrates platform-level transformation across creative media surfaces.

---

## Explicit Deferrals

The following should stay out of D1 v1:

- generic user-built workflow composers
- multiple parent sources for a single output
- full workflow history and run logs
- cross-project derivative creation
- automatic conversion from chain output into a brand-new screenplay/comics project
- newsletter-to-podcast or game-design chains
- visual lineage graph UI

These are good follow-up items once the first cross-mode chain proves valuable.

---

## Success Criteria

D1 is successful when a fiction writer can:

- open Outputs for a chapter
- run a `Story -> Screen -> Comic` workflow
- receive saved screenplay scene pages and a saved comic page beat sheet
- inspect both outputs in the UI
- understand that the comic result came from the screenplay result, which came from the chapter
- find those saved derivatives later in Project

without turning the Outputs tab into a mode explosion or weakening the original project as source of truth.

---

## Recommendation

Ship D1 as a **lineage-aware extension of the current chain system**, not as a brand-new adaptation platform.

The right first proof point is:

- one cross-mode chain
- one source mode
- one lineage model
- one workflow-scoped UI extension

That is enough to validate the platform direction before expanding into broader cross-mode publishing workflows.
