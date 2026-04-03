# Living Change Detection Design

> Make the Codex aware of how the story evolves, then turn that awareness into useful, reviewable suggestions.

Use this together with:

- `docs/superpowers/specs/2026-03-25-codex-design.md`
- `docs/superpowers/specs/2026-03-27-codex-product-strategy.md`
- `docs/superpowers/specs/2026-03-27-writing-os-product-moves.md`

---

## Goal

Turn the Codex from a manually maintained database into a living system that:

- notices when the story changes
- suggests structured Codex updates
- helps the user keep project truth current
- improves continuity and future generation quality

This is one of the earliest product moves that makes the app feel like a writing OS instead of a writing app with a wiki.

---

## Core Product Promise

After a new chapter is written, the product should be able to say:

- "these three new entities appeared"
- "this relationship changed"
- "this character's status is different now"
- "this existing Codex entry may be stale"
- "here are suggested updates you can review and apply"

The product should not silently rewrite the Codex.

The right default is:

**AI suggests, writer confirms.**

---

## Why This Matters

Without change detection:

- the Codex becomes manual labor
- entries go stale
- progressions get skipped
- continuity becomes weaker over time
- the product loses trust as the project grows

With change detection:

- the Codex stays alive
- story truth remains current
- continuity gets stronger
- AI context improves over time
- the product begins to feel operational, not static

---

## Current Repo Opportunity

The repo already has a post-chapter pipeline in [StoryEditor.tsx](c:\Users\Lenovo\Desktop\fanfic-generator\src\app\components\editor\StoryEditor.tsx):

- save chapter
- generate chapter summary
- run continuity check

This gives us a natural insertion point for living change detection.

The recommended pipeline becomes:

1. chapter saved
2. summary generated
3. Codex change detection runs
4. continuity check runs
5. pending Codex suggestions surface in the editor

This keeps the workflow aligned with what already exists.

---

## What Should Be Detected

Living change detection should focus on structured deltas, not vague observations.

## Category 1: New entity detection

Examples:

- new character introduced
- new location introduced
- new object, faction, event, or lore concept introduced

Suggested outputs:

- create new Codex entry
- attach aliases if present
- attach likely type and starter description

## Category 2: Relationship change detection

Examples:

- alliance formed
- betrayal occurred
- family tie revealed
- ownership changed
- membership changed

Suggested outputs:

- create relationship
- update relationship labels
- flag that an old relationship may no longer be accurate

## Category 3: Progression detection

Examples:

- character injury
- title or role change
- status change
- location condition change
- object ownership shift
- faction goal shift

Suggested outputs:

- create progression on an existing entry
- add field overrides
- add description override

## Category 4: Alias and identity detection

Examples:

- title reveal
- nickname introduced
- secret identity connected
- alternate names used by different groups

Suggested outputs:

- add alias to entry
- flag identity ambiguity for review

## Category 5: Stale fact detection

Examples:

- Codex says a character is uninvolved, but Chapter 9 clearly changes that
- Codex says a relationship exists in one way, but the chapter shows the opposite
- entry description no longer matches current truth

Suggested outputs:

- mark entry for review
- suggest progression instead of base-entry rewrite
- suggest "this may now be outdated"

---

## What Should Not Be Detected Yet

To keep the first version trustworthy, avoid overreaching.

Do not initially try to detect:

- deep thematic meaning
- subtle emotional subtext unless strongly stated
- every implied relationship nuance
- literary interpretation
- voice drift
- abstract symbolism

V1 should optimize for:

- grounded
- reviewable
- low-noise
- structurally useful

---

## Suggestion Model

The right mental model is:

**one suggestion = one reviewable proposed change**

Examples:

- "Create entry: Theo Nott"
- "Add alias: The Dark Lord -> Voldemort"
- "Add progression: Daphne status changed in Chapter 6"
- "Create relationship: Hermione mentors Luna"

Each suggestion should include:

- suggestion id
- story id
- chapter id
- change type
- target entry id if applicable
- structured payload
- evidence snippet from chapter text
- explanation / rationale
- confidence level
- status

### Suggested statuses

- `pending`
- `accepted`
- `rejected`
- `applied`
- `expired`

Recommended first version:

- `pending`
- `accepted`
- `rejected`
- `applied`

---

## Suggested Change Types

Recommended first set:

- `create_entry`
- `update_entry_aliases`
- `create_relationship`
- `update_relationship`
- `create_progression`
- `flag_stale_entry`

Potential later additions:

- `merge_entries`
- `split_identity`
- `retire_relationship`
- `promote_custom_type`

---

## Data Model Recommendation

Do not overload `chapter_annotations` for this.

Continuity annotations and Codex change suggestions are related, but they are not the same thing.

Recommended new table:

### `codex_change_suggestions`

Suggested columns:

- `id uuid primary key`
- `story_id uuid not null`
- `chapter_id uuid not null`
- `target_entry_id uuid null`
- `change_type text not null`
- `payload jsonb not null`
- `evidence_text text`
- `rationale text`
- `confidence numeric or text`
- `status text not null default 'pending'`
- `created_at timestamptz not null default now()`
- `reviewed_at timestamptz null`
- `applied_at timestamptz null`

Suggested indexes:

- by `story_id`
- by `chapter_id`
- by `status`
- by `target_entry_id`

Suggested RLS:

- same ownership pattern as stories / codex tables

---

## Payload Shape

Payload should stay structured enough for direct application.

