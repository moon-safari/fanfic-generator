# Codex — Design Spec (Phase 1: Data Model + UI Panel)

**Goal:** Replace the flat Story Bible with a structured, relational knowledge database ("Codex") that tracks characters, locations, lore, objects, factions, events, and custom entry types — with relationships between entries, chapter-scoped progressions, and AI context injection into generation prompts.

**Scope:** Phase 1 covers the data model, Supabase tables, CRUD API routes, side panel Codex tab UI (replacing the Bible tab), AI context injection into prompts, and auto-generation of initial entries from Chapter 1. Future phases will add: smart name detection in the editor, ongoing auto-extraction after every chapter, full-screen Codex mode, and fandom pre-population.

**Genre-agnostic:** The Codex is designed to work across all writing modes — fiction, non-fiction, screenplays, game writing, academic, fanfic, and more. Entry types and fields are flexible enough to serve any long-form writing project.

---

## Data Model

### Entries

Each Codex entry represents a single knowledge item (a character, a location, a concept, etc.).

**Core fields (all entries):**
- `id` — UUID primary key
- `story_id` — FK to stories table
- `name` — display name (required)
- `entry_type` — one of the core types or a custom type string
- `description` — rich text body (main content)
- `tags` — text array for filtering/grouping
- `image_url` — optional thumbnail URL
- `custom_fields` — JSONB array of `{ key: string, value: string }` pairs
- `sort_order` — integer for manual ordering within type groups
- `created_at`, `updated_at` — timestamps

**Core entry types:** `character`, `location`, `lore`, `object`, `faction`, `event`

Each core type ships with suggested default custom fields:
- **character**: role, personality, appearance, voice, age, occupation
- **location**: climate, significance, era, inhabitants
- **lore**: category (magic system / religion / science / history / custom), scope
- **object**: owner, origin, significance, status
- **faction**: type (organization / family / political / military / custom), leader, goals, size
- **event**: date/chapter, participants, outcome, significance

Users can add, modify, or remove any custom field on any entry.

### Relationships

Bidirectional labeled links between any two entries.

- `id` — UUID primary key
- `story_id` — FK to stories table
- `source_entry_id` — FK to codex_entries
- `target_entry_id` — FK to codex_entries
- `forward_label` — text (e.g., "mentors", "located in", "member of")
- `reverse_label` — text (e.g., "mentored by", "contains", "has member")
- `created_at` — timestamp

When displaying relationships on an entry, show forward labels for outgoing links and reverse labels for incoming links. Both labels are freeform text with type-pair suggestions:
- Character ↔ Character: ally/rival, family, romantic, mentor/mentored by
- Character ↔ Faction: member/has member, leader/led by, enemy/opposed by
- Character ↔ Location: resides in/home of, born in/birthplace of
- Location ↔ Location: contains/inside, adjacent to/adjacent to
- Object ↔ Character: belongs to/owns, created by/created

### Progressions

Chapter-scoped overrides that capture how an entry evolves over time.

- `id` — UUID primary key
- `entry_id` — FK to codex_entries
- `chapter_number` — integer (which chapter this override applies from)
- `field_overrides` — JSONB object of `{ fieldKey: newValue }` pairs
- `description_override` — optional text (appends to or replaces description for this chapter range)
- `notes` — optional text (author notes about what changed and why)
- `created_at` — timestamp

**Resolution algorithm:** To compute an entry's state at Chapter N:
1. Start with the base entry fields
2. Apply all progressions where `chapter_number <= N`, in ascending chapter order
3. Each progression's `field_overrides` merge into the running state (later overrides win)
4. If `description_override` is set, it replaces the base description for that chapter range

### Custom Types

User-defined entry types stored per-story.

- `id` — UUID primary key
- `story_id` — FK to stories table
- `name` — display name (e.g., "Source", "Quest", "Species")
- `color` — hex color for UI badges
- `icon` — emoji or icon identifier
- `suggested_fields` — JSONB array of `{ key: string, placeholder: string }` pairs
- `created_at` — timestamp

When a user creates an entry with a custom type, the suggested fields pre-populate the custom fields — same pattern as core types.

---

