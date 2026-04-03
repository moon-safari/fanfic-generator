# Narrative OS Mode Strategy

> One engine, multiple creative modes, deliberate expansion.

Use this together with:

- `docs/superpowers/specs/2026-03-27-narrative-os-product-thesis.md`
- `docs/superpowers/specs/2026-03-27-codex-product-strategy.md`

---

## Goal

Define how the product expands from a fiction-first writing system into a broader narrative operating system without collapsing into a generic "AI for everything" tool.

This doc turns the target use cases into a strategy:

- which modes belong in the product
- which modes come first
- what they share
- where they require specialized UX or intelligence
- how to expand without losing product coherence

---

## Core Idea

We should not build separate products for novels, fanfic, articles, TikTok, classrooms, and game design.

We should build:

- one shared intelligence layer
- one evolving project-memory system
- one set of creation and revision primitives
- multiple mode-specific workflows on top

The operating system is the shared layer.
Modes are specialized interfaces and behaviors built on that layer.

---

## The Shared Engine

Every serious mode should inherit the same core system.

### Shared engine capabilities

- structured project memory
- Codex or knowledge graph
- timeline or version-aware truth
- context selection and budgeting
- drafting and revision tools
- planning and outline support
- continuity or consistency checks
- voice/style controls
- project-level history
- adaptation into other outputs

### Shared engine principle

The user should not have to rebuild project truth from scratch for every output format.

If they define:

- entities
- facts
- tone
- constraints
- audience
- structural intent

that information should remain reusable across modes.

---

## Mode Model

Every mode should be defined by five layers:

### 1. Knowledge schema

What kinds of things matter in this mode?

Examples:

- characters, locations, factions, canon facts
- claims, sources, arguments
- scenes, beats, camera instructions
- hooks, CTAs, platform constraints

### 2. Planning schema

How is work structured?

Examples:

- acts, chapters, scenes
- sections, arguments, evidence
- posts, slides, beats, captions
- lessons, objectives, exercises

### 3. Writing schema

What does the editor need to understand?

Examples:

- prose chapters
- screenplay blocks
- stanza and line layouts
- short-form platform segments

### 4. Review schema

What does "good" mean in this mode?

Examples:

- continuity
- pacing
- canon fidelity
- factual support
- citation quality
- hook strength
- clarity
- platform fit

### 5. Output schema

What forms should this mode export or adapt into?

Examples:

- novel manuscript
- screenplay draft
- social thread
- newsletter
- lesson plan
- game quest document

---

## Priority Tiers

Not all modes should be treated equally.

### Tier 1: Wedge modes

These should define the product first.

- novels
- fanfic
- short stories
- screenplays
- story-heavy game design

Why these come first:

- they benefit most from structured narrative memory
- they share worldbuilding and continuity problems
- they reward long-term project intelligence
- they are strongest matches for Codex and chapter-aware truth
- they give us a distinctive position versus shallow AI writing tools

### Tier 2: Adjacent prose modes

These should come after the fiction core is strong.

- non-fiction
- articles
- newsletters
- academic

Why these come second:

- they still benefit from structured knowledge and revision workflows
- they require different truth models, especially source-backed claims
- they can reuse much of the engine, but need different review layers

### Tier 3: Adaptation and distribution modes

These are powerful, but should usually be fed by stronger upstream project intelligence.

- TikTok
- Instagram
- ad copy

Why these come later:

- they often work best as outputs adapted from a richer project core
- they need audience, hook, and platform optimization more than deep continuity
- they should reuse the same voice, message, and knowledge layer

### Tier 4: Specialist modes

These are valuable but require more specialized treatment.

- poetry
- classroom

Why these need care:

- poetry is structurally and aesthetically different from prose
- classroom mode implies pedagogy, scaffolding, and assignment workflows

These can become meaningful expansions, but should not distract from the core wedge too early.

---

## Recommended Sequencing

### Phase A: Deep fiction core

Focus:

- novels
- fanfic
- short stories

Main product work:

- Codex
- continuity
- planning
- drafting
- revision
- fandom/canon intelligence

### Phase B: Structured narrative expansion

Focus:

- screenplays
- game design

Main product work:

- mode-aware editors
- scene and beat structures
- relationship and state tracking beyond prose chapters
- branching or state-aware logic where needed

### Phase C: Knowledge-backed prose expansion

Focus:

- non-fiction
- articles
- newsletters
- academic

Main product work:

- source graph
- evidence tracking
- citation workflows
- claim verification and argument structure

### Phase D: Adaptation layers

Focus:

- TikTok
- Instagram
- ad copy

Main product work:

- voice-preserving adaptation
- hook generation
- format compression
- audience and platform packaging

### Phase E: Specialist systems

Focus:

- poetry
- classroom

Main product work:

- poetry-first composition/review
- educational scaffolding
- teaching workflows

---

## Mode-by-Mode Strategy

## Novels

This is the central mode.

Needs:

- chapter and scene structure
- long-form continuity
- character arcs
- subplot tracking
- pacing awareness
- revision support

Engine advantage:

- strongest fit for Codex and progression-based truth

Priority:

- highest

---

## Fanfic

This should be treated as a first-class flagship mode, not a skin on top of novel mode.

Needs:

- canon seeding
- canon vs divergence tracking
- alias and identity handling
- fandom-specific references
- AU tagging
- relationship and lore consistency

