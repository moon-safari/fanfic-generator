# Writing OS Product Moves

> The product moves that would make this feel unmistakably like the operating system for writing.

Use this together with:

- `docs/superpowers/specs/2026-03-27-narrative-os-product-thesis.md`
- `docs/superpowers/specs/2026-03-27-mode-strategy.md`
- `docs/superpowers/specs/2026-03-27-writing-os-strategy.md`

---

## Goal

Identify the highest-leverage product moves that would make the product feel like a true writing OS, not just a strong AI writing app.

This doc is intentionally more concrete than the thesis docs.

It asks:

- what would materially change user behavior
- what would create product gravity
- what would make the system feel central to a creator's workflow
- which moves are worth pursuing after the Codex foundation

---

## The Test

A feature makes the product feel more like an OS if it does at least one of these:

- becomes the place where project truth lives
- makes multiple parts of the workflow smarter at once
- lets work move between formats without losing identity
- compounds in value over time
- creates real workflow gravity so users keep returning to the same system

If a feature is just another generation button, it does not pass the test.

---

## Product Move 1: Universal Project Graph

### What it is

Evolve the Codex into a broader project graph.

Not only:

- characters
- locations
- lore
- factions

But eventually also:

- scenes
- plot threads
- themes
- promises/payoffs
- canon references
- source claims
- assets
- drafts
- outputs

### Why this matters

This is the deepest operating-system move.

It changes the product from:

- "tool that stores writing data"

into:

- "system that understands the structure of a creative project"

### What users feel

"Everything in this project connects here."

### Why it is OS-like

Because many workflows can read from the same underlying project graph:

- drafting
- revision
- continuity
- adaptation
- publishing
- asset generation

### Near-term implication

The current Codex is the first version of this.
We should keep designing with the broader project graph in mind.

---

## Product Move 2: Living Change Detection

### What it is

A system that watches how the project changes and helps the user maintain truth over time.

Examples:

- detect new entities after a chapter
- detect relationship changes
- detect state changes
- suggest Codex progressions
- flag stale or contradicted entries
- show unresolved changes awaiting confirmation

### Why this matters

This is the move from database to intelligence.

Without it, the Codex risks becoming a chore.
With it, the Codex becomes a collaborator.

### What users feel

"The system helps me keep the project accurate instead of asking me to babysit it."

### Why it is OS-like

Because the system becomes aware of project evolution, not just project storage.

### Near-term implication

This should be one of the earliest post-Codex bets.

---

## Product Move 3: Context Console

### What it is

A transparent interface that shows:

- what context the AI is using
- why that context was chosen
- what was excluded
- what truth is resolved at the current point in the work
- what context budget is being spent where

### Why this matters

Serious creators need trust and control.

Most tools hide prompt context.
An OS should expose and manage it.

### What users feel

"I know what the system thinks is relevant, and I can shape it."

### Why it is OS-like

Operating systems manage resources and execution transparently enough for power users to steer them.

This would do that for writing context.

### Near-term implication

Start small:

- show included Codex entries
- show chapter truth resolution
- show reason for inclusion

---

## Product Move 4: Adaptation Pipelines

### What it is

A first-class system for transforming one project artifact into another.

Examples:

- chapter -> screenplay beat sheet
- chapter -> newsletter recap
- world guide -> game design document
- long draft -> TikTok script
- fanfic chapter -> public summary / teaser

### Why this matters

This is one of the clearest ways to become an OS rather than a single-mode writing tool.

It proves that the same project intelligence can travel across forms.

### What users feel

"I can create in one place and repurpose from the same source of truth."

### Why it is OS-like

Because the product stops being a destination for one artifact and becomes an environment where creative work transforms.

### Near-term implication

We should pick one adaptation pipeline relatively early, before trying to support many full modes.

Best early candidates:

- chapter -> screenplay beat sheet
- chapter -> newsletter-style recap
- story world -> game design dossier

---

## Product Move 5: Workflow Memory

### What it is

The system remembers not just project facts, but how the creator works.

Examples:

- favorite prompts
- preferred rewrite styles
- recurring project conventions
- model preferences per task
- common review routines
- project-level workflows and presets

### Why this matters

An OS is not just a data store.
It becomes personalized infrastructure.

### What users feel

"The system knows how I like to work, not just what I wrote last time."

### Why it is OS-like

Because it turns repeated behavior into reusable workflow infrastructure.

### Near-term implication

This could begin with:

- prompt presets
- project-level style settings
- reusable craft workflows

---

## Product Move 6: Review and Insight Layer

### What it is

A layer that helps creators think about the project at a higher level.

Examples:

- relationship graph
- mention timeline
- appearance heatmap
- missing-character detection
- unresolved thread tracker
- setup/payoff tracker
- arc progression map

### Why this matters

Writers do not only need help generating words.
They need help understanding what the work is doing.

### What users feel

"This tool helps me see my project, not just write inside it."

### Why it is OS-like

Because the system becomes an interpretive layer over the whole project, not just an editing surface.

