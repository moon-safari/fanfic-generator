# Planning-Aware Continuity

> First step toward a continuity copilot that understands not only what is true,
> but what the project is trying to do next.

## Goal

Make continuity review aware of:

- current unit intent
- expected reveal or turn
- active arcs
- tracked open threads
- due or overdue payoffs

This should stay conservative and useful, not become a noisy "you changed your
mind" detector.

## What Changed

### 1. Continuity now reads the planning layer

The continuity route now pulls:

- `outline`
- `notes`

from `story_bibles`, then builds a structured planning context for the current
chapter or issue.

That context is added alongside:

- Codex / story-context truth
- previous unit summaries

### 2. The prompt can now flag planning drift

The model can now return:

- `continuity_warning`
- `planning_drift`

Planning drift is for cases like:

- the current unit clearly missing its stated intent
- an explicitly due payoff still not landing
- the current unit contradicting its expected reveal/turn

### 3. Planning drift persists as a first-class annotation

`chapter_annotations` now allows `planning_drift`, so these checks are not
temporary client-side decorations.

Migration:

- `010_planning_drift_annotations.sql`

### 4. Annotation UX now explains the source better

The tooltip now distinguishes:

- `Continuity`
- `Plan drift`

and avoids awkward labels like `Ch. 0`.

Instead it shows:

- `Project context`
- `Project plan`
- or a real chapter/issue reference

### 5. Planning drift is now actionable

Planning-drift annotations can now carry structured metadata:

- `reasonType`
- `targetSection`
- `targetLabel`
- `suggestedAction`

That metadata now powers both:

- a direct handoff from the annotation tooltip into the relevant planning
  surface in `Artifacts`
- one-click actions that mutate planning state safely from the editor

Examples:

- missed unit intent -> `Update outline intent`
- reveal drift -> `Update outline reveal`
- due thread -> `Mark thread resolved`
- due thread that should slip -> `Defer payoff by 1`
- arc drift with a clearly started but still-planned arc -> `Mark arc active`
- intentional divergence -> `Mark intentional divergence`

### 6. Continuity now remembers resolved drift

Dismissed annotations with a structured resolution state are now part of the
continuity loop.

That means:

- `applied` follow-ups do not keep coming back as duplicate nags
- `intentional_divergence` decisions are respected on later continuity runs

This keeps continuity useful instead of repetitive.

### 7. Planning drift now explains itself better

Annotations now carry more contextual detail where the system can determine it
reliably from the planning layer.

Examples:

- planned intent text from the current outline unit
- expected reveal text from the current outline unit
- due payoff unit for a tracked thread
- current thread or arc status
- planning horizon for tracked arcs

This makes the tooltip more like a writer-facing explanation and less like a
raw warning label.

## Why This Matters

This is the first real bridge between:

- project memory
- planning memory
- review memory

Without this, planning stays passive.

With this, the system can begin asking:

- did the unit do what it was supposed to do?
- did an expected payoff land?
- are we drifting from the project spine in a meaningful way?

## Design Constraints

This pass is intentionally conservative.

It does **not** try to:

- force rigid outline adherence
- punish discovery writing
- flag every unresolved thread
- invent structure where the planning layer is sparse

It should only flag clear, useful cases.

## Next Logical Steps

1. Surface richer planning-aware continuity reasons in the UI
- improve explanation beyond the first label/target chips

2. Add more structured action types
- update arc state
- defer thread payoff
- convert drift into explicit outline revisions

3. Feed planning intent into generation and adaptation more directly
- not just review after the fact

## Product Meaning

This moves continuity from:

- "fact contradiction checker"

to:

- "truth + plan coherence checker"

That is a big step toward the Writing OS vision.
