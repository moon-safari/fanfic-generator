# Comics Mode

**Date:** 2026-04-06
**Status:** Proposed
**Scope:** Phase C2 foundation pass

---

## Goal

Add **Comics / graphic narrative** as a real project mode, not just a future adaptation target.

This pass should let a writer:

- create a comics project
- write page-by-page comic scripts in the main editor
- use comics-native memory and planning semantics
- generate at least one comics-specific derived output
- export comic scripts in a usable structured text format

The product goal is to prove that the shared Writing OS engine can support a visually driven mode pack, not only prose and screenplay workflows.

---

## Current State

The current product now supports three real project modes:

- `fiction`
- `newsletter`
- `screenplay`

The shared architecture is in good shape for another mode pack:

- `ModeConfig` owns memory and planning semantics
- shared prompt-context assembly is mode-aware
- planning phrasing is mode-aware
- outputs are filtered by `supportedModes`
- export behavior can branch by mode and durable `modeConfig`

But comics mode does not exist yet as a first-class project workflow.

The roadmap already defines its intended shape:

- content unit: `page`
- core types: `character`, `location`, `visual_motif`, `panel_layout`, `narrative_device`
- planning: page layout planning, visual pacing, spread design
- outputs: script format plus comics-native supporting artifacts
- special considerations: panel count per page, visual storytelling conventions, lettering notes

So the architecture is ready, but the mode pack itself has not been built.

---

## Chosen Approach

Add **one `comics` mode** focused on **standard paged comics** first.

The canonical editor draft should use:

- `comic_script_pages`

meaning each content unit is a page-level comic script with explicit panel structure.

The first supporting output should be:

- `comic_page_beat_sheet`

which gives the writer a lighter pacing and reveal artifact derived from the page script.

### Why this approach

This is the right first slice because:

- it fits the current project-mode architecture cleanly
- it makes comics a real workspace instead of only an adaptation endpoint
- it keeps the first comics workflow coherent around page turns and spread rhythm
- it avoids diluting v1 with webtoon-specific pacing rules too early

### Explicit scope rule

This first pass targets **standard paged comics**, not vertical-scroll webtoons.

Webtoons remain an explicit planned follow-up and should be preserved in the roadmap, but they should not widen C2 v1 prompt, planning, and export behavior.

---

## Product Shape

### Content unit

For comics mode, the content unit is:

- `page`

Shared surfaces should naturally read as:

- Page 1
- Continue Page
- current page
- page summary

This keeps comics aligned with the current shared editor shell.

### Canonical editor text

The main editor remains the canonical project draft surface.

For comics mode, the canonical draft should be a **page-by-page comic script** rather than prose paragraphs or screenplay scenes.

Each page should be written in a structured text format that preserves:

- page heading
- numbered panels
- panel descriptions
- dialogue
- captions
- SFX
- lettering notes when relevant

The goal is not to create a rendering engine.
The goal is to make the editor hold usable comic-script text that is readable, exportable, and continuity-safe.

### Standard page conventions

The prompt and export shape should reinforce a stable page-script convention, for example:

- `PAGE 1`
- `Panel 1:`
- visual description first
- dialogue and captions clearly separated from description
- SFX and lettering notes called out explicitly when needed

This format should stay plain text and easy to inspect, not dependent on a bespoke visual editor.

---

## Comics Mode Config

Add a narrow first-pass `ComicsModeConfig`.

Recommended fields:

- `draftingPreference: "comic_script_pages"`
- `formatStyle: "comic_script"`
- `seriesEngine?: "issue" | "one_shot" | "graphic_novel"`

### Design principle

Store only durable setup that materially changes generation, planning, or export behavior.

Do not turn comics setup into a large publishing questionnaire in v1.

### Why `seriesEngine`

This gives the planner and generator a useful scope signal:

- `issue`: single-installment pressure, cliffhangers, page-economy discipline
- `one_shot`: self-contained arc pressure
- `graphic_novel`: longer-burn pacing and payoff horizons

That is enough value for v1 without introducing page targets, trim-size metadata, or print-production settings yet.

---

## Comics Memory Semantics

Comics mode should use the shared Memory engine with comics-native defaults.

Recommended core types:

- `character`
- `location`
- `visual_motif`
- `panel_layout`
- `narrative_device`

