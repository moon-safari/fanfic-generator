# Newsletter Mode Pack V1

> First adjacent mode pack for the Writing OS, built to reuse the same project-memory backbone without forcing fiction-first UX onto newsletter creators.

## Goal

Ship the first serious adjacent mode beyond fiction while keeping the architecture clean:

- `stories` remain the top-level project container
- project mode determines generation, continuation, and workspace language
- Story Bible remains the active memory layer for newsletter projects in v1
- Codex remains fiction-first and is intentionally not forced onto newsletters yet

## What Shipped

### 1. Real project mode in the database

Migration:

- `supabase/migrations/009_story_project_modes.sql`

Schema additions:

- `stories.project_mode`
- `stories.mode_config`

Current modes:

- `fiction`
- `newsletter`

Newsletter config currently stores:

- `topic`
- `audience`
- `issueAngle`
- `cadence`

## 2. Mode-aware creation flow

Newsletter projects now have their own creation inputs:

- newsletter title
- topic
- audience
- issue 1 angle
- cadence
- voice

This is intentionally not hidden behind fiction language or fandom-shaped defaults.

## 3. Issue-aware generation and continuation

Newsletter projects now generate:

- issue 1 instead of chapter 1
- subsequent issues instead of subsequent chapters

Prompt behavior now shifts on project mode rather than assuming all long-form writing is fiction.

## 4. Story-memory behavior

Newsletter projects still generate Story Bible memory so the system has durable project truth.

V1 boundary:

- newsletter projects do **not** auto-generate Codex
- newsletter projects do **not** run Codex suggestion generation
- the Codex side-panel tab is hidden for newsletter projects

Reason:

- forcing character/lore/relationship Codex behavior onto newsletters would create fiction-shaped noise
- Story Bible memory is enough to make newsletter mode useful now without fake parity

## 5. Mode-aware side-panel behavior

Newsletter projects now get:

- issue-aware toolbar labels
- issue-aware continue button text
- issue-aware adaptation language
- issue-aware artifact titles and scope filters
- issue-aware history grouping

This keeps the workspace from feeling like a fiction product wearing a newsletter costume.

## 6. Adaptation and artifacts

Adaptation now receives:

- `projectMode`
- `modeConfig`

This lets prompts treat the source material as an `issue` when appropriate.

Artifacts now normalize with mode-aware titles like:

- `Issue 3 Newsletter Recap`
- `Issue 3 Public Teaser`

Planning artifacts also render outline content with issue labels for newsletter projects.

## Security And Ownership

This slice stays backend-first:

- story ownership still gates all mode-aware routes
- all AI calls remain server-side
- story mode is resolved from owned project data, not trusted from client UI alone
- migration is backward-compatible with existing fiction projects

## Deliberate V1 Boundaries

These are intentionally not solved yet:

- newsletter-specific Codex or memory schema
- newsletter-specific continuity categories
- newsletter mode pack on the landing page as a fully separate marketing section
- structured issue planning objects beyond editable planning artifacts
- dedicated newsletter review passes like hook quality or promise/payoff checks

## Why This Matters

This is the first real proof that the product can expand by `mode packs` instead of by random one-off features.

The same Writing OS primitives now support two different project shapes:

- fiction
- newsletter

without forking the whole app or pretending they are the same workflow.

## Next Logical Steps

After newsletter mode v1, the strongest follow-ups are:

1. `Planning V2`
- structured issue/arc planning
- unresolved threads
- planned reveals
- issue intent

2. `Continuity Copilot V2`
- mode-aware contradictions
- stale memory warnings
- drift detection across fiction and newsletter projects

3. `Newsletter-specific adaptation depth`
- title / subtitle / hook packs
- last-issue recap
- CTA variants
- subject-line variants
- social cutdowns
