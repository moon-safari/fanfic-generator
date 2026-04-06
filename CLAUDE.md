# Writing OS

## What this is

The OS for Writing.

A cross between Sudowrite (AI prose quality) and Novelcrafter (structured project memory), but built to work across every kind of writing — not just fiction.

### Supported modes (current and planned)

- Fiction (novels, short stories, serialized fiction, fanfic)
- Newsletters / serialized creator workflows
- Screenplays
- Comics / graphic narrative
- Game writing / narrative design
- Non-fiction / articles / essays
- Any long-form creative or professional writing

### What makes this different

1. **Living project memory** — not a blank prompt box. The system remembers characters, facts, lore, plans, and constraints across sessions.
2. **AI-native workflows** — model output becomes durable project state that improves future work, not disposable text.
3. **One project, many outputs** — the same underlying truth powers drafts, recaps, teasers, beat sheets, newsletters, and adaptations.
4. **Mode packs, not feature sprawl** — each writing type gets its own schema, planning, and review layer built on shared infrastructure.
5. **Writer stays in control** — inspect what the system knows, review proposed changes, decide what becomes canonical.

## Core product rules

### 1. Project truth is sacred

Memory, continuity, and chapter-aware context should beat clever but inconsistent generation.

### 2. The writer must stay in control

Writers should be able to:

- inspect project truth
- review proposed changes
- control active context
- decide what becomes canonical

This should be achieved with progressive disclosure, not by showing every system layer at once.

### 3. Continuity beats novelty

Long-form writing only works if the project stays coherent as it grows.

### 4. One project should power many outputs

Drafting, recap, teaser, beat sheet, and future adaptations should come from the same underlying truth.

### 4a. AI-native beats AI-decorated

Prefer features where model output becomes reusable project state.

Good signs:

- future work gets smarter because the feature ran
- the workflow is materially better with model reasoning in the loop
- better base models will clearly improve the product

Warning signs:

- isolated sparkle-button AI
- disposable outputs that do not feed back into the system
- optional AI that users can ignore without changing behavior

### 5. Mode-agnostic core, mode-specific surfaces

The engine (memory, context, continuity, adaptation) should be writing-mode-agnostic. Each mode pack (fiction, newsletter, screenplay, etc.) layers its own schema, planning, review, and workflow on top of shared infrastructure.

### 6. Never expose secrets client-side

All model calls and privileged operations must stay server-side.

### 7. Ownership and access control matter

Assume every project surface should respect authenticated ownership and Supabase RLS.

### 8. Mobile and narrow widths still matter

Every component must work at 375px minimum.

### 9. Loading states are part of the product

Longer-running operations should feel intentional and alive, not broken or empty.

## Tech stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase auth + database
- Anthropic Claude for generation and tools
- Lucide React for icons

## Key product areas

```text
src/app/
  api/                           - server routes
  components/memory/             - project memory UI
  lib/modes/                     - ModeConfig registry (fiction, newsletter, etc.)
  components/editor/             - manuscript + side panel UI
  lib/prompts/                   - prompt builders
  lib/supabase/                  - data access helpers
  types/                         - shared domain types
supabase/migrations/             - source of truth for schema evolution
docs/                            - product, strategy, and build specs
```

## Strategic focus

### What's shipped

1. Landing page and positioning
2. Artifact library
3. Newsletter creator mode v1 (publication profiles, issue packaging, canonical state, preflight, bundle export)
4. Structured planning layer (outlines, arc/thread tracking)
5. Continuity copilot v1 (planning-aware drift checks, annotation metadata, one-click actions)
6. Streaming generation with progressive Tiptap insertion
7. Craft tools (brainstorm, rewrite, expand, describe) with side panel
8. Mobile polish (safe areas, touch targets, bottom sheets)
9. Mega-component decomposition (StoryEditor 1058→751 lines, ArtifactsTab 2646→1623 lines)
10. Fiction flow friction fixes (streaming recovery, chapter nav guard, continuity toast, autosave feedback, craft breadcrumb)
11. Codex → Memory rename + mode-agnostic memory engine (ModeConfig registry)

12. Phase A simplification & polish (progressive disclosure, mode-aware microcopy, empty states, 375px narrow-width pass)

### What's next

Detailed roadmap: `docs/superpowers/specs/2026-04-05-writing-os-next-steps-roadmap.md`

**Phase A: Simplification & Polish** (completed 2026-04-06)
1. Progressive disclosure audit — default to Write → Remember → Review → Package → Export; everything else behind Advanced
2. Microcopy & naming cleanup — finish plain-language rename (Artifacts → Project, Adapt → Outputs in code paths), thread `contentUnitLabel` to remaining ContextConsole helpers
3. Empty states & first-run experience — meaningful empty states, guided first chapter, mode-appropriate defaults
4. Mobile & narrow-width pass — verify 375px, touch targets, side panel overflow

**Phase B: Planning-Aware Generation** (immediate priority)
1. Planning context in continuation — inject outline beats, arc guidance, thread notes into generation prompts
2. Planning context in continuity review — check drift against plan, not just prior chapters
3. Planning-to-memory bridge — auto-suggest memory updates when planned beats are written
4. Mode-aware planning schemas — extend ModeConfig with planning unit labels and schemas

**Phase C: Mode Pack Expansion** (breadth)
1. Screenplay mode — scenes, beat sheets, act structure, formatted output
2. Comics / graphic narrative mode — pages/panels, visual pacing, script format
3. Game writing / narrative design mode — quests, branching, dialogue trees
4. Non-fiction / articles / essays mode — sections, arguments, sources, bibliography

**Phase D: Adaptation Studio & Publishing** (platform)
1. Cross-mode adaptation chains — chapter → screenplay scene → comic page
2. Export & distribution — PDF, DOCX, EPUB, Fountain, publishing pipeline
3. Collaborative review — shared access, roles, comment workflows (future)

### Simplification principles

- Rename internal concepts to plain language: ~~`Codex` -> `Memory`~~ (done), `Artifacts` -> `Project`, `Adapt` -> `Outputs`
- Default to one obvious primary action per view; secondary actions behind reveals
- Keep advanced controls (custom types, relationship editing, context rules) behind `Advanced`
- Use quiet metadata lines in lists instead of stacked badges
- Consistent action vocabulary across surfaces
- Plain, mode-neutral microcopy in onboarding and shell

### Newsletter mode rules

- Newsletter is a real creator mode, not fiction with "issues" instead of chapters
- Prefer promise/voice/follow-up drift language over fiction-shaped contradiction language
- The default loop is: write issue -> choose official package -> run pre-send check -> export/send
- Canonical issue-package state is durable project truth, not optional metadata
- Readiness checks should verify the issue body still honors the official package
- Prefer incremental completion of missing outputs over rerunning saved pieces
- Do not keep widening newsletter; simplify the creator flow first

### Future mode packs

Each mode pack defines its own knowledge schema, planning schema, output schema, review schema, and creator workflow. Planned:

- Screenplay
- Comics / graphic narrative
- Game writing / narrative design
- Non-fiction / articles / essays
- More as the core engine proves out

## Practical reminder

When in doubt, build toward:

- shared project memory
- explainable context
- reusable project artifacts
- backend-safe, ownership-aware workflows
- AI-native workflow dependence instead of decorative AI surface area

And do not ship work just because it seems reasonable.

Every near-term change should clearly do at least one of these:

- make writing materially faster
- make project truth clearer or safer
- make later outputs better because saved state is reused
- remove a meaningful context switch or chunk of confusion
- complete a core workflow end to end

If it does not clearly pass that bar, it should not be a priority right now.