## Database Schema

4 new tables in Supabase:

```sql
CREATE TABLE codex_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  custom_fields JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE codex_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  source_entry_id UUID NOT NULL REFERENCES codex_entries(id) ON DELETE CASCADE,
  target_entry_id UUID NOT NULL REFERENCES codex_entries(id) ON DELETE CASCADE,
  forward_label TEXT NOT NULL DEFAULT '',
  reverse_label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_entry_id, target_entry_id)
);

CREATE TABLE codex_progressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES codex_entries(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  field_overrides JSONB NOT NULL DEFAULT '{}',
  description_override TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, chapter_number)
);

CREATE TABLE codex_custom_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  icon TEXT NOT NULL DEFAULT '📋',
  suggested_fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, name)
);
```

All tables get RLS policies enforcing user ownership through the stories table join. Indexes on `codex_entries(story_id, entry_type)` and `codex_progressions(entry_id, chapter_number)`.

---

## API Routes

### `/api/codex/[storyId]` — GET

Fetch all Codex entries for a story, with relationships and progressions.

Returns:
```typescript
{
  entries: CodexEntry[];
  relationships: CodexRelationship[];
  customTypes: CodexCustomType[];
}
```

Progressions are nested inside each entry (fetched via a join or separate query).

### `/api/codex/[storyId]/entries` — POST

Create a new entry. Accepts `{ name, entryType, description, tags, customFields }`. Returns the created entry.

### `/api/codex/[storyId]/entries/[entryId]` — PUT

Update an entry. Accepts partial updates (any combination of fields). Debounced from the UI.

### `/api/codex/[storyId]/entries/[entryId]` — DELETE

Delete an entry. Cascades to its relationships and progressions.

### `/api/codex/[storyId]/relationships` — POST

Create a relationship. Accepts `{ sourceEntryId, targetEntryId, forwardLabel, reverseLabel }`.

### `/api/codex/[storyId]/relationships/[relationshipId]` — DELETE

Delete a relationship.

### `/api/codex/[storyId]/entries/[entryId]/progressions` — POST

Add a progression to an entry. Accepts `{ chapterNumber, fieldOverrides, descriptionOverride, notes }`.

### `/api/codex/[storyId]/entries/[entryId]/progressions/[progressionId]` — PUT / DELETE

Update or delete a progression.

### `/api/codex/[storyId]/custom-types` — POST

Create a custom type. Accepts `{ name, color, icon, suggestedFields }`.

### `/api/codex/generate` — POST

Auto-generate initial Codex entries from Chapter 1. Accepts `{ storyId }`.

1. Fetches Chapter 1 content from DB
2. Optionally enriches prompt with fandom context (if story has a fandom)
3. Calls Claude Haiku with an extraction prompt requesting structured JSON
4. Parses response into entries and relationships
5. Bulk inserts into `codex_entries` and `codex_relationships`
6. Skips entries whose names already exist for this story (idempotent)
7. Returns `{ entries, relationships }` created

---

## Side Panel Codex Tab

Replaces the "Bible" tab in the side panel. The tab label changes from "Bible" (📖) to "Codex" (🧬).

### Entry List View (default)

- **Search bar** at top — filters entries by name and tags across all types
- **Type sections** — collapsible groups, one per type that has entries. Header shows type icon + name + count (e.g., "👤 Characters (4)")
- **Entry rows** — each shows: optional thumbnail, entry name, first ~50 chars of description, truncated. Click to open detail view.
- **Add button** per section — "+" icon in section header, creates new entry of that type
- **Add custom type button** — at bottom of the list, "Add type..." opens an inline form

### Entry Detail View

Navigated to by clicking an entry in the list. Shows:

- **Back arrow** — returns to list view
- **Name** — large, editable inline
- **Type badge** — colored pill showing entry type
- **Tags** — editable tag chips with "Add tag" input
- **Image** — placeholder area (future: upload/generate). Not functional in Phase 1.
- **Description** — rich text editor (can reuse Tiptap for consistency, or a simpler textarea for Phase 1)
- **Custom fields** — list of key-value rows, each editable. "Add field" button at bottom.
- **Relationships** — list of linked entries with labels. Each row shows: linked entry name (clickable, navigates to that entry), label text. "Add relationship" button opens an entry picker dropdown with label inputs.
- **Progressions** — collapsed section. When expanded, shows a timeline of chapter overrides sorted by chapter number. Each row: "Ch. N" badge, changed fields summary, notes. "Add progression" button opens inline form with chapter number input and field override inputs.

