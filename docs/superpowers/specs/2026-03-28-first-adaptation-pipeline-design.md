# First Adaptation Pipeline Design

> The first chapter-based adaptation slice for the writing OS.

## Goal

Prove that one story artifact can transform into multiple outputs while preserving project identity and Codex-backed truth.

This is the first practical step from:

- drafting tool

to:

- writing operating system

## Scope

This slice introduces a new `Adapt` tab in the editor side panel and a single backend route for chapter-based transformations.

Supported outputs:

- `short_summary`
- `newsletter_recap`
- `screenplay_beat_sheet`
- `public_teaser`

## Product Rationale

The system already has:

- chapter drafts
- chapter summaries
- Codex-first story context
- visible context steering

The missing step is transformation.

This slice proves that one saved chapter can travel into adjacent writing formats without losing continuity.

## UX

The user opens the story editor, switches to `Adapt`, picks a format, and generates an alternate output for the current chapter.

The result should:

- clearly identify the format
- show whether Codex or Story Bible powered the context
- be easy to copy
- optionally be insertable back into the editor

## Backend

Route:

- `POST /api/adapt/chapter`

Request body:

```json
{
  "storyId": "uuid",
  "chapterId": "uuid",
  "outputType": "screenplay_beat_sheet"
}
```

Backend responsibilities:

- authenticate the user
- verify story ownership
- fetch the target chapter
- resolve Codex-first story context for that chapter
- build a format-specific adaptation prompt
- return the adapted text plus context source metadata

## Frontend

New pieces:

- `src/app/hooks/useChapterAdaptation.ts`
- `src/app/components/editor/AdaptTab.tsx`

The hook owns:

- selected format
- cached results per format
- loading state
- error state

The tab owns:

- format picker
- generate / regenerate flow
- result display
- copy / insert actions

## Data Model

No persistence is added in this slice.

Results are currently session-local UI state.

That is intentional for the first pass, because the product question is whether the transformation workflow feels valuable before we add history, project outputs, or adaptation assets.

## Non-Goals

Not in scope yet:

- adaptation history or saved outputs
- project-level workflow presets
- world-to-game-design dossier flows
- outline-to-screenplay flows
- social packaging chains
- adaptation chaining across multiple steps

## Future Extensions

Natural next steps after this slice:

- save adaptation outputs as project artifacts
- add one-click chains like `chapter -> recap -> teaser`
- add outline-based screenplay adaptation
- add world-guide to game-design dossier
- make adaptation outputs part of the broader project graph