### Interpretation

- `character`: recurring people or creatures who appear on page
- `location`: recurring settings with visual identity and blocking implications
- `visual_motif`: recurring images, symbols, color-language cues, or visual callbacks
- `panel_layout`: reusable page-layout patterns, density patterns, or reveal structures
- `narrative_device`: captions, framing devices, flashback language, POV treatments, parallel-action devices

This keeps comics memory practical:

- what appears
- how it is framed
- what visual logic repeats

rather than forcing a separate art bible subsystem in v1.

### Suggestion rule

Memory suggestions should continue to treat planning as context, not truth.

If a page was supposed to introduce a motif or reveal but the script page did not actually establish it, the system should not suggest it as canonical memory yet.

---

## Comics Planning Semantics

Comics mode should use the existing shared planning surfaces:

- `outline`
- `notes`

with comics-specific interpretation supplied by the mode pack.

### Outline meaning

`outline` represents a **page-by-page plan**.

Each stored unit still uses the shared outline structure, but comics mode interprets it as:

- page title or identifier
- page summary
- dramatic or visual intent
- reveal or page-turn beat
- open loops meant to remain live after the page

### Notes meaning

`notes` represents comics-native planning pressure such as:

- pacing rhythm
- spread or reveal placement
- visual motif obligations
- density concerns
- narrator/caption logic
- active setup-payoff threads that must survive page transitions

### Planning unit label

Recommended:

- `planningUnitLabel: "page beat"`

The visible content-unit language should still be `page`.

### Planning prompt tone

Comics planning prompts should emphasize:

- visual pacing to honor
- reveal placement
- page-turn pressure
- spread logic when relevant
- what should stay open versus what should land on this page

That phrasing should feel comics-native rather than screenplay-like.

---

## Prompt Behavior

### First page generation

Comics mode needs its own first-unit prompt builder.

It should:

- write `Page 1`, not Chapter 1, Issue 1, or Scene 1
- honor comics mode config
- generate a page-level comic script, not prose
- open with a visual hook
- establish page pressure quickly
- end with propulsion into the next page or page turn

The prompt should explicitly ask for:

- numbered panels
- concise but evocative visual descriptions
- separated dialogue/caption/SFX treatment
- page-turn or reveal awareness

### Continuation

Continuation prompts should write the next page in the same comic-script format.

They should still use:

- memory context
- planning context
- manuscript history

but the instructions should become page-native:

- preserve who is present
- preserve visual motif continuity
- preserve layout/reveal logic when it matters
- keep lettering and dialogue load readable
- maintain momentum across page turns

### Formatting rule

The system should prefer a stable comic-script text pattern over model creativity about formatting.

Writers need output that is easy to scan, edit, and export.

---

## Outputs

This first pass should ship one comics-native derived output:

- `comic_page_beat_sheet`

### Purpose

This output gives the writer a lighter structural view of the current page's pacing and reveal logic.

It should help answer:

- what this page is trying to accomplish
- how the panels escalate or compress
- where the page-turn or reveal pressure sits

without replacing the full page script.

### Format

The beat sheet should stay compact and page-aware, for example:

- 4 to 8 numbered beats
- each beat focused on visual action, dramatic movement, and pacing consequence
- explicit mention of reveal placement or end-of-page pressure where appropriate

### Mode filtering

`comic_page_beat_sheet` should be available only for `comics` projects.

This keeps the output library mode-aware and avoids fiction/screenplay bleed.

---

## Export

Export in v1 should stay simple and useful.

### Required behavior

Comics projects should export as structured plain text.

Recommended default:

- `.txt`

with comic-script-friendly formatting preserved page by page.

### Why plain text first

This avoids introducing:

- PDF layout generation
- print-production assumptions
- a custom comic markup parser

before the base drafting workflow has proven itself.

The writer still gets a coherent handoff artifact they can inspect or move into later production workflows.

---

## Workflow And UI

### Project creation

Add `Comics` to the project creation mode selector.

The minimum v1 setup should stay light:

- title
- tone
- series engine

No advanced art-direction questionnaire should block project creation.

### Project setup panel

Comics mode should get its own setup panel in the Project/Artifacts surface, parallel to newsletter and screenplay.

For v1, it only needs to expose durable comics config:

- series engine
- fixed drafting format summary