### New Entry Form

Triggered by the "+" button on a type section:
- Name input (autofocused)
- Type selector (pre-filled if created from a type section)
- Description textarea
- Suggested custom fields pre-populated based on type (editable)
- Save button creates the entry and navigates to detail view

### Editing Behavior

- All edits are inline (no modals)
- Changes debounced at 1000ms before saving to server (same pattern as current Bible editors)
- Optimistic UI updates — changes appear immediately, save happens in background

---

## AI Context Injection

### `formatCodexForPrompt(entries, relationships, chapterNumber)`

Replaces `formatBibleForPrompt`. Computes resolved entry states at the target chapter number, then formats as structured markdown:

```
## Codex

### Characters
**Alice** [protagonist]
- Personality: Fierce, protective
- Allegiance: Rebels [changed Ch.8]
- Status: Injured, missing left hand [changed Ch.12]
- Voice: Clipped sentences, military jargon
- Relationships: Rival of Bob, Mentored by Clara, Member of Shadow Guild

### Locations
**The Citadel**
- Climate: Arctic
- Significance: Rebel headquarters since Ch.8
- Relationships: Contains The Vault, Adjacent to Frozen Wastes

### Lore
**The Binding Oath**
- Category: Magic system
- Description: An unbreakable magical contract...
```

**Progression markers:** When a field was changed by a progression, the formatted output includes `[changed Ch.N]` to help the AI understand the timeline.

**Relationship inclusion:** Each entry's relationships are listed inline as "Relationships: ..." to give the AI the full picture.

### Integration

In `buildContinuationPrompt` (in `src/app/lib/prompts/index.ts`), replace the `bibleContext` parameter with `codexContext`. The `continue-chapter` API route fetches Codex entries instead of Bible sections and calls `formatCodexForPrompt` with the target chapter number.

---

## Auto-Generation from Chapter 1

### Endpoint: `POST /api/codex/generate`

**Prompt to Claude Haiku:**

> You are a story analyst. Analyze this chapter and extract a structured codex of story elements. Return a JSON object with:
> - `entries`: array of `{ name, type, description, fields: { key: value }, tags: [] }`
>   - type must be one of: character, location, lore, object, faction, event
>   - For characters, include fields: role, personality, appearance, voice (if inferrable)
>   - For locations, include fields: climate, significance (if inferrable)
> - `relationships`: array of `{ source, target, forwardLabel, reverseLabel }`
>   - source and target are entry names (matched by name after insertion)
>
> Only extract elements that are clearly present in the text. Do not invent.

**Trigger:** Called by `StoryEditor` in the streaming `onDone` handler, replacing the current `story-bible/generate` call.

**Fandom enrichment:** If the story has a fandom, prepend fandom context to the extraction prompt (same `getFandomContext()` used today). This helps the AI identify canon characters and apply correct traits.

**Idempotency:** If entries already exist for this story (user ran generate twice), skip entries whose names match existing entries. This prevents duplicates.

---

## Migration & Backward Compatibility

- The `story_bibles` table and API routes remain — no destructive changes.
- The side panel swaps the Bible tab for the Codex tab.
- `formatBibleForPrompt` is replaced by `formatCodexForPrompt` in the continuation prompt builder.
- For existing stories with a Bible but no Codex entries: the Codex tab shows an empty state with a "Generate from Chapter 1" button.
- Future cleanup: remove Bible code and table once Codex is stable.

---

## TypeScript Types

