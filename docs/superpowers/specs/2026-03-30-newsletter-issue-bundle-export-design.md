# Newsletter Issue Bundle Export Design

## Goal

Add one simple creator-facing export action on top of the saved newsletter package workflow:

- export the current issue as one markdown bundle

This should use data the project already has, not generate a new detached object.

## What The Bundle Includes

- publication profile summary
- current issue summary, when present
- saved issue-package artifacts:
  - subject lines
  - deck options
  - hook variants
  - CTA variants
  - send checklist
  - recap / teaser if saved
- full issue body

## Product Reasoning

This makes sense because a newsletter creator often needs one handoff-ready package for:

- review
- editing outside the app
- moving into Substack or another publishing surface
- sharing internally

That is a real workflow step, not a decorative export.

## Shape

The export should:

- live in `Artifacts`
- target the current issue
- be available as:
  - copy bundle
  - download `.md`

It should be composed on the server from the authenticated project state.

## Why Not A New Saved Artifact

This slice is intentionally not another stored output type.

The bundle is:

- derived from saved project truth
- useful as a transfer/export surface
- not a separate authored object that needs its own lifecycle

That keeps the system cleaner.

## UX Rule Still Applies

Anything the user can add should also be editable and deletable.

This export slice does not introduce a new user-managed object, so it does not add a new edit/delete burden.

## Follow-On

After this slice, the next sensible newsletter creator steps are:

- recurring section packaging
- pre-send polish on top of the bundle workflow
