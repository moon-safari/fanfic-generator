# Newsletter Preflight Review Design

## Goal

Add one practical creator-facing review artifact before widening the newsletter mode further:

- a saved `Send Checklist` output
- grounded in the current issue, publication profile, planning context, and existing issue-package assets

This should stay inside the existing adaptation/artifact system instead of creating a disconnected newsletter-only review surface.

## What This Slice Adds

### 1. New saved adaptation output

`issue_send_checklist`

Purpose:

- review whether an issue is actually ready to send
- check package readiness against:
  - issue angle
  - recurring sections
  - hook approach
  - CTA style
  - already-generated issue-package assets

### 2. Prompt behavior

The checklist should:

- use the issue text as the source of truth
- use planning and newsletter memory as guidance
- inspect saved issue-package artifacts when they exist
- call missing pieces out explicitly instead of inventing completeness

### 3. Creator workflow fit

This belongs inside the existing newsletter creator workflow:

- `Adapt` generates it
- `Artifacts` stores it
- the showcase seeds it

That keeps the Writing OS consistent:

- one project memory layer
- one artifact layer
- one secure server-side generation path

## UX Rule Carried Forward

Anything the user can add in the newsletter profile should also be editable and deletable.

This slice therefore also upgrades recurring sections from:

- add + delete only

to:

- add
- edit in place
- delete explicitly

## Why This Makes Sense

This is not feature sprawl.

It solves a real creator moment:

- the issue draft exists
- the outward-facing package exists or is partly generated
- the creator wants one quick internal readiness pass before sending

That is a clear workflow step for newsletter creators, especially Substack-style solo operators.

## Follow-On

After this slice, the next sensible newsletter creator steps are:

- recurring section packaging
- issue bundle export