```typescript
// src/app/types/codex.ts

export type CoreEntryType = "character" | "location" | "lore" | "object" | "faction" | "event";

export interface CustomField {
  key: string;
  value: string;
}

export interface CodexEntry {
  id: string;
  storyId: string;
  name: string;
  entryType: CoreEntryType | string; // string for custom types
  description: string;
  tags: string[];
  imageUrl?: string;
  customFields: CustomField[];
  sortOrder: number;
  progressions: CodexProgression[];
  createdAt: string;
  updatedAt: string;
}

export interface CodexRelationship {
  id: string;
  storyId: string;
  sourceEntryId: string;
  targetEntryId: string;
  forwardLabel: string;
  reverseLabel: string;
  createdAt: string;
}

export interface CodexProgression {
  id: string;
  entryId: string;
  chapterNumber: number;
  fieldOverrides: Record<string, string>;
  descriptionOverride?: string;
  notes?: string;
  createdAt: string;
}

export interface CodexCustomType {
  id: string;
  storyId: string;
  name: string;
  color: string;
  icon: string;
  suggestedFields: { key: string; placeholder: string }[];
  createdAt: string;
}

export interface Codex {
  entries: CodexEntry[];
  relationships: CodexRelationship[];
  customTypes: CodexCustomType[];
}
```

---

## Files Changed / Created

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/types/codex.ts` | Create | TypeScript types for Codex |
| `src/app/lib/supabase/codex.ts` | Create | Supabase CRUD helpers for Codex |
| `src/app/lib/prompts/codex.ts` | Create | `formatCodexForPrompt` + extraction prompt |
| `src/app/api/codex/[storyId]/route.ts` | Create | GET all entries |
| `src/app/api/codex/[storyId]/entries/route.ts` | Create | POST new entry |
| `src/app/api/codex/[storyId]/entries/[entryId]/route.ts` | Create | PUT/DELETE entry |
| `src/app/api/codex/[storyId]/relationships/route.ts` | Create | POST relationship |
| `src/app/api/codex/[storyId]/relationships/[relationshipId]/route.ts` | Create | DELETE relationship |
| `src/app/api/codex/[storyId]/entries/[entryId]/progressions/route.ts` | Create | POST progression |
| `src/app/api/codex/[storyId]/entries/[entryId]/progressions/[progressionId]/route.ts` | Create | PUT/DELETE progression |
| `src/app/api/codex/[storyId]/custom-types/route.ts` | Create | POST custom type |
| `src/app/api/codex/generate/route.ts` | Create | Auto-generate entries from Chapter 1 |
| `src/app/components/codex/CodexPanel.tsx` | Create | Main Codex tab panel (list + detail views) |
| `src/app/components/codex/EntryList.tsx` | Create | Entry list view with type grouping |
| `src/app/components/codex/EntryDetail.tsx` | Create | Entry detail/edit view |
| `src/app/components/codex/EntryForm.tsx` | Create | New entry creation form |
| `src/app/components/codex/RelationshipEditor.tsx` | Create | Add/view/remove relationships |
| `src/app/components/codex/ProgressionEditor.tsx` | Create | Add/view/edit progressions |
| `src/app/components/codex/CustomFieldEditor.tsx` | Create | Edit custom fields on entries |
| `src/app/hooks/useCodex.ts` | Create | React hook for Codex state management + API calls |
| `src/app/components/editor/SidePanel.tsx` | Modify | Swap Bible tab for Codex tab |
| `src/app/components/editor/StoryEditor.tsx` | Modify | Replace bible generation trigger with codex generation |
| `src/app/api/continue-chapter/route.ts` | Modify | Fetch Codex instead of Bible, use `formatCodexForPrompt` |
| `src/app/lib/prompts/index.ts` | Modify | Replace `bibleContext` param with `codexContext` |

---

## Out of Scope (Future Sub-Projects)

- **Smart name detection** — Tiptap extension highlighting Codex entry names inline with preview cards
- **Ongoing auto-extraction** — AI scans each new chapter and suggests new entries/updates
- **Full-screen Codex mode** — dedicated view for deep world-building sessions
- **Fandom pre-population** — seeding Codex from fandom database for fanfic mode
- **Relationship graph visualization** — visual map of entry connections
- **Appearance heatmap** — which characters appear together and how often
- **Series support** — shared Codex entries across multiple stories
- **Image upload/generation** — AI-generated thumbnails for entries
- **Token budget management** — showing how much context Codex entries consume
