# Codex Product Strategy

> Build a story intelligence system, not just a story bible.

## Goal

Turn the current Story Bible into a dynamic Codex that becomes the source of truth for writing, continuity, revision, AI generation, fandom knowledge, and future multimodal features.

This should begin at Novelcrafter-level Codex usefulness, but not stop there. The goal is not to clone a competitor. The goal is to build a more ambitious system that is:

- more relational
- more timeline-aware
- more embedded in the editor
- more useful for fanfic and canon-heavy writing
- more AI-native across drafting, revision, and review

---

## Reference Baseline

Reference product:
- https://www.novelcrafter.com/features
- https://www.novelcrafter.com/features/codex
- https://www.novelcrafter.com/help/docs/codex/the-codex
- https://www.novelcrafter.com/help/docs/codex/aliases
- https://www.novelcrafter.com/help/docs/codex/codex-relations
- https://www.novelcrafter.com/help/docs/codex/progressions-additions
- https://www.novelcrafter.com/help/docs/codex/codex-categories
- https://www.novelcrafter.com/help/docs/codex/series-codex

Novelcrafter establishes the baseline expectation that a modern Codex should include:

- entries for characters, locations, lore, objects, and other story entities
- thumbnails, tags, aliases, and rich metadata
- relationships between entries
- progressions over time
- automatic mention tracking in the manuscript
- custom categories and flexible organization
- shared entries across a series
- AI features that use Codex context as a source of truth

This baseline is important because it defines the minimum bar for "useful Codex" in the market.

---

## Product Thesis

The Codex should feel like a narrative operating system:

- Writers maintain story truth once.
- The editor, generation flows, craft tools, continuity engine, and future visual tools all consume that truth.
- The system helps writers detect change over time instead of treating story facts as static notes.
- The Codex lives inside the writing workflow, not in a separate admin panel users forget to update.

The current Story Bible is valuable, but it is limited because it is:

- section-based instead of entity-based
- mostly static instead of timeline-aware
- hard to reuse across multiple downstream features
- weak at representing relationships and evolving state

The new Codex solves those limitations by moving to a relational, chapter-aware knowledge model.

---

## Novelcrafter Parity

These capabilities should be treated as baseline parity requirements, not differentiators:

### 1. Structured entries

- Characters, locations, lore, objects, factions, events
- Rich text description
- Tags
- Optional thumbnails
- Per-entry colors
- Aliases and nicknames
- Custom fields

### 2. Relationships

- Link entries to each other with labeled edges
- Show both directions clearly
- Support common patterns like family, allegiance, residence, ownership, affiliation

### 3. Progressions

- Track how an entry changes over time
- Resolve what is true at Chapter N
- Show previous states clearly in UI

### 4. Flexible organization

- Custom categories
- Filtering and search
- Multiple views across the same entries
- Series/shared scope later

### 5. Mention tracking

- Detect entry mentions in manuscript text
- Support aliases, nicknames, alternate spellings
- Show where an entry appears
- Jump from prose to Codex entry and back

### 6. AI context integration

- Use Codex as context for generation and editing
- Allow only relevant context to be sent
- Make context selection understandable and controllable

---

## Our Differentiators

These are the parts that should make this product feel new rather than derivative.

### 1. Chapter-resolved truth engine

Novelcrafter has progressions. Our system should make progression resolution a first-class engine.

Meaning:
- every generation, continuity check, and review action can ask "what is true at this chapter?"
- changes are not just notes, they are queryable state
- prompt injection uses resolved truth rather than raw entry text

This is the architectural core that enables everything else.

### 2. Fandom and canon-aware Codex

Fanfic has a harder problem than original fiction:
- canon facts exist before Chapter 1
- characters often have multiple names, titles, eras, and relationship states
- users care deeply about consistency with source material and intentional divergence from canon

Our Codex should support:
- canon seed data
- canon vs story-divergent facts
- alternate universe tagging
- source references for fandom facts
- easier alias and identity management

This can become a major product moat.

### 3. AI-assisted extraction and upkeep

The Codex should not depend entirely on manual data entry.

The system should progressively help with:
- generate initial Codex from Chapter 1
- detect new entities after each chapter
- suggest progression updates when a character changes
- suggest relationship changes
- flag stale entries that no longer match the manuscript

The key principle: AI suggests, writer confirms.

### 4. Continuity copilot, not just storage

The Codex should not only store facts. It should actively help maintain story coherence.

Examples:
- contradiction detection against resolved chapter truth
- missing setup detection
- unresolved thread reminders
- voice drift warnings
- timeline inconsistencies
- relationship change warnings

This turns the Codex into a review engine, not just a wiki.

### 5. Narrative intelligence views

Go beyond list/detail CRUD.

Potential views:
- relationship graph
- mention timeline
- character appearance heatmap
- subplot tracker
- unresolved promises / setup-payoff tracker
- arc change timeline

These views create writer insight, not just storage.

### 6. Codex-powered multimodal pipeline

