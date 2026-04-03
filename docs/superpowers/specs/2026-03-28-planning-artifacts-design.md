# Planning Artifacts Inside Artifact Library

## Summary

The `Artifacts` surface now holds two artifact families:

- `adaptation` artifacts from `adaptation_outputs`
- `planning` artifacts from `story_bibles`

This keeps the product model unified:

- `Codex` = living memory
- `Context` = active runtime truth
- `Artifacts` = durable reusable project outputs and planning docs

## Why This Shape

Do not create a separate planning section yet.

The product is easier to understand if saved chapter outputs and project-level
planning docs live in one reusable library surface.

The repo already has secure `story_bibles` storage for:

- `synopsis`
- `style_guide`
- `outline`
- `notes`

So the cleanest next artifact family is to normalize those into the artifact
layer instead of inventing a new table.

## Scope

Included planning artifacts:

- `Project Synopsis`
- `Style Guide`
- `Outline`
- `Project Notes`

Not included yet:

- `characters`
- `world`
- `genre`

Those remain older story-bible shapes and should not compete with Codex.

## UX Rules

- Planning artifacts still live inside `Artifacts`, not a separate panel.
- Selecting a planning artifact opens an in-place editor in the artifact preview.
- Edits autosave through the existing `/api/story-bible/[storyId]` route.
- Adaptation artifacts keep `Open in Adapt` and `Delete`.
- Planning artifacts keep `Insert` and `Copy`, but not `Delete`.

## Backend Notes

- No new migration is required for this slice.
- Artifact normalization happens in `/api/artifacts/[storyId]`.
- Planning artifacts are derived from `story_bibles`.
- Missing planning sections still appear as draft artifacts so users can start
  writing into them immediately.

## Next Extension Path

If artifacts continue to grow, the next likely additions are:

- project brief
- arc doc
- research note
- export package

Do not introduce a generalized `project_artifacts` table until at least one
more non-adaptation family exists beyond story-bible planning docs.