The drafting preference itself can remain effectively fixed in v1 since this pass intentionally standardizes on `comic_script_pages`.

### Shared shell language

Shared labels should become comics-native where relevant:

- project mode label: `Comics`
- unit labels: `page` / `Page`
- continue label: `Continue Page`
- loading label: `Writing the next page...`

This is important because the shell language is part of the mode pack, not just the prompts.

---

## Persistence And Source Of Truth

This pass should include the source-of-truth schema updates needed for comics mode support.

### Stories table

The checked-in migration source currently still constrains `stories.project_mode` to:

- `fiction`
- `newsletter`

even though the app now supports more modes.

C2 should include a migration that updates the stored source of truth so `comics` is allowed, and ideally closes the existing gap by ensuring the migration chain matches the app's already-supported `screenplay` mode as well.

### Adaptation outputs

The checked-in adaptation-output source currently predates newer mode outputs.

If `comic_page_beat_sheet` is persisted through the existing adaptation-output pipeline, the migration source should be updated so the allowed `output_type` values include the comics output and remain aligned with the current app-level output set.

### Rule

Do not ship comics mode as app-only behavior while leaving the checked-in migration source behind again.

---

## Files Likely In Scope

### Types and mode parsing

- `src/app/types/story.ts`
- `src/app/lib/projectMode.ts`
- `src/app/lib/projectMode.test.ts`

### Mode config and planning semantics

- `src/app/lib/modes/comics.ts`
- `src/app/lib/modes/registry.ts`
- `src/app/lib/modes/planning.ts`
- `src/app/lib/planningContext.test.ts`

### Prompt builders

- `src/app/lib/prompts/index.ts`
- a new `src/app/lib/prompts/comics.ts`
- `src/app/lib/prompts/bible.ts`

### Outputs and export

- `src/app/types/adaptation.ts`
- `src/app/lib/adaptations.ts`
- `src/app/lib/adaptations.test.ts`
- `src/app/lib/prompts/adaptation.ts`
- `src/app/lib/storyExport.ts`
- `src/app/lib/storyExport.test.ts`

### UI

- `src/app/components/CreateStoryTab.tsx`
- `src/app/components/editor/ArtifactsTab.tsx`
- a new comics setup panel component
- any shared editor/viewer surfaces that render mode labels or export actions

### Persistence

- `supabase/migrations/...` for project-mode and adaptation-output source-of-truth updates

---

## Testing Strategy

This pass should lean on focused tests around pure helpers and mode wiring.

Recommended coverage:

1. mode parsing and labels
   - `comics` resolves correctly
   - page labels and continue/loading labels are comics-native
   - `ComicsModeConfig` parsing behaves correctly

2. mode registry and planning semantics
   - comics mode exposes the expected core types and planning copy
   - planning prompts use page-native phrasing

3. prompt generation
   - first-page prompts request comic-script formatting
   - continuation prompts preserve page-native formatting expectations

4. outputs
   - comics projects expose `comic_page_beat_sheet`
   - non-comics projects do not

5. export
   - comics export remains structured plain text with page formatting intact

Then run:

- focused Node tests for the changed helpers
- `npx tsc --noEmit`
- `npm run lint`

---

## Non-goals

This pass does not:

- add vertical-scroll webtoon support
- build a visual panel-layout editor
- generate printable page layouts or PDF composition
- add artist-facing design brief outputs yet
- add project-wide comic issue packaging
- redesign the editor shell around thumbnails or canvases
- introduce image-generation tooling

---

## Follow-Up: Vertical-Scroll Webtoons

Vertical-scroll webtoons should remain on the roadmap immediately after paged comics, but as a separate expansion.

That later pass should use a mode-config extension such as:

- `layoutProfile: "paged_comics" | "vertical_scroll"`

and a different planning vocabulary:

- reveal per screen rather than page turn
- rhythm by scroll segment
- stack height and spacing pressure
- vertical transition beats

The important thing in C2 is to avoid blocking that future direction while still shipping a coherent paged-comics mode now.

---

## Why This Slice

This is the right C2 pass because it expands the product into a genuinely visual storytelling workflow while staying disciplined:

- one real new mode
- one canonical draft format
- one derived output
- one simple export path

That is enough to prove the engine generalizes further without collapsing into half-finished publishing features.
