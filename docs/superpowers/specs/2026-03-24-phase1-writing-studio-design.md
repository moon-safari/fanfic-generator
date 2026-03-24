# Phase 1: Writing Studio Foundation — Design Spec

> Transform "click generate and read" into a craft-focused writing environment with Story Bible, rich editor, inline tools, and continuity tracking.

## Context

The app currently generates fanfic chapters via a form (fandom, characters, tone, tropes) and displays them in a read-only viewer. Users can continue stories chapter-by-chapter. There is no editing, no reference system, and no writing assistance beyond generation.

Phase 1 adds four capabilities: Story Bible (persistent story context), Rich Text Editor (editable chapters), Craft Tools (AI-powered inline editing), and Continuity Engine (contradiction detection).

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Story Bible scope | Per-story | Simpler mental model. Hybrid (shared + per-story) deferred to later. |
| Story Bible sections | 7: Characters, World, Synopsis, Genre, Style Guide, Outline, Notes | Covers Sudowrite-level depth without overwhelming. |
| Editor layout | Full-screen editor + slide-over Bible (Option C) | Immersive writing. Bible on-demand. Works on mobile as full-screen overlay. |
| Craft tools UX | Floating toolbar (desktop) + bottom drawer (mobile) | Floating toolbar keeps writer in flow. Bottom drawer gives mobile tap targets. |
| Story Bible auto-fill | Generate after Chapter 1 | Lower friction to start. AI has actual content to reference. |
| Continuity engine | Inline annotations (non-blocking) | Informational only. Doesn't add latency to the "Continue" addiction loop. |

---

## 1. Story Bible

### 1.1 Data Model

Each story has one Bible, stored as rows in `story_bibles`:

```
story_bibles
├── id (uuid, PK)
├── story_id (uuid, FK → stories)
├── section_type (enum: characters, world, synopsis, genre, style_guide, outline, notes)
├── content (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

UNIQUE constraint on `(story_id, section_type)` — one row per section per story.

RLS: Users can only read/write Bible entries for stories they own.

### 1.2 Section Schemas

**Characters** (`content` JSONB):
```json
{
  "characters": [
    {
      "name": "Draco Malfoy",
      "role": "protagonist",
      "personality": "Sharp-tongued, conflicted, proud but vulnerable",
      "appearance": "Pale, pointed features, platinum blond hair",
      "relationships": [
        { "character": "Harry Potter", "type": "rival → lover" }
      ],
      "voiceNotes": "Formal speech, occasional sarcasm, never uses contractions"
    }
  ]
}
```

**World** (`content` JSONB):
```json
{
  "setting": "Hogwarts School of Witchcraft and Wizardry, 8th year",
  "rules": ["Magic requires wands", "No technology works at Hogwarts"],
  "locations": ["Great Hall", "Room of Requirement", "Black Lake"],
  "era": "Post-war, 1998-1999",
  "customs": "House system, Quidditch, OWLs/NEWTs"
}
```

**Synopsis**: `{ "text": "One-paragraph summary..." }`

**Genre**: `{ "primary": "Romance", "secondary": ["Drama", "Fantasy"], "warnings": ["Violence", "Explicit Content"] }`

**Style Guide**: `{ "pov": "third-limited", "tense": "past", "proseStyle": "Literary but accessible", "dialogueStyle": "Character-distinct voices", "pacing": "Slow burn" }`

**Outline**: `{ "chapters": [{ "number": 1, "title": "...", "summary": "...", "status": "planned|written|revised" }] }`

**Notes**: `{ "text": "Freeform markdown content..." }`

### 1.3 Auto-Fill Flow

1. User creates story via existing form → Chapter 1 generates (current flow, unchanged)
2. After Chapter 1 saves, client calls `POST /api/story-bible/generate`
3. API sends Chapter 1 + fandom data to Claude Haiku with extraction prompt
4. Haiku returns structured Bible for all 7 sections
5. Bible saves to DB, user sees "Story Bible ready" notification
6. User can review/edit Bible before generating Chapter 2

### 1.4 AI Integration

Every generation call (continue-chapter, craft tools) includes the full Story Bible in the system prompt, structured as:

```
=== STORY BIBLE ===
## Characters
[character data]
## World
[world data]
...
```

**Context budget strategy:** Story Bible (full) + last 2 chapters (full text) + earlier chapters (Haiku-generated summaries, ~2 sentences each). Target: under 50K tokens total. Summaries are generated and cached after each chapter saves (see section 2.3).

### 1.5 Bible Edit Behavior

- Bible edits do **not** trigger automatic continuity re-checks in Phase 1
- A manual "Re-check continuity" button in the Bible panel is sufficient
- "Continue Story" always reads the latest **saved** Bible from DB; pending unsaved Bible edits are flushed before generation

### 1.6 UI: Slide-Over Panel

- **Trigger:** Book icon button in editor header (always visible)
- **Desktop:** Panel slides in from the right, ~35% width, push or overlay (user preference)
- **Mobile:** Full-screen overlay with back button
- **Sections:** Collapsible accordion, one section open at a time
- **Editing:** Inline editing for all fields. Click to edit, blur to save. Autosave with debounce.
- **Visual:** Dark theme (#2a1f3d background), purple accents matching app theme

---

## 2. Rich Text Editor

### 2.1 Technology

**Tiptap** (ProseMirror-based):
- Mature, well-documented, active maintenance
- Built-in extensions for formatting, collaboration, history
- Good mobile support
- JSON document model (stores as JSONB in DB)

### 2.2 Editor Features

- **Basic formatting:** Bold, italic, headings (chapter title), horizontal rules
- **Paragraph operations:** Click paragraph → options menu (regenerate, delete, move)
- **Undo/redo:** Full history stack via Tiptap's built-in history extension
- **Autosave:** Debounced save to Supabase every 3 seconds after last edit
- **Chapter navigation:** Tabs or dropdown above editor to switch chapters
- **Word count:** Live word count in footer
- **Focus mode:** Dim all paragraphs except the one being edited (optional toggle)

### 2.3 Data Storage

Chapters table gets new columns:

```
chapters
├── ... (existing columns)
├── content_json (jsonb, nullable)  -- Tiptap document JSON
└── summary (text, nullable)        -- Haiku-generated 2-sentence summary
```

- `content` (text) remains for backwards compatibility, search, and plain-text exports
- `content_json` is the source of truth when present
- On save, both columns update (JSON → extract plain text via Tiptap's `getText()` for `content`)
- `summary` is generated by Haiku immediately after each chapter saves (~$0.001/call)
- The existing `exportStoryToText()` in `lib/storage.ts` must be updated to extract from `content_json` when present

### 2.4 TypeScript Type Evolution

The current `Story` interface stores chapters as `string[]`. This must evolve:

```typescript
// New Chapter type replaces bare strings
interface Chapter {
  id: string;
  chapterNumber: number;
  content: string;          // plain text (always present)
  contentJson?: object;     // Tiptap document JSON (present after editor save)
  summary?: string;         // Haiku-generated summary
  wordCount: number;
}

