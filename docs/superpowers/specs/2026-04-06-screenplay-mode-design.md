# Screenplay Mode

**Date:** 2026-04-06  
**Status:** Proposed  
**Scope:** Phase C1 foundation pass

---

## Goal

Add **Screenplay** as a real project mode, not just a fiction adaptation target.

This pass should let a writer:

- create a screenplay project
- choose a durable screenplay drafting preference
- write scene-based screenplay work in the main editor
- use screenplay-native memory and planning semantics
- generate screenplay-specific outputs
- export screenplay work in a usable text format

The core product goal is to prove that the Writing OS can support a third mode pack end to end while preserving the shared memory, planning, continuity, and outputs engine.

---

## Current State

The product currently supports two real modes:

- `fiction`
- `newsletter`

The mode system is now strong in the right places:

- `ModeConfig` exists and already owns memory + planning semantics
- shared prompt-context assembly is mode-aware
- planning semantics are mode-aware after Phase B4
- outputs are filtered by `supportedModes`

But screenplay is still only present as one fiction-side output:

- `screenplay_beat_sheet`

That means the current product still lacks:

- a `screenplay` project mode
- screenplay project creation
- screenplay-native drafting prompts
- screenplay-native scene labels
- screenplay-native memory/planning semantics
- screenplay export behavior

So the architecture is ready, but screenplay is not yet a first-class mode pack.

---

## Chosen Approach

Add **one `screenplay` mode** with a **project-level drafting preference** stored in `modeConfig`.

The writer chooses between:

- `script_pages`
- `beat_draft`

That preference becomes durable project state and influences:

- first-scene generation
- continuation prompts
- default writing guidance
- default output emphasis
- export defaults

The alternate representation still remains available through outputs/export.

### Why this approach

This is the cleanest architecture fit because:

- it keeps screenplay as one coherent mode pack
- it avoids splitting users across two nearly identical screenplay modes
- it uses the existing `modeConfig` boundary correctly
- it preserves one screenplay memory/planning system instead of duplicating schemas

### Explicit rule

Changing the screenplay drafting preference later changes **future generation behavior** and **export defaults**, but it does **not** auto-convert existing scenes.

That keeps the system predictable and avoids destructive or lossy rewrites.

---

## Product Shape

### Content unit

For screenplay mode, the content unit is:

- `scene`

So shared surfaces should naturally read as:

- Scene 1
- Continue Scene
- current scene
- scene summary

This keeps screenplay aligned with the existing shared-editor architecture instead of requiring a new editor shell.

### Canonical editor text

The main editor remains the canonical project draft surface.

For screenplay mode:

- if preference is `script_pages`, the canonical draft should use **Fountain-compatible screenplay text**
- if preference is `beat_draft`, the canonical draft should use **scene-beat draft text**

This means the editor supports both screenplay drafting styles inside one mode without hiding the writer's chosen default.

### Screenplay writing styles

#### `script_pages`

The writer drafts:

- slug lines
- action lines
- dialogue
- transitions only when useful

The text should be Fountain-compatible enough to export directly to `.fountain`.

#### `beat_draft`

The writer drafts:

- scene objective
- visual dramatic movement
- turn/reveal
- scene-end propulsion

This is still scene-based and screenplay-aware, but intentionally lighter than full formatted script pages.

---

## Screenplay Mode Config

Add a new `ScreenplayModeConfig` with a deliberately narrow first-pass shape.

Recommended fields:

- `draftingPreference: "script_pages" | "beat_draft"`
- `formatStyle: "fountain"`
- `storyEngine?: "feature" | "pilot" | "short"`

Optional later fields such as act structure presets or page targets should wait unless the first implementation clearly needs them.

### Design principle

Store only durable, generation-relevant screenplay setup.

Do not turn `modeConfig` into a large screenplay questionnaire in v1.

---

## Screenplay Memory Semantics

Screenplay mode should use the shared Memory engine with screenplay-native defaults.

