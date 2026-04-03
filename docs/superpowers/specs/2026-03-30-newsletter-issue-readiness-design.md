# Newsletter Issue Readiness Design

## Why this slice exists

Newsletter creator workflow had reached the point where package outputs, recurring sections, and bundle export existed, but the system still lacked one compact answer to:

- Is this issue actually ready to send?
- What is still missing?
- What should I generate next?

This slice adds a deterministic readiness report instead of another open-ended AI feature.

## Product goal

Give newsletter creators one current-issue card in `Artifacts` that:

- checks package readiness
- points to missing pieces
- links directly to the right adaptation output
- keeps export in the same place

## What was built

### 1. Deterministic preflight evaluator

Server route:

- `src/app/api/newsletter/[storyId]/preflight/route.ts`

Shared evaluator:

- `src/app/lib/newsletterPreflight.ts`

This report checks:

- publication profile completeness
- issue summary presence
- core issue-package outputs
- recurring section coverage
- send checklist presence
- bundle export readiness

It is intentionally non-LLM and uses authenticated project data only.

### 2. Readiness card in `Artifacts`

UI:

- `src/app/components/editor/ArtifactsTab.tsx`

The existing newsletter export card now doubles as:

- readiness summary
- per-check status list
- next-action launcher into `Adapt`
- bundle export surface

This keeps the creator workflow tight instead of scattering related actions across multiple sections.

### 3. Action-oriented follow-up

Each readiness check can recommend a concrete next output such as:

- `Subject Line Options`
- `Issue Deck Options`
- `Recurring Section Package`
- `Send Checklist`

That recommendation opens the existing `Adapt` surface rather than inventing a second generation UI.

## Why this is a good Writing OS feature

This is useful because it reduces uncertainty without adding abstraction.

It does not create:

- a new schema family
- another side panel
- another user-managed object

It simply makes the newsletter workflow legible and operational.

## Boundaries

This slice does not do:

- publishing integration
- email provider sync
- audience analytics
- automated send approval

Those belong later, after the creator workflow is stronger.

## Relationship to the roadmap

This belongs inside:

- `newsletter creator workflow`

It is the first true pre-send layer on top of:

- publication profile
- recurring sections
- issue package outputs
- send checklist
- bundle export

## Next likely step

Stay disciplined and keep improving the same workflow:

- tighter pre-send polish
- issue readiness flow refinements
- eventual distribution-ready handoff