// Updated Story type
interface Story {
  id: string;
  title: string;
  chapters: Chapter[];      // was string[]
  // ... rest unchanged
}
```

The `dbToStory()` mapper in `lib/supabase/stories.ts` must be updated to build `Chapter` objects from the DB rows. All consumers of `story.chapters[i]` (currently expecting `string`) must be updated to use `chapter.content` or `chapter.contentJson`.

### 2.5 Layout

### 2.4 Layout

```
┌─────────────────────────────────────────────────┐
│  ← Back   "Chapter 3 of 7"   [📖] [⋮]         │  Header
├─────────────────────────────────────────────────┤
│                                                  │
│  The morning light filtered through the          │
│  stained glass, casting prismatic shadows        │
│  across the stone floor...                       │
│                                                  │
│  [Tiptap editor - full width, immersive]         │
│                                                  │
│                                                  │
├─────────────────────────────────────────────────┤
│  1,247 words            [Continue Story →]       │  Footer
└─────────────────────────────────────────────────┘
```

Mobile: Same layout, header collapses to icons, footer stacks vertically.

---

## 3. Craft Tools

### 3.1 Tool Definitions

| Tool | Model | Input | Output | Speed |
|------|-------|-------|--------|-------|
| **Rewrite** | Haiku (`claude-haiku-4-5-20251001`) | Selected text + direction | Replacement text | ~1-2s |
| **Expand** | Haiku (`claude-haiku-4-5-20251001`) | Selected text (sparse) | Richer version with sensory detail | ~2-3s |
| **Describe** | Haiku (`claude-haiku-4-5-20251001`) | Selected noun/scene | 3-5 alternative descriptions | ~1-2s |
| **Brainstorm** | Sonnet (`claude-sonnet-4-20250514`) | Selected text or cursor position | 5 plot direction options | ~3-5s |

All tools receive the Story Bible + surrounding chapter context (not full chapter history — that's too slow for inline tools).

### 3.2 Rewrite Directions

Pre-defined options the user picks from:
- More tense / More suspenseful
- More poetic / More lyrical
- Shorter / More concise
- More dialogue
- More descriptive
- Change tone to [happy/sad/angry/flirty/dark]
- Custom instruction (free text)

### 3.3 UX Flow

**Desktop (floating toolbar):**
1. User selects text in editor
2. Floating toolbar appears above selection: `[Rewrite ▾] [Expand] [Describe] [Brainstorm]`
3. User clicks tool (Rewrite shows direction picker first)
4. Loading indicator replaces toolbar
5. Result appears as a diff-style preview: original dimmed, suggestion highlighted
6. User clicks Accept (replaces text) or Dismiss (keeps original)

**Mobile (bottom drawer):**
1. User selects text (native selection handles) OR taps a paragraph to select it entirely (fallback for unreliable mobile selection in contenteditable)
2. Bottom drawer slides up with tool buttons in a row
3. Same flow from step 3 onward
4. Drawer dismisses on accept/dismiss

### 3.4 API Routes

All craft tool routes follow the same pattern:

```
POST /api/craft/{tool}
Body: {
  storyId: string,
  selectedText: string,
  context: string,        // surrounding paragraphs
  direction?: string      // for Rewrite only
}
Response: {
  result: string | string[]  // string for rewrite/expand, array for describe/brainstorm
}
```

Server fetches the Story Bible from DB using `storyId`. Client does **not** send Bible in the request body — this prevents stale cache issues when the user edits the Bible and immediately uses a craft tool.

### 3.5 Cost Control

- Haiku tools: ~$0.001/call — negligible
- Brainstorm (Sonnet): ~$0.01/call — track per-user usage
- Client-side debounce: prevent rapid-fire tool calls
- Context window limit: send ~2 paragraphs of surrounding context, not full chapters

---

## 4. Continuity Engine

### 4.1 How It Works

Continuity check runs: (a) after chapter generation completes, and (b) on manual trigger via a "Check continuity" button. It does **not** run on every edit or autosave.

1. Client calls `POST /api/continuity/check` with the chapter content
2. API sends the chapter + Story Bible + previous chapter summaries to Haiku
3. Haiku returns a list of potential contradictions:
   ```json
   {
     "annotations": [
       {
         "text": "blue eyes",
         "issue": "In Chapter 2, this character was described as having green eyes",
         "sourceChapter": 2,
         "severity": "warning"
       }
     ]
   }
   ```
4. Client highlights flagged text with yellow/orange underlines
5. Hover (desktop) or tap (mobile) shows the issue in a tooltip

### 4.2 Data Model

```
chapter_annotations
├── id (uuid, PK)
├── chapter_id (uuid, FK → chapters)
├── text_match (text)         -- the flagged text (used for text-search location in document)
├── annotation_type (enum: continuity_warning, suggestion)
├── message (text)            -- explanation of the issue
├── source_chapter (int, nullable)
├── severity (enum: info, warning, error)
├── dismissed (boolean, default false)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

