# Newsletter Creator Workflow

> Start turning newsletter mode into a real Substack-style creator workflow, not just "issues instead of chapters."

## Why

Newsletter-native memory and review are necessary, but they are still internal depth.

Creator workflow starts when the workspace lets the writer define:

- publication identity
- recurring sections
- hook style
- CTA style

and then carries that identity forward into:

- prompts
- review
- adaptation
- artifacts

## This Slice

This first creator-workflow pass stays intentionally small:

1. Add editable newsletter publication profile fields to `mode_config`
2. Surface them in `Artifacts`
3. Thread them into newsletter memory and prompt context
4. Add a seeded newsletter showcase project for testing

## Publication Profile Fields

Stored in newsletter `mode_config`:

- `subtitle`
- `hookApproach`
- `ctaStyle`
- `recurringSections`

These sit on top of the existing fields:

- `topic`
- `audience`
- `issueAngle`
- `cadence`

## UX

The profile lives inside `Artifacts`, not in a separate settings area.

Reason:

- it keeps newsletter creator workflow inside the same project-memory surface
- it makes the publication identity inspectable next to planning docs and saved outputs
- it avoids fragmenting the writing workspace

## Backend

Profile edits save through an authenticated server route:

- `/api/stories/[storyId]/mode-config`

This keeps the flow ownership-aware and compatible with RLS-backed project access.

## Sample Newsletter

The repo now includes a seeded newsletter showcase:

- publication profile
- planning docs
- issue archive
- saved adaptation artifacts
- saved issue-package artifacts

The goal is to let product and UX work be tested without manually setting up a newsletter from scratch each time.

## Result

Newsletter mode is still not the full creator OS yet, but it now has:

- real publication identity
- recurring-section memory
- prompt-visible hook and CTA guidance
- a reusable testbed for future newsletter features
