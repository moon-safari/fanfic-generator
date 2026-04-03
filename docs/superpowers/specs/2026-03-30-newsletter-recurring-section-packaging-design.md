# Newsletter Recurring Section Packaging Design

## Goal

Turn configured recurring sections into a real saved issue-package artifact.

This slice adds one concrete output:

- `Recurring Section Package`

It should help a creator move from:

- "these are the sections my publication usually has"

to:

- "here is issue-ready draft copy for those sections right now"

## Why This Makes Sense

This is a natural next step after:

- publication profile
- recurring sections
- hook / CTA variants
- send checklist
- issue bundle export

Without this layer, recurring sections stay descriptive.
With this layer, they become operational.

## Output Shape

The output should:

- create one draft block for each configured recurring section
- use the current issue angle as the anchor
- preserve the publication's voice
- stay issue-ready rather than drifting into abstract planning notes

## Workflow Fit

The package should:

- live in `Adapt`
- save like the rest of the issue package outputs
- appear in `Artifacts`
- feed into the send checklist
- appear in the markdown issue bundle export

## UX Rule

This slice does not create a new user-managed planning object.

Recurring sections themselves remain:

- addable
- editable
- deletable

The packaged section draft is a saved output, so it is:

- generatable
- regeneratable
- deletable

## Follow-On

After this slice, the next sensible newsletter creator step is:

- pre-send polish on top of the bundle workflow
