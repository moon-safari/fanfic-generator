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

Fiction remains the deepest mode. Newsletter is the first adjacent mode proving the engine generalizes. Both share the same infrastructure (stories table, project modes, Memory engine with ModeConfig registry, adaptation outputs).

Newsletter mode is now live in an initial mode-pack form:

- newsletter-specific project creation
- issue-aware generation and continuation
- issue-aware adaptation and artifact handling
- shared newsletter memory and review language (Memory is now mode-agnostic via ModeConfig registry)
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

Memory, context, and continuity should become shared infrastructure across the product.

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

## Phase 1: Writing Studio Core — Done

- Rich editor, craft tools, streaming generation, chapter summaries
- Continuity checks, Memory foundation, suggestion review, context console
- First adaptation workflows

## Phase 2: Project Memory And Review Depth — Done

- Memory navigation, mentions, manuscript linking, living change detection
- Accepted-update feedback loop, context steering, explainable context
- Artifact library, planning and outline layer, continuity copilot v1
- Mode-agnostic Memory engine (ModeConfig registry)

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

Previous build order (all done):

1. Landing page and positioning refresh — done
2. Artifact library — done
3. Newsletter / serialized creator mode — v1 live
4. Planning and outline layer — live (structured outlines, arc/thread tracking)
5. Continuity Copilot v2 — live (planning-aware, annotation metadata, one-click actions)
6. Codex → Memory rename + mode-agnostic engine — done (ModeConfig registry, 2026-04-05)

### Current next steps

See detailed roadmap: `docs/superpowers/specs/2026-04-05-writing-os-next-steps-roadmap.md`

**Phase A: Simplification & Polish** — progressive disclosure audit, microcopy cleanup, empty states, mobile pass
**Phase B: Planning-Aware Generation** — planning in continuation/continuity, planning-to-memory bridge, mode-aware planning schemas
**Phase C: Mode Pack Expansion** — screenplay, comics, game writing, non-fiction (in that order)
**Phase D: Adaptation Studio & Publishing** — cross-mode chains, multi-format export, collaborative review

### Simplification progress (completed)

- Side panel defaults to core workflow tabs; lower-frequency tools behind `Advanced`
- Default workspace language: `Memory`, `Project`, `Outputs`
- Memory keeps type management, mention syncing, and context visibility out of default layer
- Memory detail screens default to main fact first; mention trails and relationship/progression tools behind revealers
- Memory fact cards keep aliases, linked facts, and change chips behind `More fact details`
- Project keeps secondary filters behind `More filters` drawer
- Project items lead with one primary action; copy/reopen/delete in `More actions`
- Memory and Project lists use quiet summary lines instead of stacked badges
- Newsletter setup tucked behind setup drawer; pre-send work stays front and center
- Editor toolbar uses one `Writing tools` entry point
- Standardized action vocabulary: one plain primary action per view
- Subtler note indicators, calmer footer styling, less chrome

### Newsletter depth (completed)

- Dedicated newsletter memory for prompts
- Continuity flags promise/voice/hook/CTA/recurring-segment drift
- Saved Issue Package workflow (subject lines, deck options, hook variants, CTA variants, send-checklist)
- Canonical issue-package state feeds readiness and bundle export
- Readiness checks verify issue body honors official package
- Markdown bundle export for newsletter projects
- Default loop: write issue → choose official package → run pre-send check → export/send

### Planning depth (completed)

- Continuation sees planning guidance for next unit
- Adaptation sees planning guidance for current unit
- Planning shapes writing before drift happens, not only reviews it afterward

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