Engine advantage:

- major moat if done well

Priority:

- highest

---

## Short Stories

This mode shares the fiction engine, but rewards compression and structure discipline.

Needs:

- tighter arc planning
- stronger opening and ending tools
- economy-of-detail review
- thematic cohesion checks

Engine advantage:

- reuses fiction infrastructure almost completely

Priority:

- highest

---

## Screenplays

This is close enough to fiction to be a strong second-step mode.

Needs:

- screenplay formatting
- scene/slugline aware editing
- dialogue and action separation
- beat-based planning
- visual pacing and structure review

Engine advantage:

- same story-memory layer
- different editor and review schemas

Priority:

- high, after fiction core

---

## Game Design

This is one of the most promising expansions because it is deeply world/state-driven.

Needs:

- lore systems
- factions
- items
- quests
- branching states
- NPC consistency
- design document structure

Engine advantage:

- Codex naturally maps to entities, states, and relationships

Priority:

- high, after fiction core

---

## Non-Fiction

This should not be treated like fiction with the names changed.

Needs:

- facts instead of canon
- source-backed claims
- argument structure
- outline and evidence hierarchy
- clarity and logic review

Engine advantage:

- strong if we evolve Codex into a broader knowledge system

Priority:

- medium

---

## Articles

This is a strong entry point for nonfiction expansion.

Needs:

- headline and framing tools
- outline-to-draft flows
- clarity and concision review
- audience targeting
- source and claim management when relevant

Engine advantage:

- easier than full academic mode
- benefits from shared drafting/adaptation tools

Priority:

- medium

---

## Newsletters

This is useful because it mixes writing, voice, consistency, and recurring format.

Needs:

- recurring structure templates
- issue history memory
- audience voice consistency
- series continuity across issues
- adaptation from longer source material

Engine advantage:

- recurring project memory is a real advantage here

Priority:

- medium

---

## Academic

This is viable, but only if supported by a proper source-and-citation layer.

Needs:

- research organization
- citations
- evidence-backed claims
- structure and clarity review
- citation-aware exports

Engine advantage:

- moderate, but only after strong knowledge graph and citation tooling exist

Priority:

- medium-late

---

## TikTok

This should be treated as an adaptation mode, not a foundational project mode.

Needs:

- hook-first structure
- short-form pacing
- script + caption adaptation
- angle testing
- audience/platform fit

Engine advantage:

- strongest when adapting from richer upstream work

Priority:

- medium-late

---

## Instagram

Also best treated as an adaptation surface.

Needs:

- caption structure
- carousel/script adaptation
- tone consistency
- campaign or series continuity

Engine advantage:

- useful as a downstream output of larger projects

Priority:

- medium-late

---

## Ad Copy

This is valuable but can easily pull the product toward generic copywriting.

Needs:

- audience targeting
- offer framing
- benefit positioning
- CTA experimentation

Engine advantage:

- limited unless tied to broader campaign or brand knowledge

Priority:

- later, and only if it fits the broader operating-system strategy

---

## Poetry

Poetry deserves respect as its own craft, not a checkbox mode.

Needs:

- line and stanza aware editing
- rhythm and sound sensitivity
- imagery density review
- voice and thematic coherence

Engine advantage:

- limited overlap with continuity-heavy fiction systems

Priority:

- later specialist mode

---

## Classroom

This is not just a format.
It is a workflow environment.

Needs:

- assignment structures
- lesson plans
- scaffolding
- rubrics
- student-safe modes
- adaptation of complex content into teaching materials

Engine advantage:

- strongest after nonfiction, source handling, and adaptation systems mature

Priority:

- later specialist mode

---

## Product Architecture Implication

To support multiple modes cleanly, we should eventually think in terms of:

### 1. Base project model

Shared across all modes:

- project
- workspace
- knowledge graph
- assets
- outputs

### 2. Mode packs

Each mode defines:

- default schema
- planning templates
- review rules
- editor behaviors
- prompt templates
- export targets

### 3. Adaptation pipelines

These transform one project into another output form:

- novel -> newsletter
- article -> TikTok script
- world bible -> game design doc
- chapter -> screenplay beat sheet

This is how the operating system becomes more than a single writing tool.

---

## Admission Criteria For New Modes

Before adding a new mode, ask:

### 1. Does it reuse the shared engine meaningfully?

If not, it may be a distraction.

### 2. Does it benefit from project memory and structured knowledge?

If yes, it is more likely to fit the OS.

### 3. Can it share drafting, revision, or adaptation primitives?

If yes, it is cheaper and more coherent to add.

### 4. Does it strengthen our wedge or strategic expansion path?

If not, it may create noise without increasing differentiation.

### 5. Can we define its knowledge, planning, writing, review, and output schemas clearly?

If not, the mode is not ready.

---

## Recommended Near-Term Product Focus

For now, the cleanest focus remains:

### Build deeply

- novels
- fanfic
- short stories

### Expand next

- screenplays
- game design

### Then broaden

- nonfiction
- articles
- newsletters

### Then adapt/distribute

- TikTok
- Instagram

This keeps the product ambitious while preserving a strong center.

---

## Final Principle

The operating system should grow by increasing the range of things that can be powered by one coherent layer of creative truth.

The product becomes more powerful not when it supports the most labels, but when one project can intelligently evolve, adapt, and travel across many forms without losing its identity.