Examples:

### `create_entry`

```json
{
  "name": "Theo Nott",
  "entryType": "character",
  "description": "Slytherin student newly introduced at the meeting.",
  "aliases": [],
  "tags": ["hogwarts", "slytherin"],
  "customFields": [
    { "key": "role", "value": "student" }
  ]
}
```

### `create_progression`

```json
{
  "entryId": "existing-entry-id",
  "chapterNumber": 6,
  "descriptionOverride": "Now estranged from her family after the confrontation.",
  "fieldOverrides": {
    "status": "estranged",
    "allegiance": "independent"
  },
  "notes": "Suggested from confrontation in Chapter 6"
}
```

### `create_relationship`

```json
{
  "sourceEntryId": "entry-a",
  "targetEntryId": "entry-b",
  "forwardLabel": "mentors",
  "reverseLabel": "mentored by"
}
```

---

## UX Model

The UI should make this feel like helpful review, not like a backlog.

## Primary surface

Add a `Updates` or `Suggestions` area inside the Codex panel.

Recommended placement:

- inside the Codex panel header as a pending count
- a toggle between `Entries` and `Updates`

Alternative:

- keep list/detail for entries and add a collapsible `Pending updates` section at the top

### What each suggestion card shows

- suggestion type label
- proposed action
- target entry if relevant
- evidence snippet
- rationale
- confidence
- actions: `Accept`, `Reject`, `Open target`

### Acceptance behavior

On accept:

- apply the structured Codex mutation
- update suggestion status to `applied`
- refresh Codex data

On reject:

- keep history
- mark suggestion as `rejected`

### Important UX principle

Accepting a suggestion should feel fast and safe.

Users should not have to manually reconstruct the change.

---

## Detection Pipeline

Recommended first backend flow:

### 1. Gather context

- new chapter content
- chapter number
- chapter summary if available
- existing Codex
- resolved Codex truth at the new chapter number
- recent chapter summaries for short-term continuity context

### 2. Ask the model for structured deltas

Prompt the model to return only grounded, explicit, structured changes in JSON.

Output buckets:

- new entries
- relationship changes
- progression suggestions
- alias suggestions
- stale fact flags

### 3. Normalize and dedupe

Before storing:

- skip obvious duplicate entry names
- skip duplicate relationship suggestions
- skip duplicate progression suggestions for same entry/chapter/field
- collapse repeated aliases

### 4. Store suggestions

Write pending suggestions to `codex_change_suggestions`

### 5. Surface results

- update Codex panel pending count
- optionally show a subtle "3 Codex updates detected" toast

---

## API Recommendation

Recommended first endpoints:

### `POST /api/codex/suggestions/generate`

Input:

- `storyId`
- `chapterId`

Behavior:

- runs detection
- stores new pending suggestions
- returns pending suggestions for that chapter

### `GET /api/codex/[storyId]/suggestions`

Query options:

- `status`
- `chapterId`

Returns:

- pending and/or historical suggestions

### `POST /api/codex/suggestions/[id]/accept`

Behavior:

- applies the Codex mutation
- updates suggestion status
- returns updated Codex objects

### `POST /api/codex/suggestions/[id]/reject`

Behavior:

- marks suggestion rejected

Potential later endpoint:

### `POST /api/codex/suggestions/bulk-accept`

Only after trust is high enough.

---

## Prompt Design Principle

The model should not be asked for general commentary.

It should be asked for:

- explicit structured changes
- only if directly supported by the text
- with evidence snippets
- with confidence

This needs a stricter prompt than the continuity checker.

The model should prefer omission over hallucination.

---

## Rollout Strategy

### Phase 1

- detect new entries
- detect aliases
- detect progressions
- store suggestions
- manual accept/reject UI

This is the safest and highest-value start.

### Phase 2

- detect relationship changes
- detect stale entries
- add better dedupe and confidence scoring

### Phase 3

- tie suggestions into continuity system
- suggest Codex updates directly from continuity findings
- add bulk review and better historical views

### Phase 4

- use accepted suggestions to improve future detection heuristics
- add per-project sensitivity settings

---

## Integration With Continuity

Living change detection and continuity should reinforce each other.

Examples:

- continuity checker finds contradiction -> open related Codex suggestion
- accepted progression reduces future false continuity flags
- stale entry flag can trigger a continuity review

But they should remain separate systems:

- continuity answers "is this inconsistent?"
- change detection answers "what should the Codex learn from this?"

---

## Success Criteria

V1 is successful if:

- users regularly accept suggestions
- accepted suggestions reduce manual Codex upkeep
- Codex stays current longer across multi-chapter stories
- continuity quality improves because Codex is fresher
- users feel the system is helping, not nagging

Bad signs:

- users ignore most suggestions
- suggestion quality is noisy
- accepted suggestions frequently need manual repair
- suggestion UI feels like admin overhead

---

## Recommended Build Order

1. migration for `codex_change_suggestions`
2. shared types for suggestion objects
3. prompt builder + parser for Codex deltas
4. detection route
5. accept/reject routes
6. Codex panel suggestion UI
7. hook into post-chapter pipeline
8. integrate with continuity later

---

## Repo Implication

This is the cleanest next "OS" feature after the current Codex work because it builds directly on:

- Codex
- chapter flow
- summaries
- continuity
- editor side panel

It does not require a brand new product surface.

It makes the existing surface smarter.

That is exactly the kind of move that makes the product feel more like a real operating system.