Recommended core types:

- `character`
- `location`
- `prop`
- `faction`
- `setpiece`
- `theme`

These give the writer useful screenplay truth without requiring a brand-new memory subsystem.

### Interpretation

- `character`: recurring people on screen
- `location`: recurring settings / locations
- `prop`: important objects that affect blocking, payoff, or continuity
- `faction`: institutions, groups, crews, agencies, families
- `setpiece`: large recurring action or dramatic event anchors
- `theme`: durable thematic pressure or motif

This is intentionally practical rather than theoretical. The goal is to improve drafting continuity and adaptation quality.

---

## Screenplay Planning Semantics

Screenplay mode should use the existing planning surfaces introduced earlier:

- `outline`
- `notes`

using screenplay-specific interpretation supplied by the mode pack.

### Outline meaning

`outline` represents a **scene-by-scene plan**.

Each unit remains stored in the existing shared outline structure, but screenplay config interprets it as:

- scene title / identifier
- scene summary
- dramatic intent
- turn / reveal
- open setup-payoff threads

### Notes meaning

`notes` represents screenplay-native planning guidance such as:

- act pressure
- character arc pressure
- unresolved setup/payoff obligations
- visual motifs
- thematic throughlines

### Planning unit label

Recommended:

- `planningUnitLabel: "beat"`

This keeps the internal planning language useful across both screenplay drafting preferences.

The visible editor/content-unit language should still be `scene`.

---

## Prompt Behavior

### First scene generation

Screenplay mode needs its own chapter-1 equivalent prompt builder.

It should:

- generate a project title if needed
- honor the screenplay drafting preference
- write Scene 1, not Chapter 1 or Issue 1
- use screenplay-aware instructions rather than fiction prose instructions

#### If preference is `script_pages`

The prompt should produce:

- Fountain-compatible screenplay scene text
- immediate dramatic action
- concise visual writing
- dialogue where appropriate

#### If preference is `beat_draft`

The prompt should produce:

- a scene-beat draft
- strong visual and dramatic movement
- clear turn or reveal
- enough structure to later convert into script pages

### Continuation

Continuation prompts should read screenplay mode config and write the next scene in the same default style.

The shared prompt assembly should still include:

- memory context
- planning context
- manuscript history

but screenplay-specific copy should replace fiction/newsletter phrasing throughout.

---

## Outputs

This pass should make screenplay outputs real mode-native tools, not fiction leftovers.

### Required outputs

- `screenplay_beat_sheet`
- `screenplay_scene_pages`

### Behavior

If the canonical project preference is `script_pages`:

- `screenplay_scene_pages` is the "stay in pages" support output
- `screenplay_beat_sheet` gives the writer a lighter structural artifact

If the canonical project preference is `beat_draft`:

- `screenplay_scene_pages` becomes the main conversion output
- `screenplay_beat_sheet` can still provide a cleaner structural version if needed

### Naming choice

Use `screenplay_scene_pages` rather than a generic "full script" output name.

Why:

- it matches the current chapter/scene-scoped output model
- it avoids implying whole-project screenplay generation in one click
- it is easier to scale later into project-level exports

---

## Export

This pass should add screenplay-aware export defaults without adding a large rendering subsystem.

### Required export behavior

- screenplay projects with `script_pages` preference should export to `.fountain`
- screenplay projects with `beat_draft` preference should still export cleanly, likely as `.txt`
- plain text export remains available as fallback

### Why Fountain

Fountain gives the product a real screenplay-friendly export target while keeping implementation lightweight.

It avoids the complexity of:

- PDF pagination/rendering
- Final Draft / FDX support
- page-layout UI

### Scope limit

This pass does **not** need:

- PDF screenplay export
- FDX export
- print-preview screenplay pages

Those belong in a later publishing/export phase.

---

## Create Project Flow

The create-project screen should add a third mode:

- `Screenplay`