### Near-term implication

The first candidates should come directly from Codex data:

- relationship graph
- mention timeline
- appearance tracking

---

## Product Move 7: Research and Ingestion Layer

### What it is

A way to bring outside material into the project graph cleanly.

Examples:

- canon references
- research notes
- linked sources
- imported snippets
- worldbuilding inspiration
- classroom materials later

### Why this matters

A true OS needs inputs, not just outputs.

Creators constantly gather material from elsewhere.
If that material remains outside the system, the OS never becomes central.

### What users feel

"I can bring ideas, canon, and research in here and make them usable."

### Why it is OS-like

Because it turns the product into a home for project inputs as well as project outputs.

### Near-term implication

For fanfic, this could begin with canon seed data and source references.

For nonfiction later, it becomes source and evidence ingestion.

---

## Product Move 8: Cross-Project Memory

### What it is

A way to share structured knowledge across multiple related works.

Examples:

- series Codex
- shared universe data
- recurring newsletters
- brand or voice memory
- campaign memory

### Why this matters

The OS becomes much stronger when it helps manage not just one document, but a body of work.

### What users feel

"This is where my world or body of work lives, not just one file."

### Why it is OS-like

Because it expands the unit of value from document to creative system.

### Near-term implication

Series/shared Codex is a strong early version of this.

---

## Product Move 9: Collaborative Truth Management

### What it is

A collaboration layer built around shared project intelligence, not just comments on text.

Examples:

- shared Codex editing
- editorial review on story truth
- accepted/rejected AI suggestions
- canon locks
- protected facts
- team workflows later

### Why this matters

If the product becomes a serious workspace, collaboration eventually matters.

### What users feel

"This is where our project gets maintained, not just where we swap documents."

### Why it is OS-like

Because the system becomes organizational infrastructure, not just personal tooling.

### Near-term implication

This is later than Codex and continuity, but should inform data model choices now.

---

## Product Move 10: Publishing and Distribution Surfaces

### What it is

The project graph powers outward-facing outputs.

Examples:

- public story pages
- character pages
- series pages
- export bundles
- image/audio layers later
- social and newsletter adaptation

### Why this matters

An OS does not just help with creation.
It helps work move outward.

### What users feel

"I can create, package, and ship from the same system."

### Why it is OS-like

Because the product becomes a launch surface, not just a drafting environment.

### Near-term implication

We should keep output-ready structure in mind, even before building all publishing features.

---

## Product Move 11: Agentic Workflows

### What it is

Task-oriented flows where the system can help coordinate multiple steps instead of only answering single prompts.

Examples:

- read new chapter -> detect changes -> suggest Codex updates
- generate scene -> summarize scene -> extract entities -> run continuity check
- adapt chapter -> generate recap -> draft teaser -> package for social

### Why this matters

This is where the product starts to feel operational.

### What users feel

"The system can run meaningful workflows for me, not just generate one block of text."

### Why it is OS-like

Operating systems orchestrate processes.
This is the writing equivalent.

### Near-term implication

The first workflow should probably be:

- chapter created
- summary generated
- Codex delta suggested
- continuity check run

---

## Product Move 12: Mode Packs

### What it is

A formal system for mode-specific behavior built on the same engine.

Each mode pack would define:

- schema
- planning templates
- editor behavior
- review logic
- prompts
- export targets

### Why this matters

This is how we expand without becoming incoherent.

### What users feel

"This tool fits my kind of work without feeling like a totally separate product."

### Why it is OS-like

Because it creates one platform with different environments, not many disconnected tools.

### Near-term implication

We should design current fiction work with later mode-pack architecture in mind.

---

## Which Moves Matter Most Right After Codex

If I had to choose the most important moves immediately after the current Codex push, I would pick these:

### 1. Living change detection

This makes Codex sustainable.

### 2. Context console

This builds trust and makes the AI layer legible.

### 3. Continuity and insight layer

This makes the system materially smarter.

### 4. First adaptation pipeline

This proves the OS idea in product behavior, not just product language.

### 5. Cross-project memory

This starts compounding value beyond a single story.

---

## Best First "OS Feeling" Combo

The fastest believable route to the OS feeling is probably:

1. Codex-first writing
2. AI-suggested Codex updates after each chapter
3. continuity copilot tied to resolved truth
4. visible context console
5. one adaptation pipeline

That combination would already feel substantially different from standard AI writing tools.

---

## What To Avoid

These moves would create noise before they create OS value:

- adding too many shallow modes too early
- chasing every social format before the core engine is strong
- overinvesting in flashy multimodal features before truth management works
- building a huge prompt library without deep workflow integration
- treating Codex as optional instead of central

---

## Final Recommendation

To feel like the writing OS, the product needs to move from:

- generation

to:

- memory
- reasoning
- maintenance
- transformation
- orchestration

The most important step is not simply adding more use cases.

It is making the same underlying project intelligence power more of the creator's workflow.

That is when the product stops feeling like a tool and starts feeling like the place the work lives.

