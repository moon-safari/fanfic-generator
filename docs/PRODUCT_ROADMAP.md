# Product Roadmap: Writing OS

> The OS for Writing — Sudowrite's AI quality meets Novelcrafter's project depth, across every kind of writing.

## Product Thesis

We are building the operating system for writers.

Not a chatbot. Not a one-shot generator. A workspace with living project memory that helps writers:

1. **Write** — draft, rewrite, expand, and brainstorm with AI that knows the project
2. **Remember** — keep characters, facts, lore, plans, and constraints in structured project memory
3. **Review** — inspect what the system knows, catch continuity drift, accept or reject proposed changes
4. **Adapt** — turn one project into many outputs (recaps, teasers, beat sheets, newsletters, pitches)
5. **Publish** — export, package, and distribute from the same workspace

## Target Modes

The platform serves every kind of long-form writing through mode packs:

| Mode | Status |
|------|--------|
| Fiction (novels, short stories, serialized, fanfic) | Live — primary wedge |
| Newsletters / serialized creator work | v1 live |
| Screenplays | Planned |
| Comics / graphic narrative | Planned |
| Game writing / narrative design | Planned |
| Non-fiction / articles / essays | Planned |

Each mode defines its own knowledge schema, planning schema, output schema, review schema, and creator workflow — all built on the same shared engine.

## Competitive Position

- **Sudowrite**: Best AI prose, weak world-building and project memory
- **Novelcrafter**: Best project organization, but BYOK and no built-in AI
- **Writing OS**: Strong AI + structured project memory + easiest onboarding + multi-mode support

## Current Wedge

Fiction remains the deepest mode. Newsletter is the first adjacent mode proving the engine generalizes. Both share the same infrastructure (stories table, project modes, Codex memory, adaptation outputs).

Newsletter mode is now live in an initial mode-pack form:

- newsletter-specific project creation
- issue-aware generation and continuation
- issue-aware adaptation and artifact handling
- shared newsletter memory and review language while Codex remains fiction-first
- publication profile editing for subtitle, hook style, CTA style, and recurring sections
- saved issue-package outputs for subject lines, deck options, recurring section drafts, hook variants, CTA variants, and send-checklist review
- issue bundle export for current newsletters using saved package assets plus the issue body
- deterministic issue-readiness checks inside `Artifacts`, with action links to missing package outputs
- a tighter pre-send view that foregrounds blockers, next-step actions, and bundle readiness without drowning creators in already-passed checks
- the newsletter `Issue Package` workflow now shows saved vs missing outputs and can generate only the missing package pieces
- the same workflow now highlights the next missing piece and gives a cleaner package-complete handoff into send-checklist review
- generated issue-package outputs can now become canonical issue state through official subject line, deck, hook, CTA, and recurring section package selections
- a seeded newsletter showcase for creator-workflow testing

## Platform Principles

### 1. Project truth matters more than prompt tricks

Codex, context, and continuity should become shared infrastructure across the product.

### 1a. AI-native beats AI-decorated

We should prefer features where model output becomes durable project state.

Good signs:

- the workflow depends on AI
- project memory improves future work
- better base models materially improve the product
- user behavior changes because the system is more than a normal editor

Bad signs:

- AI is just a sparkle button
- output is disposable
- users can ignore the AI and get almost the same product
- the feature does not compound across sessions

### 2. Writers must be able to inspect and steer the system

The product should expose:

- what it knows
- what changed
- what it is using
- why it is using it

This does not mean every internal mechanism should be visible by default.
Progressive disclosure matters.

### 3. One project should power many outputs

Adaptation is not a side feature.
It is part of the platform strategy.

### 4. Security and ownership are core platform concerns

- authenticated project access
- RLS-backed ownership in Supabase
- server-side AI calls only
- safe rollout patterns with backward-compatible migrations

## Phase 1: Writing Studio Core

### Status

Mostly implemented.

### Includes

- rich editor
- craft tools
- streaming generation
- chapter summaries
- continuity checks
- Codex foundation
- updates and suggestion review
- context console
- first adaptation workflows

### Why it matters

This phase replaces "generate and read" with a real writing environment.

## Phase 2: Project Memory And Review Depth

### In progress direction

- stronger Codex navigation
- mentions and manuscript linking
- living change detection
- accepted-update feedback loop
- context steering
- explainable context
- better update review

### Next depth opportunities

- artifact library
- planning and outline layer
- continuity copilot v2
- research ingestion
- series/shared Codex

## Phase 3: Mode Expansion

We should expand by mode packs, not random features.

### Near-term mode packs

1. Fiction Mode
2. Newsletter Creator Mode
3. Screenplay Mode
4. Comics / Graphic Narrative Mode
5. Game Writing / Narrative Design Mode

### Each mode should define

- knowledge schema
- planning schema
- output schema
- review schema
- creator workflow shape

## Phase 4: Adaptation Studio

Turn one project into many outputs.

### Early outputs

- short summary
- newsletter recap
- screenplay beat sheet
- public teaser

### Future outputs

- character dossier
- episode summary
- pitch sheet
- social package
- publishing blurbs

### Goal

Adaptation outputs should become first-class project artifacts, not disposable generations.

## Phase 5: Publishing And Distribution

### Future areas

- public project pages
- exports
- shareable artifacts
- collaborative review
- distribution surfaces

This phase should only come after the core memory/review loop is strong enough.

## AI-Native Standard

The repo now treats `AI-native` as a product standard, not a marketing phrase.

Reference:

- `docs/superpowers/specs/2026-03-31-ai-native-product-principles.md`
- `docs/superpowers/specs/2026-04-02-writing-os-value-audit.md`

## Value Bar