The Codex should later power:
- scene illustration prompts
- character portrait prompts
- cover-art generation context
- audio narration metadata
- public story pages and character pages

That means the Codex is not a side feature. It is future infrastructure.

### 7. Transparent context budgeting

Most AI writing tools hide what context was used.

We should eventually expose:
- which Codex entries were included
- why they were included
- how much context budget they consumed
- what was excluded

This builds trust and gives advanced users control.

---

## Product Principles

To keep the Codex coherent as it grows, use these principles:

### Embedded, not detached

The Codex must remain close to the manuscript experience. Users should move between prose and structured knowledge in one or two clicks.

### Structured first, prose-friendly second

Support rich text, but prefer fields, relations, tags, and progressions wherever structure improves downstream usefulness.

### Suggestion over automation

Auto-detection should assist, not silently mutate the source of truth.

### Chapter-aware by default

If a fact can change over time, the system should have a way to represent that change.

### Genre-flexible, fanfic-excellent

The model should work for original fiction, non-fiction, screenplay, and game writing, but fanfic and canon-heavy writing should feel unusually well served.

### Build the engine once, reuse everywhere

Every future AI or review tool should consume the same Codex truth model rather than inventing its own ad hoc context format.

---

## Recommended Phases

### Phase 1: Codex Foundation

Goal: replace the flat Bible with a usable Codex panel and data model.

Includes:
- Codex tables, RLS, indexes
- entry CRUD
- relationship CRUD
- progression CRUD
- custom types
- simple list/detail panel
- Chapter 1 auto-generation
- `formatCodexForPrompt`
- `continue-chapter` uses Codex instead of Bible

Success criteria:
- users can maintain story truth as entries instead of seven fixed sections
- generation uses resolved Codex context
- Story Bible is no longer the primary writing context system

### Phase 2: Tracking and Mentions

Goal: make the Codex feel alive inside the editor.

Includes:
- aliases
- mention detection in editor text
- entry highlighting / hover cards
- mention history per entry
- jump from mention to entry
- jump from entry to relevant chapter mentions

Success criteria:
- the Codex becomes part of drafting, not just prep work
- users can inspect where characters, places, and lore appear in the manuscript

### Phase 3: AI Upkeep and Continuity

Goal: make the Codex self-maintaining and continuity-aware.

Includes:
- post-chapter extraction suggestions
- progression update suggestions
- relationship change suggestions
- contradiction checks against resolved chapter truth
- stale entry warnings
- manual review queue for AI suggestions

Success criteria:
- users feel the system helps them maintain consistency
- continuity becomes an active assistant workflow

### Phase 4: Advanced Story Intelligence

Goal: make the Codex analytically powerful.

Includes:
- relationship graph
- appearance heatmap
- mention timeline
- subplot and arc tracking
- unresolved thread / setup-payoff tracking

Success criteria:
- the product offers insight general-purpose tools do not
- users can see story structure, not just read it

### Phase 5: Fandom, Series, and Shared Universes

Goal: support the hardest and stickiest long-form writing workflows.

Includes:
- series-level shared Codex
- fandom seeding
- canon source references
- canon vs divergence state
- shared universe support
- imported reference packs

Success criteria:
- fanfic and series writers get a genuine advantage over generic writing software

### Phase 6: Multimodal and Publishing Surface

Goal: let the Codex power more than text generation.

Includes:
- character portrait prompts from Codex
- scene illustration prompts from Codex
- cover art prompt grounding
- public-facing character/location pages
- export packages with Codex assets

Success criteria:
- the Codex becomes foundational product infrastructure across writing and presentation

---

## Current Repo Implications

The repo is ready to start Phase 1, but not beyond it yet.

Already in place:
- rich editor
- craft tools
- streaming generation
- chapter summaries
- continuity annotations
- Story Bible panel

Still Bible-dependent today:
- `continue-chapter` prompt context
- craft tool shared context
- story bible generation trigger after Chapter 1
- data model and API assumptions in the side panel

So the immediate next move is not mention tracking or graphs. It is building the Codex foundation cleanly enough that every later feature can attach to it.

---

## Immediate Build Order

1. Add Codex migration and types.
2. Build Supabase helpers and prompt formatter.
3. Implement Codex CRUD API routes.
4. Replace the Bible tab with a functional Codex panel.
5. Swap generation and continuation flows to Codex context.
6. Add Chapter 1 Codex generation.
7. Only then start mentions, aliases, and tracking.

---

## Non-Goals For First Release

To keep scope sane, Phase 1 should not include:

- relationship graph visualization
- automatic mention tracking
- fandom pre-seeding
- series Codex
- collaboration
- public Codex pages
- visual asset generation from Codex
- auto-applying AI suggestions without user confirmation

---

## One-Line Positioning

Codex is the living source of truth for story worlds, character arcs, canon knowledge, and AI-assisted writing.

It should start as a better Story Bible and evolve into the intelligence layer that powers the entire product.
