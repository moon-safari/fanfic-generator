# Writing OS Near-Term Roadmap

> Move from "fanfic generator" to a credible writing platform without losing the fiction wedge that got us here.

## Why This Is The Right Moment

The product has outgrown its current framing.

- The current app shell and homepage still present the product as a fanfiction generator.
- The actual product now includes Codex, context steering, update review, continuity-aware writing, and adaptation outputs.
- If we keep shipping depth without updating positioning, the product will feel more capable than it looks, and harder to understand than it needs to be.

This means the next phase should balance three tracks:

1. `Positioning`
2. `Product Depth`
3. `Mode Expansion`

We should not widen the product at the expense of the core loop. The deepest moat is still:

`living project memory + chapter-aware truth + adaptation + continuity`

## Strategic Priorities

### 1. Reposition The Product

The outside story should shift from:

`AI Fanfiction Generator`

to something closer to:

`AI writing studio with living project memory`

or

`The operating system for serious writing`

The public framing should stay concrete and useful, not abstract.

Good public promise:

- write
- remember
- adapt
- review
- publish

### 2. Deepen The Product

We now need to make the system feel more like a real creative platform and less like a collection of smart side tools.

The most valuable next depth areas are:

- project artifact library
- planning / outline / beats / arc layer
- stronger continuity copilot
- research ingestion
- series / shared Codex

### 3. Expand By Mode Packs

We should not expand by adding random output types.

We should expand by introducing structured modes with their own:

- planning schema
- knowledge schema
- adaptation outputs
- review rules

The correct order is:

1. `Fiction / Fanfic / Novels / Short Stories`
2. `Newsletter / Serialized creator mode`
3. `Screenplay`
4. `Comics / Graphic Narrative`
5. `Game Writing / Narrative Design`
6. later: non-fiction, academic, classroom, social

## The Next 6-8 Weeks

### Track A: Landing Page And Positioning

Goal: make the product legible.

Deliverables:

- replace the current homepage positioning
- define the new product headline, subheadline, and feature framing
- introduce use-case sections beyond fanfic alone
- present Codex, Context, Updates, Adaptation, and Continuity as one system
- give the app a more premium "writing platform" first impression

Recommended page structure:

1. Hero
2. Core value strip: `Write`, `Remember`, `Adapt`, `Review`
3. Product system section
4. Mode section
5. Example workflows
6. Social proof / future vision
7. CTA into app

### Track B: Artifact Library

Goal: make generated outputs feel like project assets, not side-panel leftovers.

Deliverables:

- project-level artifact view
- list/filter all saved adaptation outputs
- group by chapter, type, and status
- open, reuse, regenerate, delete
- prepare the foundation for future notes, briefs, outlines, and exports

This is one of the fastest ways to make the product feel more like a real OS.

### Track C: Newsletter Mode Pack

Goal: enter a powerful adjacent market without abandoning the fiction wedge.

Why this is strong:

- newsletter writers also need continuity and voice
- serialized writing maps naturally onto chapters/issues
- recap / teaser / summary workflows already fit the current architecture
- Substack-style creators are often solo operators who benefit from project memory

Initial newsletter mode should include:

- issue concept / angle support
- series memory
- recap generation
- teaser generation
- "what happened last issue"
- title / subtitle / hook variations
- voice consistency review

But the real direction should be broader than "issue-aware writing."

The long-term shape of this mode should be:

- publication identity
- recurring audience promise
- recurring sections or segments
- issue package workflow
- subscriber-facing outputs
- continuity across issues
- editorial momentum for solo creators

Important note:

This should still use the same system underneath: Codex, Context, Updates, Adapt.

### Track D: Planning Layer

Goal: move beyond "write chapter by chapter" into "plan and steer the work."

Deliverables:

- outline objects
- scene beats
- arc notes
- unresolved threads
- planned reveals
- chapter intent

This is the bridge between:

- story memory
- active drafting
- adaptation
- continuity review

### Track E: Continuity Copilot V2

Goal: make the system feel genuinely helpful during long-form writing.

Deliverables:

- contradiction detection
- stale-entry review
- unresolved-thread surfacing
- relationship drift warnings
- character-state consistency warnings
- "this change probably belongs in Codex" suggestions

This should sit on top of the Codex + Updates loop, not outside it.

## Recommended Build Order

If we want the cleanest product sequence, I would do:

1. Landing page + positioning refresh
2. Artifact library
3. Newsletter mode pack
4. Planning layer
5. Continuity Copilot V2

Progress update:

- `1` is done
- `2` is done
- `3` is now live in a first mode-pack slice
- `4` is now partially live through planning artifacts, structured outline fields, and arc/thread tracking
- `5` is now started through planning-aware continuity, action metadata, one-click planning-drift follow-ups, and planning-aware generation, but not yet a full continuity copilot
- newsletter-native memory/review depth is now started through shared newsletter memory, visible artifact memory, and promise/voice drift checks
- newsletter review passes now include hook drift, CTA drift, and recurring segment drift on top of the shared newsletter memory model
- newsletter creator workflow is now started through publication profile editing, recurring sections, saved issue-package outputs, recurring section packaging, send-checklist review, and a seeded newsletter showcase
- newsletter creator workflow now also supports current-issue bundle export from `Artifacts`
- newsletter creator workflow now also includes deterministic current-issue readiness checks with direct links to missing package outputs
- newsletter issue readiness now surfaces blockers, next-step actions, and hidden-ready-check summaries so pre-send review feels focused instead of noisy
- the `Issue Package` workflow in `Adapt` now shows package completeness and can fill only the missing outputs, keeping pre-send work incremental instead of repetitive
- the same workflow now points to the next missing piece and gives a cleaner final handoff once the package is complete
- issue-package outputs can now become canonical issue state through official subject line, deck, hook, CTA, and section-package selections that stay editable and clearable
- canonical issue-package state now feeds readiness and bundle export so newsletter packaging becomes durable project truth instead of saved option piles
- issue readiness now also checks whether the current issue body still aligns with the chosen canonical framing, hook, CTA, and recurring section package
- the next priority is simplification, not more surfaces: reduce newsletter to a clear pre-send loop the user can actually understand
- the same simplification pass should now include Codex and other side-panel surfaces, with default-visible workflow separated from `Advanced`
- the default workspace language is now being simplified too: `Codex` -> `Memory`, `Artifacts` -> `Project`, and `Adapt` -> `Outputs`
- the next simplification layer is behavioral, not just naming: keep secondary project filters hidden by default and keep older memory-review activity collapsed unless the user asks for it
- that simplification work is now started through fewer default tabs, hidden advanced tools, optional Codex filters, and collapsed newsletter setup
- the same simplification pass is now moving into detail views too: memory defaults to the main fact before mention trails or progression tools, and project views foreground saved content before metadata or lower-priority newsletter setup
- the next simplification layer is now also visible in the default action hierarchy: fact details hide secondary chips until asked for, and project items expose one clear primary action before copy / reopen / delete controls
- the same simplification work is now reducing list noise too: Memory and Project items use quieter summary lines instead of dense badge stacks so scanning feels more natural
- the next layer of that same work is now visible in headers and setup cards too: Memory defaults to one quiet summary line, and saved newsletter setup opens on a compact summary before deeper context
- the same simplification rule now applies to workflow cards: pre-send keeps one export action visible first, with secondary export behavior tucked behind a reveal
- that same workflow simplification now applies to Outputs too: keep one obvious workflow action visible, and hide per-output workflow controls plus official package editing behind explicit reveals
- the editor shell is now following the same rule too: writing tools collapse into one calmer toolbar entry point instead of a permanent row of actions
- the home flow is now following it as well: create defaults to the core setup first, deeper options hide behind `More options`, sample projects hide behind a reveal, and the workspace chooser reads as `start new` or `open saved`
- the remaining visible copy is now being aligned too: primary actions prefer plain verbs like `Use in editor`, and default surfaces avoid internal wording where possible
- the final shell cleanup is now reducing redundant visual signals too: note indicators are quieter, footer CTAs are calmer, duplicate metadata is removed, and the side-panel header is less chrome-heavy

Important clarification:

- `newsletter-native memory/review depth` is product-depth work
- `newsletter creator mode` is a mode-pack / workflow-shape layer that still needs to be built more fully

Current newsletter creator workflow depth now includes:

- publication profile
- recurring sections
- saved issue-package outputs
- canonical issue-package selections
- recurring section packaging
- send checklist
- current-issue bundle export
- deterministic issue readiness

That order gives us:

- a clearer public story
- a stronger core product
- a real adjacent expansion
- more depth before wider sprawl

## Product Ideas Worth Carrying Forward

These are the strongest medium-term ideas to keep in view:

### Project Graph

One connected model linking:

- stories
- chapters
- Codex entries
- updates
- context rules
- artifacts
- outlines
- research
- future publishing outputs

### Research Ingestion

Import reference material into project memory.

Examples:

- canon notes
- worldbuilding references
- research links
- pasted docs
- future fandom imports

### Series Brain

A shared Codex and planning layer across multiple stories or books in the same universe.

This is especially strong for:

- fanfic series
- multi-book novels
- serialized newsletters
- game worlds

### Adaptation Studio

Continue turning one source of truth into many outputs.

Examples:

- chapter -> recap
- chapter -> teaser
- chapter -> beat sheet
- chapter -> dossier
- chapter -> pitch
- chapter -> episode summary

### Review Passes

Structured passes beyond generation:

- pacing
- clarity
- continuity
- exposition load
- emotional arc
- character consistency

## Immediate Recommendation

The best next move is:

`Turn continuity actions into a fuller copilot loop`

Meaning:

- richer planning-drift actions
- stronger thread/arc resolution flows
- planning-aware generation and adaptation
- better newsletter-native project memory instead of fiction-shaped stopgaps
- newsletter-specific review passes on top of the shared memory model
- then the fuller newsletter creator workflow: publication identity, recurring sections, section-ready packaging, issue-package outputs, and send readiness

Then the next newsletter-specific move should be:

`Start the real creator workflow layer`

Meaning:

- publication profile
- recurring sections
- issue package outputs
- hook / title / CTA workflow

That creator-workflow layer is now underway through saved issue-package outputs:

- subject line options
- deck options
- recurring section package
- hook variants
- CTA variants
- send checklist / preflight review
- issue bundle export
- canonical issue-package state
- canonical package alignment review

The most sensible next newsletter-specific step after this is:

- build the next review/export moves on top of canonical issue-package state, not by adding more disconnected output types

## Short Version

The next phase should be:

- clarify what the product is
- deepen the system around memory, artifacts, and planning
- expand to newsletter mode as the first serious adjacent wedge

That gives us a much stronger path toward becoming the OS for writing, rather than just a better fanfic tool.

Simplification note:

- the final simplification pass should also clean up onboarding and shell microcopy
- home, login, create, and editor confirmations should use plain, mode-neutral wording where possible