We should stop shipping features that are merely plausible.

Every near-term change should clearly do at least one of these:

- make writing materially faster
- make project truth clearer or safer
- make later outputs better because saved state is reused
- remove a meaningful context switch or chunk of confusion
- complete a core workflow end to end

If a change does none of those clearly, it should not be prioritized.

## Immediate Build Order

1. Landing page and positioning refresh
2. Artifact library
3. Newsletter / serialized creator mode
4. Planning and outline layer
5. Continuity Copilot v2

Current status:

1. Landing page and positioning refresh - done
2. Artifact library - done
3. Newsletter / serialized creator mode - v1 live
4. Planning and outline layer - partially live through structured outline artifacts plus arc/thread tracking
5. Continuity Copilot v2 - started through planning-aware continuity, annotation metadata, and one-click planning actions

Immediate next depth:

- browser-led review of the default fiction flow
- browser-led review of the default newsletter flow
- fix only concrete high-friction issues that show up in those flows
- give story tools / side-panel surfaces more usable space
- continue planning-aware generation and adaptation only where it strengthens flagship workflows

Next mode-pack clarification:

- `newsletter-native memory/review` is product-depth work
- `newsletter creator mode` is the broader workflow layer on top of that depth
- after newsletter, the next serious mode-pack candidates are:
  - screenplay
  - comics / graphic narrative
  - game writing / narrative design

Current newsletter depth update:

- newsletter projects now resolve dedicated newsletter memory for prompts
- `Artifacts` exposes a visible newsletter-memory panel
- continuity can now flag promise drift and voice drift against synopsis/style guide
- continuity can now flag hook drift, CTA drift, and recurring segment drift inside the same planning-aware review loop
- newsletter creator workflow now includes a saved `Issue Package` workflow for subject lines, deck options, recurring section drafts, hook variants, CTA variants, and send-checklist review
- `Artifacts` now supports current-issue markdown bundle export for newsletter projects
- canonical issue-package selections now feed readiness and bundle export, turning generated options into durable issue state
- newsletter issue readiness now also checks whether the current issue body still honors the official framing, hook, CTA, and recurring section package
- the readiness surface is now being simplified into a clearer `pre-send check` instead of accumulating more dashboard-like subfeatures

Likely next newsletter move:

- stop widening for a moment and simplify the newsletter flow around a small, legible loop:
  - write issue
  - choose official package
  - run pre-send check
  - export/send

Likely next cross-product move:

- run a simplification reset across newsletter and Codex
- keep default workflow simple
- move expert controls behind `Advanced`

Current simplification progress:

- the side panel now defaults to the core workflow tabs, with lower-frequency tools moved behind `Advanced`
- the default workspace language is shifting toward plain English: `Memory`, `Project`, and `Outputs`
- Codex now keeps type management, mention syncing, and context visibility out of the default layer
- Codex type filters are now optional instead of always visible
- Memory now leads with a compact `facts / mentions / to review` summary instead of a busier control-heavy header
- Memory review now keeps older handled suggestions collapsed behind a simple recent-activity toggle
- newsletter setup is now tucked behind a setup drawer so pre-send work stays front and center
- Project now keeps secondary type/scope filters behind a `More filters` drawer instead of front-loading them
- Memory detail screens now default to the main fact first, with mention trails and deeper relationship/progression tools behind revealers
- Project detail screens now foreground the saved content, with metadata and lower-priority newsletter setup behind secondary toggles
- Memory fact cards now keep aliases, linked facts, and change chips behind a secondary `More fact details` reveal instead of dumping them immediately
- Project item screens now lead with one primary action and move copy / reopen / delete into a secondary `More actions` layer
- Memory and Project list views now use quieter summary lines instead of stacked badge columns, so items read more like documents and facts than mini dashboards
- Memory now uses a single quiet summary line in the header instead of a row of status chips, and saved newsletter setup now defaults to a compact summary before showing deeper context
- the newsletter pre-send card now favors one obvious export action first, with secondary export behavior hidden until asked for
- Outputs now favors one obvious workflow action first, with per-output workflow controls and official package management hidden behind explicit reveals
- side-panel note counts are now plain text instead of another bright badge in the shell
- the editor toolbar now uses one `Writing tools` entry point instead of exposing a row of craft actions all the time
- home, create, and library are now moving toward the same rule: default to `start new` or `open saved`, keep lower-priority setup behind `More options`, and tuck sample projects behind a reveal
- visible action language is now being standardized too: prefer one plain primary action like `Use in editor`, and avoid bouncing between internal verbs like `insert`, `re-insert`, or `prompt view`
- the last shell cleanup is now reducing redundant signals too: subtler note indicators, calmer footer CTA styling, less duplicate metadata, and less chrome around the active side-panel view
- onboarding and shell microcopy are now being simplified too: home, login, create, and editor confirmations should prefer plain, mode-neutral wording over internal system language

AI-native newsletter conclusion:

- the strongest compounding newsletter surfaces are memory, planning-aware writing, review, and readiness
- generated package options can now become canonical issue state, which is the most important AI-native newsletter move so far
- readiness now reasons about whether the issue still matches that canonical package
- the next serious newsletter depth step should keep building on canonical state rather than adding more disconnected output types

Current depth update:

- continuation now sees planning guidance for the next unit
- adaptation now sees planning guidance for the current unit
- planning is starting to shape writing before drift happens, not only review it afterward

## What Success Looks Like

The product should increasingly feel like:

- a serious writing workspace
- a memory system for long-form projects
- a review surface for truth and continuity
- an adaptation studio for multi-format writing

Not:

- a generic AI text box
- a fanfic-only niche tool
- a loose collection of disconnected assistants
