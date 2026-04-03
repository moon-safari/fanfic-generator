# Adaptation Artifacts Design

> Persist the first adaptation pipeline so outputs become project artifacts instead of temporary client state.

## Goal

Turn chapter adaptations into reusable project assets.

The first `Adapt` slice proved that one chapter can transform into multiple formats.

This follow-on slice makes those outputs durable.

## Why This Matters

Without persistence, adaptation behaves like a demo:

- generate output
- copy it somewhere
- lose it on refresh or chapter switch

With persistence, adaptation starts to behave like operating-system infrastructure:

- outputs stay attached to the project
- outputs can be revisited later
- regeneration updates a stable artifact instead of creating disposable text

## Scope

Introduce `adaptation_outputs` as a per-chapter artifact store.

Each chapter can keep one current output per format:

- `short_summary`
- `newsletter_recap`
- `screenplay_beat_sheet`
- `public_teaser`

## Data Model

Table:

- `adaptation_outputs`

Columns:

- `story_id`
- `chapter_id`
- `chapter_number`
- `output_type`
- `content`
- `context_source`
- `created_at`
- `updated_at`

Constraint:

- unique on `(story_id, chapter_id, output_type)`

This keeps the model simple:

- first version of project artifacts
- one stable artifact per chapter/format pair
- regeneration acts like overwrite/update, not uncontrolled version sprawl

## API

New route:

- `GET /api/adapt/[storyId]/outputs?chapterId=...`

Updated route:

- `POST /api/adapt/chapter`

Behavior:

- generate adaptation
- upsert it into `adaptation_outputs`
- return the saved artifact when persistence succeeds
- fall back gracefully to session-only result if persistence is unavailable

## Frontend

`useChapterAdaptation` now:

- fetches saved outputs whenever the chapter changes
- hydrates the `Adapt` tab from persisted artifacts
- continues to cache outputs client-side for the active session

`AdaptTab` now shows:

- whether an output is saved
- last updated timestamp
- whether the current result is only session-local

## Non-Goals

Not included yet:

- multiple saved versions per format
- artifact deletion
- artifact naming
- cross-chapter adaptation collections
- chainable output workflows

## Likely Next Steps

- add artifact deletion and version history
- let adaptation outputs appear in a future project graph
- build the first chained workflow, such as:
  - chapter -> newsletter recap -> public teaser

