# Artifact Library Design

> First project-level library for saved outputs generated from the writing workspace.

## Goal

Make saved adaptation outputs feel like first-class project assets instead of
temporary results hidden inside the `Adapt` tab.

## Phase 1 Scope

Use the existing `adaptation_outputs` table as the storage layer.

Do not introduce a generalized `project_artifacts` table yet.

Instead:

- add a normalized `/api/artifacts/[storyId]` read route
- normalize adaptation outputs into a shared artifact shape
- build an `Artifacts` tab in the editor side panel
- allow filtering, previewing, copying, inserting, deleting, and opening in `Adapt`

## Why This Order

This keeps the system:

- backend-first
- security-first
- incremental
- easy to extend later

It also avoids premature schema generalization before we have a second artifact
family besides adaptation outputs.

## Artifact Shape

Phase 1 normalized artifact fields:

- `id`
- `kind`
- `subtype`
- `storyId`
- `chapterId`
- `chapterNumber`
- `title`
- `description`
- `content`
- `contextSource`
- `createdAt`
- `updatedAt`

Current `kind` values:

- `adaptation`

## UX

The `Artifacts` tab should feel like a small project browser.

### Filters

- by format
- by chapter
- with explicit filter chips, not hidden selects

### Artifact actions

- copy
- insert into editor
- delete
- open in `Adapt`

### Important connection

`Open in Adapt` should jump to the correct chapter and corresponding adaptation
format. This keeps artifacts connected to the live writing workflow.

## Backend Notes

The route must:

- verify authenticated user
- verify story ownership
- fetch adaptation outputs through existing helpers
- return normalized artifact objects

Deletion stays on the existing adaptation delete route for now.

## Future Direction

Once another real artifact family exists, we can revisit whether to introduce a
generalized `project_artifacts` table.

Likely future artifact families:

- outlines
- dossiers
- briefs
- research notes
- exports

At that point, the normalized API introduced here becomes the bridge to a more
general artifact layer without breaking the first implementation.