The screenplay setup should mirror the product's simplification rules:

- keep the initial setup minimal
- ask only for durable, high-value setup
- keep the rest behind "More options" if needed

### Recommended first-pass fields

- Title
- Drafting preference
- Tone

Optional advanced:

- story engine (`feature`, `pilot`, `short`)

This should feel closer to newsletter setup than fiction fandom setup.

---

## Editor and Shell Behavior

The existing editor shell should stay intact.

### Shared shell expectations

- screenplay keeps Memory visible by default
- screenplay keeps Project and Outputs tabs in the same places
- screenplay uses scene-specific labels across shared helpers

Examples:

- `Scene 3`
- `Continue Scene`
- `Writing the next scene...`
- `Scene summary`

### Important boundary

This pass should **not** introduce:

- a separate screenplay editor shell
- screenplay page-preview chrome
- drag-and-drop scene board

The point is to prove the mode-pack system scales, not to fork the product UI.

---

## Architecture

This should be implemented as a standard mode-pack extension.

### Core type additions

- add `screenplay` to `ProjectMode`
- add `ScreenplayModeConfig` to `StoryModeConfig`
- add `ScreenplayStoryFormData` to `StoryFormData`

### Mode pack

Create:

- `src/app/lib/modes/screenplay.ts`

This mode pack should own:

- screenplay memory defaults
- screenplay planning semantics
- screenplay context preamble
- screenplay memory/suggestion prompts
- screenplay planning prompt behavior

### Shared integrations

Likely integration points:

- `src/app/components/CreateStoryTab.tsx`
- `src/app/lib/projectMode.ts`
- `src/app/lib/prompts/index.ts`
- `src/app/lib/prompts/adaptation.ts`
- `src/app/lib/adaptations.ts`
- `src/app/lib/storage.ts`
- `src/app/components/editor/*`
- `src/app/types/story.ts`
- `src/app/types/adaptation.ts`

The implementation should prefer extending shared helpers over creating screenplay-only forks.

---

## Outputs and Export Data Flow

Recommended flow:

```text
Screenplay project
  -> modeConfig.draftingPreference
  -> screenplay prompt builders
  -> canonical scene draft in editor
  -> screenplay outputs (beat sheet / scene pages)
  -> mode-aware export formatter
  -> .fountain or .txt download
```

This keeps the writer's chosen drafting preference at the center of the screenplay workflow.

---

## Testing Strategy

This should be implemented and validated in focused slices.

Recommended coverage:

1. screenplay mode config
   - registry returns screenplay mode
   - screenplay labels/types/planning config resolve correctly

2. screenplay prompt builders
   - first-scene prompt differs by drafting preference
   - continuation prompt differs by drafting preference
   - scene-specific wording appears instead of chapter/issue wording

3. outputs
   - screenplay output enablement/filtering works
   - screenplay output ordering/defaults are correct
   - screenplay-specific adaptation prompt formatting works

4. export
   - screenplay export filename/format behavior matches drafting preference
   - Fountain export remains text-safe and predictable

Then run:

- focused Node tests for pure helpers
- `npx tsc --noEmit`
- `npm run lint`

---

## Non-goals

This pass does not include:

- WYSIWYG screenplay page layout editing
- PDF screenplay export
- FDX / Final Draft export
- drag-and-drop corkboard or scene board UI
- screenplay-specific collaboration tools
- automatic conversion of all existing scenes when drafting preference changes
- a full screenplay production workflow beyond drafting, outputs, and lightweight export

---

## Why this slice

This is the right first Phase C move because it proves the engine generalizes in a meaningful way:

- the project gains a third real mode pack
- the shared memory/planning/output architecture gets exercised outside fiction/newsletter
- the writer gets a real screenplay workflow, not just a novelty adaptation button
- the product can support two screenplay drafting styles without fragmenting into multiple modes

In short: this pass makes screenplay a genuine Writing OS citizen while staying within the current architecture and product simplification rules.
