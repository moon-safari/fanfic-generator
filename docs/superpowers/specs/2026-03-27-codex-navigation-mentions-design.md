# Codex Navigation + Mentions Design

## Why This Slice

The current Codex foundation is strong on CRUD, generation, and change suggestions, but it still feels closer to a structured admin panel than a living story system.

This slice makes the Codex feel embedded in writing by doing two things together:

1. Make the Codex browseable.
2. Make the manuscript aware of Codex entries.

Those two pieces should ship together so the user can move fluidly between draft text and project knowledge.

## Goals

- Add deterministic mention tracking for Codex entries per chapter.
- Highlight tracked mentions directly inside the editor.
- Let a clicked manuscript mention open the matching Codex entry.
- Upgrade the Codex panel with search, collapsible categories, and richer entry navigation.
- Show mention history inside entry detail so the Codex starts to feel manuscript-connected.

## Non-Goals

- No AI mention extraction in this slice.
- No graph view yet.
- No alias auto-suggestion beyond the existing change suggestion pipeline.
- No full timeline view yet.

## Product Shape

### Entry List

- Search field at the top of the list.
- Collapsible category groups with counts.
- Entry rows remain single-click selectable.
- Entry rows show chapter-aware state and current-chapter mention counts when relevant.

### Entry Detail

- The resolved "current chapter truth" stays the top card.
- Relationships become navigable; clicking a linked entry jumps to it.
- A new mention section shows:
  - current chapter mention count
  - total appearances across the story
  - chapter badges for where the entry appears
  - surface forms detected in the current chapter

### Editor

- Current chapter Codex mentions are highlighted with lightweight inline decoration.
- Clicking a mention opens the Codex tab and focuses the matching entry.
- Mention sync should never silently block writing. Failed indexing is non-fatal.

## Data Model

Add `codex_mentions`:

- `story_id`
- `chapter_id`
- `chapter_number`
- `entry_id`
- `matched_text`
- `matched_alias`
- `start_index`
- `end_index`

This stores deterministic, chapter-scoped matches.

## Mention Detection Rules

Deterministic matching only:

- use the resolved entry name at the target chapter
- include base aliases
- case-insensitive
- boundary-aware
- longest phrase wins
- overlapping matches are rejected
- ambiguous aliases shared by multiple entries are skipped

This keeps the system explainable and stable.

## API

- `GET /api/codex/[storyId]/mentions`
  - optional `chapterId`
  - optional `entryId`
- `POST /api/codex/mentions/generate`
  - body: `{ storyId, chapterId }`
  - regenerates mentions for a single chapter

## Integration Points

- Run mention generation in the chapter post-processing pipeline after summary generation.
- Expose manual "Sync mentions" from the Codex panel for existing chapters and debugging.
- Seed mentions into the Codex showcase story so the demo feels closer to the intended future state.

## Success Criteria

- A chapter with clear entity mentions produces stored Codex mentions.
- The editor highlights those mentions.
- Clicking a highlight opens the matching entry in Codex.
- The Codex entry list feels navigable rather than flat.
- Entry detail shows manuscript-connected evidence, not just metadata.