**Annotation positioning:** Annotations are located in the editor by searching for `text_match` in the document, not by integer offsets. This avoids offset drift when users edit text above an annotation. If `text_match` is no longer found (user deleted or rewrote the text), the annotation is silently discarded on next load.

RLS: Users can only access annotations for their own stories.

### 4.3 UX

- Annotations appear as colored underlines in the Tiptap editor (custom decoration plugin)
- **Yellow underline:** Potential continuity issue (warning)
- **Orange underline:** Likely contradiction (error)
- Tooltip on hover/tap shows: issue description, source chapter reference, "Dismiss" button
- Dismissed annotations don't reappear for the same text
- Badge count in header: "3 issues" — clicking scrolls to first

### 4.4 Performance

- Runs asynchronously after chapter generation (doesn't block the UI)
- Uses chapter summaries (not full text) for older chapters to keep context small
- Haiku is fast (~1-2s) and cheap (~$0.001/call)

---

## 5. Database Migration

New tables and columns added in a single migration:

```sql
-- Story Bibles
CREATE TABLE story_bibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN (
    'characters', 'world', 'synopsis', 'genre', 'style_guide', 'outline', 'notes'
  )),
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(story_id, section_type)
);

-- Chapter annotations (text-match based positioning, no integer offsets)
CREATE TABLE chapter_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  text_match text NOT NULL,
  annotation_type text NOT NULL DEFAULT 'continuity_warning'
    CHECK (annotation_type IN ('continuity_warning', 'suggestion')),
  message text NOT NULL,
  source_chapter int,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_chapter_annotations_chapter_id ON chapter_annotations(chapter_id);

-- Add Tiptap JSON and summary columns to chapters
ALTER TABLE chapters ADD COLUMN content_json jsonb;
ALTER TABLE chapters ADD COLUMN summary text;

-- RLS policies
ALTER TABLE story_bibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their story bibles"
  ON story_bibles FOR ALL
  USING (story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their annotations"
  ON chapter_annotations FOR ALL
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    JOIN stories s ON c.story_id = s.id
    WHERE s.user_id = auth.uid()
  ));
```

---

## 6. API Routes Summary

| Route | Method | Model | Purpose |
|-------|--------|-------|---------|
| `/api/story-bible/generate` | POST | Haiku | Auto-generate Bible from Chapter 1 |
| `/api/story-bible/[storyId]` | GET | — | Fetch Bible for a story |
| `/api/story-bible/[storyId]` | PUT | — | Update Bible sections |
| `/api/craft/rewrite` | POST | Haiku | Rewrite selected text |
| `/api/craft/expand` | POST | Haiku | Expand sparse text |
| `/api/craft/describe` | POST | Haiku | Generate description alternatives |
| `/api/craft/brainstorm` | POST | Sonnet | Generate plot directions |
| `/api/continuity/check` | POST | Haiku | Scan chapter for contradictions |

---

## 7. Component Architecture

```
src/app/components/
├── editor/
│   ├── StoryEditor.tsx          -- Main editor wrapper (Tiptap instance)
│   ├── EditorToolbar.tsx        -- Top bar: chapter nav, Bible toggle, settings
│   ├── EditorFooter.tsx         -- Word count, Continue button
│   ├── CraftToolbar.tsx         -- Floating toolbar on text selection (desktop)
│   ├── CraftDrawer.tsx          -- Bottom drawer for craft tools (mobile)
│   ├── CraftPreview.tsx         -- Diff-style preview for tool results
│   ├── AnnotationTooltip.tsx    -- Continuity issue tooltip
│   └── useAutosave.ts           -- Hook: debounced save to Supabase
├── story-bible/
│   ├── StoryBiblePanel.tsx      -- Slide-over panel container
│   ├── BibleSection.tsx         -- Collapsible accordion section
│   ├── CharacterCard.tsx        -- Character editor within Bible
│   ├── WorldEditor.tsx          -- World section editor
│   ├── SynopsisEditor.tsx       -- Synopsis section editor
│   ├── GenreEditor.tsx          -- Genre/warnings editor
│   ├── StyleGuideEditor.tsx     -- Style guide editor
│   ├── OutlineEditor.tsx        -- Chapter outline editor
│   └── NotesEditor.tsx          -- Freeform notes editor
├── CreateStoryTab.tsx           -- (existing, unchanged)
├── StoryViewer.tsx              -- (deprecated, replaced by StoryEditor)
├── LibraryTab.tsx               -- (existing, updated to open StoryEditor)
└── FandomSelector.tsx           -- (existing, unchanged)
```

---

## 8. UX Priorities

Every component must satisfy:

1. **Mobile-first (375px+):** Touch targets ≥ 44px, no hover-dependent interactions without tap alternatives
2. **Loading states that feel alive:** Skeleton loaders, progress indicators, not blank screens. Craft tools show inline spinners.
3. **Smooth transitions:** Panel slides, toolbar fades, drawer animations. 200-300ms easing.
4. **Clear affordances:** Every interactive element looks clickable. Disabled states are obvious.
5. **Non-destructive:** All AI suggestions show preview before applying. Undo always available.
6. **Fast perceived performance:** Optimistic UI updates. Autosave in background. Craft tools stream results when possible.

---

## 9. Dependencies

New packages:
- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-placeholder` — Editor
- `@tiptap/extension-highlight` — For continuity annotations
- `@anthropic-ai/sdk` — Already installed, used for Haiku calls

No new external services. All AI calls go through existing Anthropic API. All storage uses existing Supabase instance.

---

## 10. Out of Scope (Phase 1)

- Image generation (Phase 2)
- Audio narration (Phase 3)
- Public sharing / community (Phase 3)
- Stripe / payments (Phase 4)
- Collaborative editing / multiplayer
- Version history / branching
- Shared Story Bibles across stories
- Pre-generation continuity checks (may add as opt-in later)
