# Newsletter Issue Package Design

## Goal

Turn newsletter creator mode into a real outward-facing workflow, not just issue drafting plus recap.

This slice adds a saved `issue package` workflow on top of the existing adaptation and artifact system.

## Why This Matters

Newsletter creators do not stop at the issue draft.

They also need:

- subject lines
- decks or subtitles
- stronger openings
- closing CTAs

If those outputs stay session-only or live outside the project, the workflow becomes fragmented again.

## What Ships In This Slice

### New saved adaptation outputs

- `issue_subject_line`
- `issue_deck`
- `issue_hook_variants`
- `issue_cta_variants`

These are persisted in `adaptation_outputs` just like recap and teaser outputs.

### Newsletter-only workflow chain

`Issue Package`

It generates the full outward-facing package for the current issue:

1. subject line options
2. deck options
3. hook variants
4. CTA variants

### Mode-aware Adapt UI

Newsletter projects now see:

- the `Issue Package` workflow
- the new packaging formats

Fiction projects do not.

### Showcase coverage

The seeded newsletter showcase now includes saved issue-package artifacts so the workflow can be tested immediately.

## Product Boundaries

- Packaging outputs stay grounded in the source issue, newsletter memory, and planning context.
- They do not invent events that never happened.
- They are available only to newsletter projects.
- They reuse the existing authenticated server routes and RLS-backed storage model.

## Follow-On Opportunities

If this proves valuable, the next creator-workflow layer should likely be:

- recurring section packaging
- send checklist / preflight review
- issue bundle export
- calendar / cadence support
