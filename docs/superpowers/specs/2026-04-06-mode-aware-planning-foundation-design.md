# Mode-Aware Planning Foundation

**Date:** 2026-04-06
**Status:** Proposed
**Scope:** Phase B4 foundation pass

---

## Goal

Extend the mode system so planning is no longer a hardcoded, fiction-first shared layer sitting beside `ModeConfig`.

This pass should make planning metadata and planning prompt assembly mode-aware while preserving the current `outline` + `notes` storage model and existing planning UI.

The immediate win is architectural:

- planning becomes part of the mode abstraction
- future modes can define their planning semantics in config
- fiction and newsletter keep working on the current data model

without forcing a new planning editor or migration right now.

---

## Current State

The codebase already has a strong mode-aware memory layer:

- `src/app/lib/modes/types.ts`
- `src/app/lib/modes/fiction.ts`
- `src/app/lib/modes/newsletter.ts`
- `src/app/lib/modes/registry.ts`

But planning is still mostly handled outside that system:

- `src/app/lib/planningContext.ts` builds prompt context from shared `outline` / `notes`
- `src/app/lib/artifacts.ts` formats planning artifacts with global assumptions plus `projectMode`
- `src/app/lib/prompts/bible.ts` generates and formats planning sections directly
- `src/app/types/bible.ts` defines one shared planning shape

That means:

- planning labels are still derived ad hoc from `projectMode`
- planning prompt assembly is not owned by `ModeConfig`
- future mode packs cannot define their planning semantics through the same abstraction that already governs memory

So the engine is mode-aware for memory, but not yet mode-aware in the deeper planning layer.

---

## Chosen Approach

Add planning metadata and planning prompt builders to `ModeConfig`, but keep the underlying stored planning content shape unchanged for now.

This pass will:

1. extend `ModeConfig` with planning-related fields
2. introduce a shared planning schema descriptor type for the existing `outline` / `notes` model
3. move planning prompt assembly behind mode-owned builders
4. update shared planning/artifact helpers to read planning labels and descriptions from config instead of scattered `projectMode` conditionals

This pass will **not**:

- introduce a new newsletter-only planning database shape
- replace `outline` or `notes`
- rewrite `OutlineEditor` or `NotesEditor`
- add new planning actions or routes

---

## Design Principle

Separate **planning semantics** from **planning storage**.

Right now the current storage model is good enough:

- `outline`
- `notes`
- arcs
- threads

The problem is not the data existing in those sections.
The problem is that the meaning of those sections is still encoded in shared helper logic instead of mode config.

So this pass will let modes describe:

- what a planning unit is called
- how the current planning sections should be described
- how planning guidance should be rendered into prompts

without changing the stored content yet.

That gives us a clean bridge to richer future schemas.

---

## Proposed ModeConfig Additions

Extend `ModeConfig` with optional planning fields such as:

- `planningUnitLabel`
  - the creator-facing planning unit label
  - examples:
    - fiction: `beat`
    - newsletter: `topic slot`

- `planningSchema`
  - a descriptor for the current planning surfaces and labels
  - not a new database schema
  - a typed metadata object that explains how the shared `outline` / `notes` model should be interpreted in this mode

- `buildPlanningPrompt`
  - mode-owned prompt assembly for current-unit planning guidance
  - returns the same kind of soft-guidance block currently produced in `planningContext.ts`

For this pass, `planningSchema` should describe the current shared structure, for example:

- outline section title/description
- notes section title/description
- what `openLoops` means in this mode
- what arcs and threads mean in this mode

This is intentionally lighter than a full per-mode planning DSL.

---

## Behavior

### Planning prompt assembly

`resolvePlanningPromptContext(...)` should stop containing the canonical formatting logic itself.

Instead it should:

1. fetch the current planning sections (`outline`, `notes`)
2. resolve the story mode
3. call the active mode's `buildPlanningPrompt(...)`

That means:

- fiction owns fiction planning phrasing
- newsletter owns newsletter planning phrasing
- future modes can add their own planning prompt behavior without editing shared helpers

### Artifact metadata and labels

Shared planning artifact helpers should stop hardcoding planning copy from `projectMode` alone.

They should derive planning-facing labels and descriptions from `ModeConfig` where possible, for example:

- what the outline is called or described as
- what notes represent in that mode
- what the planning unit means in summary strings

This pass does not need to rename the actual stored section keys.
It only needs to move interpretation into config.

### Story-bible/editor stability

The existing planning editors can remain on:

- `OutlineEditor`
- `NotesEditor`

because the point of this pass is the underlying abstraction, not a visible editor redesign.

If a small mode-aware label improvement falls out naturally, that is acceptable.
But a UI rewrite is explicitly out of scope.

---

## Fiction vs Newsletter in This Pass

### Fiction

Fiction should formalize the planning meaning it already uses:

- planning unit label: `beat`
- current stored outline still maps to chapter planning
- notes still represent active arcs and threads

### Newsletter

Newsletter should formalize a newsletter-native interpretation without changing the current stored sections:

- planning unit label: `topic slot` (or equivalent issue-planning unit)
- outline still stores issue-level plan records
- notes still store editorial throughlines, recurring segments, CTA patterns, and open promises

This keeps newsletter planning more native in config and prompt language even before a deeper schema change.

---

## Files Likely In Scope

### Mode system

- `src/app/lib/modes/types.ts`
- `src/app/lib/modes/fiction.ts`
- `src/app/lib/modes/newsletter.ts`
- `src/app/lib/modes/registry.ts`

### Planning prompt assembly

- `src/app/lib/planningContext.ts`

### Shared planning/artifact interpretation

- `src/app/lib/artifacts.ts`
- `src/app/lib/prompts/bible.ts`

### Types

- `src/app/types/bible.ts`
  - only if a small shared schema-descriptor type belongs here
- or a new planning-specific type file if that keeps mode/planning boundaries cleaner

---

## Testing Strategy

This pass should be validated with focused tests around pure helpers, not browser workflows.

Recommended coverage:

1. mode config planning metadata
   - fiction and newsletter both expose the expected planning fields

2. planning prompt assembly
   - current-unit planning context resolves through the mode-owned builder
   - fiction and newsletter produce different planning phrasing where appropriate

3. artifact formatting
   - planning artifact config reads mode-aware planning labels/descriptions instead of only `projectMode`

Then run:

- focused Node tests for the new pure helpers
- `npx tsc --noEmit`
- `npm run lint`

---

## Non-goals

This pass does not:

- add a new database migration
- introduce a separate newsletter planning schema in storage
- change planning section keys away from `outline` and `notes`
- add a beat-complete action
- redesign Story Bible or Project planning editors
- implement new future modes such as screenplay or comics

---

## Why this slice

This is the right first B4 move because it upgrades the architecture without destabilizing the planning UI:

- planning becomes part of the same abstraction system as memory
- future modes get a clean place to define planning semantics
- newsletter gains more native planning interpretation immediately
- deeper schema work can come later without redoing the config boundary

In short: this pass makes the mode engine truly planning-aware, not just memory-aware.
