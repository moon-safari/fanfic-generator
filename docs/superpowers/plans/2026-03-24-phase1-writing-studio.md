# Phase 1: Writing Studio Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the read-only fanfic viewer into a Sudowrite-level writing studio with Story Bible, Tiptap rich editor, 4 AI craft tools, and a continuity engine.

**Architecture:** The current `StoryViewer` (read-only) is replaced by `StoryEditor` (Tiptap-based). Story Bible lives in a slide-over panel. Craft tools appear as a floating toolbar (desktop) or bottom drawer (mobile). Continuity annotations are inline decorations. All AI calls use server-side Bible fetching. Chapter type evolves from `string` to structured `Chapter` object.

**Tech Stack:** Next.js 16 App Router (async params), Tiptap 2, Supabase (Postgres + RLS + Auth), Anthropic Claude (Sonnet for generation/brainstorm, Haiku for craft tools/summaries/continuity), Tailwind CSS, TypeScript.

**Spec:** `docs/superpowers/specs/2026-03-24-phase1-writing-studio-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `supabase/migrations/002_writing_studio.sql` | DB migration: story_bibles, chapter_annotations tables, new chapter columns |
| `src/app/types/bible.ts` | TypeScript types for Story Bible sections, annotations |
| `src/app/lib/supabase/bible.ts` | CRUD for story_bibles table |
| `src/app/lib/supabase/annotations.ts` | CRUD for chapter_annotations table |
| `src/app/lib/prompts/index.ts` | Re-export of existing prompts.ts (renamed from prompts.ts to prompts/index.ts) |
| `src/app/lib/prompts/bible.ts` | Prompt builders for Bible generation |
| `src/app/lib/prompts/craft.ts` | Prompt builders for Rewrite/Expand/Describe/Brainstorm |
| `src/app/lib/prompts/continuity.ts` | Prompt builder for continuity checking |
| `src/app/api/story-bible/generate/route.ts` | POST: auto-generate Bible from Chapter 1 |
| `src/app/api/story-bible/[storyId]/route.ts` | GET/PUT: fetch and update Bible |
| `src/app/api/craft/shared.ts` | Shared auth + Bible fetching helper for all craft routes |
| `src/app/api/craft/rewrite/route.ts` | POST: rewrite selected text |
| `src/app/api/craft/expand/route.ts` | POST: expand sparse text |
| `src/app/api/craft/describe/route.ts` | POST: generate description alternatives |
| `src/app/api/craft/brainstorm/route.ts` | POST: generate plot directions |
| `src/app/api/continuity/check/route.ts` | POST: scan chapter for contradictions |
| `src/app/api/chapters/[chapterId]/summary/route.ts` | POST: generate chapter summary |
| `src/app/components/editor/StoryEditor.tsx` | Main editor: Tiptap instance, state management |
| `src/app/components/editor/EditorToolbar.tsx` | Header: chapter nav, Bible toggle, annotation badge |
| `src/app/components/editor/EditorFooter.tsx` | Footer: word count, Continue button |
| `src/app/components/editor/CraftToolbar.tsx` | Floating toolbar on text selection (desktop) |
| `src/app/components/editor/CraftDrawer.tsx` | Bottom drawer for craft tools (mobile) |
| `src/app/components/editor/CraftPreview.tsx` | Diff-style preview for craft tool results |
| `src/app/components/editor/AnnotationTooltip.tsx` | Tooltip for continuity issues |
| `src/app/components/editor/useAutosave.ts` | Hook: debounced save to Supabase |
| `src/app/components/editor/useCraftTools.ts` | Hook: craft tool API calls + state |
| `src/app/components/story-bible/StoryBiblePanel.tsx` | Slide-over panel container |
| `src/app/components/story-bible/BibleSection.tsx` | Collapsible accordion section |
| `src/app/components/story-bible/CharacterCard.tsx` | Character editor card |
| `src/app/components/story-bible/WorldEditor.tsx` | World section editor |
| `src/app/components/story-bible/SynopsisEditor.tsx` | Synopsis section editor |
| `src/app/components/story-bible/GenreEditor.tsx` | Genre/warnings editor |
| `src/app/components/story-bible/StyleGuideEditor.tsx` | Style guide editor |
| `src/app/components/story-bible/OutlineEditor.tsx` | Chapter outline editor |
| `src/app/components/story-bible/NotesEditor.tsx` | Freeform notes editor |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/types/story.ts` | Add `Chapter` interface, update `Story.chapters` from `string[]` to `Chapter[]` |
| `src/app/lib/supabase/stories.ts` | Update queries to include `id, content_json, summary`; refactor `dbToStory()`; update `addChapterToDB()` word count calc |
| `src/app/lib/prompts.ts` | **Rename** to `src/app/lib/prompts/index.ts`; update `buildContinuationPrompt()` to use smart context budget. Update all imports that reference `../lib/prompts` (they continue to work since `prompts/index.ts` is the default resolution). |
| `src/app/lib/storage.ts` | Update `exportStoryToText()` to use `chapter.content` instead of raw string |
| `src/app/api/continue-chapter/route.ts` | Add auth check; use smart context (Bible + summaries); update chapter access |
| `src/app/api/generate-story/route.ts` | Add auth check |
| `src/app/components/Library.tsx` | Update `story.chapters.length` to work with `Chapter[]` (already works — `.length` is the same) |
| `src/app/page.tsx` | Replace `StoryViewer` with `StoryEditor`; add Bible generation trigger after story creation |
| `src/app/components/CreateStoryTab.tsx` | Update `createStoryInDB()` call for new Chapter type |
| `package.json` | Add Tiptap dependencies |

---

## Task 1: Install Tiptap Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Tiptap packages**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-highlight @tiptap/extension-character-count @tiptap/pm
```

- [ ] **Step 2: Verify install succeeds**

Run: `npm ls @tiptap/react`
Expected: Shows @tiptap/react in dependency tree, no errors.

- [ ] **Step 3: Verify build still works**

Run: `npm run build`
Expected: Build succeeds (Tiptap not imported anywhere yet, no impact).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Tiptap editor dependencies"
```

---

## Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/002_writing_studio.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/002_writing_studio.sql`:

```sql
-- Story Bibles: per-story reference context (7 section types)
CREATE TABLE public.story_bibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN (
    'characters', 'world', 'synopsis', 'genre', 'style_guide', 'outline', 'notes'
  )),
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(story_id, section_type)
);

CREATE INDEX idx_story_bibles_story_id ON public.story_bibles(story_id);

-- Chapter annotations: continuity warnings, inline
CREATE TABLE public.chapter_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  text_match text NOT NULL,
  annotation_type text NOT NULL DEFAULT 'continuity_warning'
    CHECK (annotation_type IN ('continuity_warning', 'suggestion')),
  message text NOT NULL,
  source_chapter int,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error')),
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapter_annotations_chapter_id ON public.chapter_annotations(chapter_id);

-- Add Tiptap JSON and summary columns to chapters
ALTER TABLE public.chapters ADD COLUMN content_json jsonb;
ALTER TABLE public.chapters ADD COLUMN summary text;

-- RLS policies for story_bibles
ALTER TABLE public.story_bibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story bibles"
  ON public.story_bibles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own story bibles"
  ON public.story_bibles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own story bibles"
  ON public.story_bibles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own story bibles"
  ON public.story_bibles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_bibles.story_id
    AND stories.user_id = auth.uid()
  ));

-- RLS policies for chapter_annotations
ALTER TABLE public.chapter_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annotations"
  ON public.chapter_annotations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own annotations"
  ON public.chapter_annotations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own annotations"
  ON public.chapter_annotations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own annotations"
  ON public.chapter_annotations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.chapters c
    JOIN public.stories s ON c.story_id = s.id
    WHERE c.id = chapter_annotations.chapter_id
    AND s.user_id = auth.uid()
  ));
```

- [ ] **Step 2: Run migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration SQL.

Verify: Check Tables → `story_bibles` and `chapter_annotations` exist. Check `chapters` table has `content_json` and `summary` columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_writing_studio.sql
git commit -m "feat: add writing studio database migration (story_bibles, annotations, chapter columns)"
```

---

## Task 3: TypeScript Types — Chapter & Bible

**Files:**
- Modify: `src/app/types/story.ts`
- Create: `src/app/types/bible.ts`

- [ ] **Step 1: Add Chapter interface and update Story type**

In `src/app/types/story.ts`, add the `Chapter` interface and update `Story`:

```typescript
export interface Chapter {
  id: string;
  chapterNumber: number;
  content: string;           // plain text (always present)
  contentJson?: object;      // Tiptap document JSON
  summary?: string;          // Haiku-generated 2-sentence summary
  wordCount: number;
}

// Update Story interface: chapters changes from string[] to Chapter[]
export interface Story {
  id: string;
  title: string;
  chapters: Chapter[];       // was string[]
  // ... keep all other fields identical
}
```

- [ ] **Step 2: Create Bible types**

Create `src/app/types/bible.ts`:

```typescript
export type BibleSectionType =
  | "characters"
  | "world"
  | "synopsis"
  | "genre"
  | "style_guide"
  | "outline"
  | "notes";

export interface BibleCharacter {
  name: string;
  role: string;
  personality: string;
  appearance: string;
  relationships: { character: string; type: string }[];
  voiceNotes: string;
}

export interface BibleCharactersContent {
  characters: BibleCharacter[];
}

export interface BibleWorldContent {
  setting: string;
  rules: string[];
  locations: string[];
  era: string;
  customs: string;
}

export interface BibleSynopsisContent {
  text: string;
}

export interface BibleGenreContent {
  primary: string;
  secondary: string[];
  warnings: string[];
}

export interface BibleStyleGuideContent {
  pov: string;
  tense: string;
  proseStyle: string;
  dialogueStyle: string;
  pacing: string;
}

export interface BibleOutlineChapter {
  number: number;
  title: string;
  summary: string;
  status: "planned" | "written" | "revised";
}

export interface BibleOutlineContent {
  chapters: BibleOutlineChapter[];
}

export interface BibleNotesContent {
  text: string;
}

export type BibleSectionContent =
  | BibleCharactersContent
  | BibleWorldContent
  | BibleSynopsisContent
  | BibleGenreContent
  | BibleStyleGuideContent
  | BibleOutlineContent
  | BibleNotesContent;

export interface BibleSection {
  id: string;
  storyId: string;
  sectionType: BibleSectionType;
  content: BibleSectionContent;
  createdAt: string;
  updatedAt: string;
}

export interface StoryBible {
  storyId: string;
  sections: Record<BibleSectionType, BibleSection | null>;
}

export interface ChapterAnnotation {
  id: string;
  chapterId: string;
  textMatch: string;
  annotationType: "continuity_warning" | "suggestion";
  message: string;
  sourceChapter: number | null;
  severity: "info" | "warning" | "error";
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Type errors in files that still use `string[]` chapters (stories.ts, StoryViewer.tsx, prompts.ts, storage.ts, continue-chapter route). That's expected — we fix those in the next tasks.

- [ ] **Step 4: Commit**

```bash
git add src/app/types/story.ts src/app/types/bible.ts
git commit -m "feat: add Chapter interface, Story Bible types, and annotation types"
```

---

## Task 4: Update Data Layer — dbToStory & CRUD

**Files:**
- Modify: `src/app/lib/supabase/stories.ts`
- Create: `src/app/lib/supabase/bible.ts`
- Create: `src/app/lib/supabase/annotations.ts`

- [ ] **Step 1: Update stories.ts — queries and dbToStory**

Rewrite `src/app/lib/supabase/stories.ts`:

Key changes:
1. All SELECT queries now include `id, content_json, summary` from chapters:
   ```typescript
   .select("*, chapters(id, content, content_json, summary, chapter_number, word_count)")
   ```
2. `dbToStory()` builds `Chapter[]` objects:
   ```typescript
   const chapters = (row.chapters as Array<{
     id: string;
     content: string;
     content_json?: object;
     summary?: string;
     chapter_number: number;
     word_count: number;
   }>)
     .sort((a, b) => a.chapter_number - b.chapter_number)
     .map((ch) => ({
       id: ch.id,
       chapterNumber: ch.chapter_number,
       content: ch.content,
       contentJson: ch.content_json || undefined,
       summary: ch.summary || undefined,
       wordCount: ch.word_count,
     }));
   ```
3. **`createStoryInDB()` signature change** — it now accepts a creation-specific input type instead of `Story`:
   ```typescript
   interface CreateStoryInput {
     title: string;
     firstChapterContent: string;  // plain text of Chapter 1
     fandom: string;
     customFandom?: string;
     characters: string[];
     relationshipType: RelationshipType;
     rating: Rating;
     setting?: string;
     tone: string[];
     tropes: string[];
     wordCount: number;
   }

   export async function createStoryInDB(input: CreateStoryInput): Promise<Story | null> {
     // ... insert story row ...
     // Insert first chapter:
     const { error: chapError } = await supabase.from("chapters").insert({
       story_id: dbStory.id,
       chapter_number: 1,
       content: input.firstChapterContent,
       word_count: input.firstChapterContent.split(/\s+/).length,
     });
     // ... return getStoryFromDB(dbStory.id)
   }
   ```
   **Update `CreateStoryTab.tsx`** accordingly to call with `firstChapterContent: data.chapter` instead of `chapters: [data.chapter]`.

4. **`addChapterToDB()` update** — word count calculation uses `chapter.wordCount` from the `Chapter` objects returned by `getStoryFromDB`:
   ```typescript
   export async function addChapterToDB(
     storyId: string,
     chapterNumber: number,
     content: string
   ): Promise<Story | null> {
     const wordCount = content.split(/\s+/).length;
     const { error } = await supabase.from("chapters").insert({
       story_id: storyId,
       chapter_number: chapterNumber,
       content,
       word_count: wordCount,
     });
     if (error) return null;

     // Refetch story to get updated Chapter[] with proper wordCount per chapter
     const story = await getStoryFromDB(storyId);
     if (!story) return null;

     const totalWords = story.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
     await supabase
       .from("stories")
       .update({ word_count: totalWords, updated_at: new Date().toISOString() })
       .eq("id", storyId);

     return getStoryFromDB(storyId);
   }
   ```

- [ ] **Step 2: Create bible.ts — Story Bible CRUD**

Create `src/app/lib/supabase/bible.ts`:

```typescript
import { createClient } from "./client";
import { StoryBible, BibleSection, BibleSectionType, BibleSectionContent } from "../../types/bible";

const supabase = createClient();

const SECTION_TYPES: BibleSectionType[] = [
  "characters", "world", "synopsis", "genre", "style_guide", "outline", "notes"
];

export async function getStoryBible(storyId: string): Promise<StoryBible> {
  const { data, error } = await supabase
    .from("story_bibles")
    .select("*")
    .eq("story_id", storyId);

  const sections: Record<string, BibleSection | null> = {};
  for (const type of SECTION_TYPES) {
    const row = data?.find((r: Record<string, unknown>) => r.section_type === type);
    sections[type] = row ? dbToBibleSection(row) : null;
  }

  return { storyId, sections: sections as StoryBible["sections"] };
}

export async function upsertBibleSection(
  storyId: string,
  sectionType: BibleSectionType,
  content: BibleSectionContent
): Promise<BibleSection | null> {
  const { data, error } = await supabase
    .from("story_bibles")
    .upsert(
      { story_id: storyId, section_type: sectionType, content, updated_at: new Date().toISOString() },
      { onConflict: "story_id,section_type" }
    )
    .select()
    .single();

  if (error || !data) return null;
  return dbToBibleSection(data);
}

export async function upsertAllBibleSections(
  storyId: string,
  sections: Partial<Record<BibleSectionType, BibleSectionContent>>
): Promise<boolean> {
  const rows = Object.entries(sections).map(([type, content]) => ({
    story_id: storyId,
    section_type: type,
    content,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("story_bibles")
    .upsert(rows, { onConflict: "story_id,section_type" });

  return !error;
}

function dbToBibleSection(row: Record<string, unknown>): BibleSection {
  return {
    id: row.id as string,
    storyId: row.story_id as string,
    sectionType: row.section_type as BibleSectionType,
    content: row.content as BibleSectionContent,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

- [ ] **Step 3: Create annotations.ts — Annotations CRUD**

Create `src/app/lib/supabase/annotations.ts`:

```typescript
import { createClient } from "./client";
import { ChapterAnnotation } from "../../types/bible";

const supabase = createClient();

export async function getChapterAnnotations(chapterId: string): Promise<ChapterAnnotation[]> {
  const { data, error } = await supabase
    .from("chapter_annotations")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("dismissed", false);

  if (error || !data) return [];
  return data.map(dbToAnnotation);
}

export async function saveAnnotations(
  chapterId: string,
  annotations: { textMatch: string; message: string; sourceChapter: number | null; severity: string }[]
): Promise<boolean> {
  // Clear existing non-dismissed annotations for this chapter
  await supabase
    .from("chapter_annotations")
    .delete()
    .eq("chapter_id", chapterId)
    .eq("dismissed", false);

  if (annotations.length === 0) return true;

  const rows = annotations.map((a) => ({
    chapter_id: chapterId,
    text_match: a.textMatch,
    message: a.message,
    source_chapter: a.sourceChapter,
    severity: a.severity,
  }));

  const { error } = await supabase.from("chapter_annotations").insert(rows);
  return !error;
}

export async function dismissAnnotation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("chapter_annotations")
    .update({ dismissed: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

function dbToAnnotation(row: Record<string, unknown>): ChapterAnnotation {
  return {
    id: row.id as string,
    chapterId: row.chapter_id as string,
    textMatch: row.text_match as string,
    annotationType: row.annotation_type as ChapterAnnotation["annotationType"],
    message: row.message as string,
    sourceChapter: row.source_chapter as number | null,
    severity: row.severity as ChapterAnnotation["severity"],
    dismissed: row.dismissed as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Remaining errors only in consumer files (StoryViewer, prompts, storage, API routes) — not in the data layer.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/supabase/stories.ts src/app/lib/supabase/bible.ts src/app/lib/supabase/annotations.ts
git commit -m "feat: update data layer for Chapter objects, add Bible and annotation CRUD"
```

---

## Task 5: Update All Chapter-String Consumers

**Files:**
- Modify: `src/app/lib/storage.ts`
- Modify: `src/app/lib/prompts.ts`
- Modify: `src/app/api/continue-chapter/route.ts`
- Modify: `src/app/api/generate-story/route.ts`
- Modify: `src/app/components/Library.tsx`
- Modify: `src/app/components/CreateStoryTab.tsx`
- Modify: `src/app/components/StoryViewer.tsx`

These files all reference `story.chapters` as `string[]`. Update each to use the new `Chapter` interface.

- [ ] **Step 1: Update storage.ts**

In `exportStoryToText()`:
```typescript
story.chapters.forEach((ch, i) => {
  lines.push(`Chapter ${i + 1}\n`);
  lines.push(ch.content);  // was: ch
  lines.push(`\n${"—".repeat(40)}\n`);
});
```

In `migrateStory()` — update the chapters mapping (this is for legacy localStorage, add backwards compat):
```typescript
chapters: Array.isArray(raw.chapters)
  ? (raw.chapters as Array<string | Record<string, unknown>>).map((ch, i) =>
      typeof ch === "string"
        ? { id: `legacy-${i}`, chapterNumber: i + 1, content: ch, wordCount: ch.split(/\s+/).length }
        : ch as Chapter
    )
  : [],
```

- [ ] **Step 2: Update prompts.ts**

In `buildContinuationPrompt()`:
```typescript
const chapterHistory = story.chapters
  .map((ch, i) => `--- Chapter ${i + 1} ---\n${ch.content}`)  // was: ch
  .join("\n\n");
```

- [ ] **Step 3: Refactor continue-chapter route — server-side story fetch**

Rewrite `src/app/api/continue-chapter/route.ts` to accept only `storyId` (not the full Story object). Fetch story server-side for security and freshness:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../lib/supabase/server";
import { buildContinuationPrompt } from "../../lib/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storyId } = await req.json();
    if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

    // Fetch story with chapters server-side
    const { data: storyRow } = await supabase
      .from("stories")
      .select("*, chapters(id, content, content_json, summary, chapter_number, word_count)")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (!storyRow) return NextResponse.json({ error: "Story not found" }, { status: 404 });

    // Build story object from DB row (reuse dbToStory logic or inline)
    const chapters = (storyRow.chapters as Array<Record<string, unknown>>)
      .sort((a: any, b: any) => a.chapter_number - b.chapter_number);

    if (chapters.length === 0) {
      return NextResponse.json({ error: "Story has no chapters" }, { status: 400 });
    }

    const chapterNum = chapters.length + 1;
    // ... build prompt with Bible context (Task 14 adds this)
    const prompt = buildContinuationPrompt(/* story object */, chapterNum);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const chapter = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ chapter });
  } catch (err) {
    console.error("Continue chapter error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
```

**Also update the client-side caller** in StoryEditor (and StoryViewer until deprecated) to send `{ storyId: story.id }` instead of `{ story }`.

- [ ] **Step 4: Update generate-story route — add auth check**

Same auth check pattern as continue-chapter.

- [ ] **Step 5: Update StoryViewer.tsx**

Replace all `story.chapters[currentChapter]` (which was a string) with `story.chapters[currentChapter].content`:

```typescript
// Line ~221: Chapter content display
{story.chapters[currentChapter].content
  .split("\n\n")
  .filter(Boolean)
  .map((paragraph, i) => (
    <p key={i} className="text-zinc-200 leading-relaxed mb-4 last:mb-0">
      {paragraph}
    </p>
  ))}
```

And update word count in `addChapterToDB` callback — the returned Story now has `Chapter[]` so `updated.chapters.length - 1` still works.

- [ ] **Step 6: Update CreateStoryTab.tsx**

The `createStoryInDB()` call currently passes `chapters: [data.chapter]` (string array). Since `createStoryInDB` accepts the raw form + first chapter content, update the story creation to match the new expected signature. The `createStoryInDB` function in stories.ts should still accept `chapters` as `string[]` for creation (it converts to DB rows), so no change needed here if we keep the creation interface accepting plain strings.

- [ ] **Step 7: Update Library.tsx**

`story.chapters.length` already works on `Chapter[]` — no change needed. The display line at line 45 still works.

- [ ] **Step 8: Verify full build**

Run: `npx tsc --noEmit && npm run build`
Expected: No type errors. Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/app/lib/storage.ts src/app/lib/prompts.ts src/app/api/continue-chapter/route.ts src/app/api/generate-story/route.ts src/app/components/StoryViewer.tsx
git commit -m "feat: migrate all chapter consumers from string[] to Chapter[]"
```

---

## Task 6: Prompt Builders — Bible, Craft Tools, Continuity

**Files:**
- Create: `src/app/lib/prompts/bible.ts`
- Create: `src/app/lib/prompts/craft.ts`
- Create: `src/app/lib/prompts/continuity.ts`
- Modify: `src/app/lib/prompts.ts` (add re-exports, update continuation prompt for smart context)

- [ ] **Step 1: Create bible.ts prompt builder**

Create `src/app/lib/prompts/bible.ts`:

```typescript
import { StoryBible } from "../../types/bible";

export function buildBibleGenerationPrompt(chapter1: string, fandomContext: string): string {
  return `You are analyzing a fanfiction chapter to extract structured story context for a Story Bible.

${fandomContext ? `=== FANDOM CONTEXT ===\n${fandomContext}\n` : "This is an original story."}

=== CHAPTER 1 ===
${chapter1}

Extract and structure a Story Bible with these 7 sections. Be specific and detailed based on what's actually in the chapter — don't invent information not present or implied.

Output ONLY valid JSON with this exact structure:
{
  "characters": {
    "characters": [
      {
        "name": "Character Name",
        "role": "protagonist/antagonist/supporting/mentioned",
        "personality": "Key personality traits as shown in the chapter",
        "appearance": "Physical description if mentioned, otherwise 'Not yet described'",
        "relationships": [{"character": "Other Name", "type": "relationship description"}],
        "voiceNotes": "How they speak — dialect, formality, verbal tics"
      }
    ]
  },
  "world": {
    "setting": "Primary setting description",
    "rules": ["World rules established or implied"],
    "locations": ["Locations mentioned"],
    "era": "Time period",
    "customs": "Social norms, customs, traditions"
  },
  "synopsis": {
    "text": "One-paragraph story summary based on Chapter 1's setup"
  },
  "genre": {
    "primary": "Primary genre",
    "secondary": ["Secondary genres"],
    "warnings": ["Content warnings if applicable"]
  },
  "style_guide": {
    "pov": "Point of view used (first/second/third-limited/third-omniscient)",
    "tense": "Tense used (past/present)",
    "proseStyle": "Description of the prose style",
    "dialogueStyle": "How dialogue is written",
    "pacing": "Pacing observations"
  },
  "outline": {
    "chapters": [{"number": 1, "title": "Chapter 1", "summary": "Brief summary of Chapter 1", "status": "written"}]
  },
  "notes": {
    "text": ""
  }
}`;
}

export function formatBibleForPrompt(bible: StoryBible): string {
  const sections: string[] = ["=== STORY BIBLE ==="];

  const chars = bible.sections.characters;
  if (chars?.content && "characters" in chars.content) {
    sections.push("## Characters");
    for (const c of chars.content.characters) {
      sections.push(`- **${c.name}** (${c.role}): ${c.personality}`);
      if (c.appearance !== "Not yet described") sections.push(`  Appearance: ${c.appearance}`);
      if (c.voiceNotes) sections.push(`  Voice: ${c.voiceNotes}`);
      if (c.relationships.length > 0) {
        sections.push(`  Relationships: ${c.relationships.map(r => `${r.character} (${r.type})`).join(", ")}`);
      }
    }
  }

  const world = bible.sections.world;
  if (world?.content && "setting" in world.content) {
    sections.push("\n## World");
    sections.push(`Setting: ${world.content.setting}`);
    if (world.content.rules.length) sections.push(`Rules: ${world.content.rules.join("; ")}`);
    if (world.content.locations.length) sections.push(`Locations: ${world.content.locations.join(", ")}`);
    if (world.content.era) sections.push(`Era: ${world.content.era}`);
  }

  const synopsis = bible.sections.synopsis;
  if (synopsis?.content && "text" in synopsis.content) {
    sections.push(`\n## Synopsis\n${synopsis.content.text}`);
  }

  const style = bible.sections.style_guide;
  if (style?.content && "pov" in style.content) {
    sections.push(`\n## Style Guide`);
    sections.push(`POV: ${style.content.pov} | Tense: ${style.content.tense} | Pacing: ${style.content.pacing}`);
    sections.push(`Prose: ${style.content.proseStyle}`);
    sections.push(`Dialogue: ${style.content.dialogueStyle}`);
  }

  const genre = bible.sections.genre;
  if (genre?.content && "primary" in genre.content) {
    sections.push(`\n## Genre\n${genre.content.primary}${genre.content.secondary.length ? ` / ${genre.content.secondary.join(", ")}` : ""}`);
    if (genre.content.warnings.length) sections.push(`Warnings: ${genre.content.warnings.join(", ")}`);
  }

  return sections.join("\n");
}
```

- [ ] **Step 2: Create craft.ts prompt builders**

Create `src/app/lib/prompts/craft.ts`:

```typescript
export function buildRewritePrompt(
  selectedText: string,
  direction: string,
  context: string,
  bibleContext: string
): string {
  return `You are a creative writing assistant helping a writer refine their prose.

${bibleContext}

=== SURROUNDING CONTEXT ===
${context}

=== SELECTED TEXT TO REWRITE ===
${selectedText}

=== DIRECTION ===
${direction}

Rewrite the selected text following the direction. Maintain the same characters, events, and continuity. Match the style and tone of the surrounding context. Output ONLY the rewritten text — no explanations, no quotes, no labels.`;
}

export function buildExpandPrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a creative writing assistant helping a writer add richness to their prose.

${bibleContext}

=== SURROUNDING CONTEXT ===
${context}

=== TEXT TO EXPAND ===
${selectedText}

Expand this text with vivid sensory detail, deeper emotion, and richer scene-setting. Keep the same events and characters. Match the existing style and tone. Roughly double the length. Output ONLY the expanded text — no explanations.`;
}

export function buildDescribePrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a creative writing assistant helping a writer find the perfect description.

${bibleContext}

=== SURROUNDING CONTEXT ===
${context}

=== TEXT TO RE-DESCRIBE ===
${selectedText}

Generate 4 alternative descriptions for this text. Each should have a different approach: one more visceral/sensory, one more poetic/literary, one more action-focused, one more emotional/internal. Keep same characters and continuity. Match the surrounding style.

Output as a JSON array of 4 strings:
["Alternative 1", "Alternative 2", "Alternative 3", "Alternative 4"]`;
}

export function buildBrainstormPrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a creative writing assistant helping a writer explore plot directions.

${bibleContext}

=== STORY SO FAR (RELEVANT SECTION) ===
${context}

=== CURRENT MOMENT ===
${selectedText}

What could happen next? Generate 5 distinct plot directions. Each should:
- Be specific and actionable (not vague)
- Feel true to the established characters and world
- Range from expected to surprising
- Include a 1-sentence preview of how it would read

Output as a JSON array of 5 objects:
[
  {"title": "Short title", "description": "2-3 sentence description", "preview": "One sentence showing how this direction would read in prose"},
  ...
]`;
}
```

- [ ] **Step 3: Create continuity.ts prompt builder**

Create `src/app/lib/prompts/continuity.ts`:

```typescript
export function buildContinuityCheckPrompt(
  chapterContent: string,
  chapterNumber: number,
  bibleContext: string,
  previousSummaries: { number: number; summary: string }[]
): string {
  const summariesText = previousSummaries
    .map((s) => `Chapter ${s.number}: ${s.summary}`)
    .join("\n");

  return `You are a continuity editor checking a fanfiction chapter for contradictions with established story details.

${bibleContext}

=== PREVIOUS CHAPTER SUMMARIES ===
${summariesText || "No previous chapters."}

=== CHAPTER ${chapterNumber} (CHECKING THIS) ===
${chapterContent}

Find any contradictions between this chapter and the Story Bible or previous chapters. Look for:
- Character appearance changes (eye color, hair, etc.)
- Personality inconsistencies
- Location/setting errors
- Timeline contradictions
- World rule violations
- Character knowledge inconsistencies (knowing things they shouldn't)

IMPORTANT: Only flag real contradictions, not stylistic choices. Be conservative — false positives are annoying.

Output ONLY valid JSON:
{
  "annotations": [
    {
      "text": "exact quoted text from the chapter that contains the issue",
      "issue": "Clear explanation of the contradiction",
      "sourceChapter": 2,
      "severity": "warning"
    }
  ]
}

If no contradictions found, output: {"annotations": []}`;
}
```

- [ ] **Step 4: Rename prompts.ts → prompts/index.ts + update continuation prompt**

**Critical:** You cannot have both `src/app/lib/prompts.ts` (file) and `src/app/lib/prompts/` (directory). Rename:
```bash
mkdir -p src/app/lib/prompts
git mv src/app/lib/prompts.ts src/app/lib/prompts/index.ts
```
All existing imports of `../lib/prompts` continue to resolve to `prompts/index.ts` automatically. No import updates needed.

Then update `buildContinuationPrompt()` in the now-renamed `src/app/lib/prompts/index.ts` to use smart context:

```typescript
export function buildContinuationPrompt(story: Story, chapterNum: number, bibleContext?: string): string {
  const fandomName = story.customFandom || story.fandom || "Original";
  const toneStr = story.tone.join(" + ");
  const rating = story.rating ?? "mature";
  const relationshipType = story.relationshipType ?? "gen";

  // Smart context: last 2 chapters full, earlier chapters as summaries
  const chapters = story.chapters;
  let chapterHistory = "";

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    if (i >= chapters.length - 2) {
      // Last 2 chapters: full text
      chapterHistory += `--- Chapter ${ch.chapterNumber} ---\n${ch.content}\n\n`;
    } else if (ch.summary) {
      // Earlier chapters: summary only
      chapterHistory += `--- Chapter ${ch.chapterNumber} (summary) ---\n${ch.summary}\n\n`;
    } else {
      // No summary yet: include full text (fallback)
      chapterHistory += `--- Chapter ${ch.chapterNumber} ---\n${ch.content}\n\n`;
    }
  }

  // Keep the FULL existing prompt template structure (rating instructions,
  // relationship instructions, fandom context, story details, chapter instructions).
  // Just inject bibleContext after fandom context and replace the chapter history
  // section with the smart-context version above.
  return `You are continuing a serialised ${fandomName} story. You write vivid, emotionally gripping fiction.

${getRatingInstructions(rating)}

${getRelationshipInstructions(relationshipType, story.characters)}

${getFandomContext(story.fandom)}
${bibleContext ? `\n${bibleContext}\n` : ""}

STORY DETAILS:
- Title: "${story.title}"
- Characters: ${story.characters.filter(Boolean).join(", ")}
${story.setting ? `- Setting: ${story.setting}` : ""}
- Tone: ${toneStr}
${story.tropes.length > 0 ? `- Tropes: ${story.tropes.join(", ")}` : ""}

PREVIOUS CHAPTERS:
${chapterHistory}

CHAPTER ${chapterNum} INSTRUCTIONS:
1. Continue DIRECTLY from where Chapter ${chapterNum - 1} ended
2. Remember and reference previous events — continuity is sacred
3. Maintain character voices and consistency
4. Advance the plot meaningfully — something must change or deepen
5. Maintain the established tone
6. End with a compelling hook or cliffhanger — make them NEED to click Continue
7. Write approximately 3-4 paragraphs (400-600 words)
8. Show character growth or shift in dynamics
9. Do NOT summarise previous chapters — jump straight into the action
10. Do NOT hold back on intensity. Match or escalate the established tone.

Write Chapter ${chapterNum} now (just the story text, no chapter header):`;
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/lib/prompts/bible.ts src/app/lib/prompts/craft.ts src/app/lib/prompts/continuity.ts src/app/lib/prompts.ts
git commit -m "feat: add prompt builders for Bible generation, craft tools, and continuity engine"
```

---

## Task 7: API Routes — Story Bible

**Files:**
- Create: `src/app/api/story-bible/generate/route.ts`
- Create: `src/app/api/story-bible/[storyId]/route.ts`

- [ ] **Step 1: Create Bible generation route**

Create `src/app/api/story-bible/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../../lib/supabase/server";
import { buildBibleGenerationPrompt } from "../../../lib/prompts/bible";
import { getFandomContext } from "../../../lib/fandoms";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storyId } = await req.json();
    if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

    // Verify ownership + get story data
    const { data: story } = await supabase
      .from("stories")
      .select("*, chapters(content, chapter_number)")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single();

    if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

    const chapter1 = (story.chapters as Array<{ content: string; chapter_number: number }>)
      .sort((a, b) => a.chapter_number - b.chapter_number)[0]?.content;

    if (!chapter1) return NextResponse.json({ error: "No chapters found" }, { status: 400 });

    const fandomContext = getFandomContext(story.fandom);
    const prompt = buildBibleGenerationPrompt(chapter1, fandomContext);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse Bible" }, { status: 500 });

    const bible = JSON.parse(jsonMatch[0]);

    // Upsert all 7 sections
    const sectionTypes = ["characters", "world", "synopsis", "genre", "style_guide", "outline", "notes"];
    const rows = sectionTypes
      .filter((type) => bible[type])
      .map((type) => ({
        story_id: storyId,
        section_type: type,
        content: bible[type],
        updated_at: new Date().toISOString(),
      }));

    const { error: upsertError } = await supabase
      .from("story_bibles")
      .upsert(rows, { onConflict: "story_id,section_type" });

    if (upsertError) return NextResponse.json({ error: "Failed to save Bible" }, { status: 500 });

    return NextResponse.json({ success: true, sections: bible }, { status: 200 });
  } catch (err) {
    console.error("Bible generation error:", err);
    return NextResponse.json({ error: "Bible generation failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create Bible fetch/update route**

Create `src/app/api/story-bible/[storyId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { storyId } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("story_bibles")
      .select("*")
      .eq("story_id", storyId);

    if (error) return NextResponse.json({ error: "Failed to fetch Bible" }, { status: 500 });
    return NextResponse.json({ sections: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch Bible" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { storyId } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sectionType, content } = await req.json();

    const { error } = await supabase
      .from("story_bibles")
      .upsert(
        { story_id: storyId, section_type: sectionType, content, updated_at: new Date().toISOString() },
        { onConflict: "story_id,section_type" }
      );

    if (error) return NextResponse.json({ error: "Failed to update Bible" }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update Bible" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify routes compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/story-bible/
git commit -m "feat: add Story Bible API routes (generate, fetch, update)"
```

---

## Task 8: API Routes — Craft Tools

**Files:**
- Create: `src/app/api/craft/rewrite/route.ts`
- Create: `src/app/api/craft/expand/route.ts`
- Create: `src/app/api/craft/describe/route.ts`
- Create: `src/app/api/craft/brainstorm/route.ts`

All 4 routes follow the same pattern. Each:
1. Authenticates via `createServerSupabase()`
2. Validates input
3. Fetches Story Bible from DB for the given `storyId`
4. Builds prompt using the Bible context + selected text + surrounding context
5. Calls the appropriate Claude model (Haiku for rewrite/expand/describe, Sonnet for brainstorm)
6. Returns the result

- [ ] **Step 1: Create a shared helper for craft routes**

Create `src/app/api/craft/shared.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabase/server";
import { formatBibleForPrompt } from "../../../lib/prompts/bible";
import { BibleSectionType, BibleSectionContent, StoryBible } from "../../../types/bible";

export async function authenticateAndFetchBible(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const body = await req.json();
  const { storyId, selectedText, context, direction } = body;

  if (!storyId || !selectedText) {
    return { error: NextResponse.json({ error: "storyId and selectedText required" }, { status: 400 }) };
  }

  // Verify ownership
  const { data: story } = await supabase
    .from("stories")
    .select("id")
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single();

  if (!story) return { error: NextResponse.json({ error: "Story not found" }, { status: 404 }) };

  // Fetch Bible
  const { data: bibleSections } = await supabase
    .from("story_bibles")
    .select("*")
    .eq("story_id", storyId);

  const sectionTypes: BibleSectionType[] = ["characters", "world", "synopsis", "genre", "style_guide", "outline", "notes"];
  const sections: Record<string, { content: BibleSectionContent } | null> = {};
  for (const type of sectionTypes) {
    const row = bibleSections?.find((r: Record<string, unknown>) => r.section_type === type);
    sections[type] = row ? { content: row.content as BibleSectionContent, id: row.id, storyId, sectionType: type, createdAt: row.created_at, updatedAt: row.updated_at } : null;
  }

  const bible: StoryBible = { storyId, sections: sections as StoryBible["sections"] };
  const bibleContext = formatBibleForPrompt(bible);

  return { selectedText, context: context || "", direction, bibleContext };
}
```

- [ ] **Step 2: Create rewrite route**

Create `src/app/api/craft/rewrite/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateAndFetchBible } from "../shared";
import { buildRewritePrompt } from "../../../../lib/prompts/craft";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const result = await authenticateAndFetchBible(req);
    if ("error" in result) return result.error;

    const { selectedText, context, direction, bibleContext } = result;
    if (!direction) return NextResponse.json({ error: "direction required" }, { status: 400 });

    const prompt = buildRewritePrompt(selectedText, direction, context, bibleContext);
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ result: text });
  } catch (err) {
    console.error("Rewrite error:", err);
    return NextResponse.json({ error: "Rewrite failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create expand, describe, brainstorm routes**

Same pattern for each. For `describe` and `brainstorm`, parse the JSON array response. `brainstorm` uses `claude-sonnet-4-20250514` instead of Haiku.

- [ ] **Step 4: Verify routes compile**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/craft/
git commit -m "feat: add craft tool API routes (rewrite, expand, describe, brainstorm)"
```

---

## Task 9: API Routes — Continuity & Chapter Summary

**Files:**
- Create: `src/app/api/continuity/check/route.ts`
- Create: `src/app/api/chapters/[chapterId]/summary/route.ts`

- [ ] **Step 1: Create continuity check route**

Create `src/app/api/continuity/check/route.ts`:

Uses `createServerSupabase()` for auth, fetches Bible + chapter summaries, calls Haiku with `buildContinuityCheckPrompt()`, saves annotations to DB via annotations CRUD.

- [ ] **Step 2: Create chapter summary generation route**

Create `src/app/api/chapters/[chapterId]/summary/route.ts`:

Simple Haiku call: "Summarize this chapter in 2 sentences." Saves the summary to the `chapters.summary` column.

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/continuity/ src/app/api/chapters/
git commit -m "feat: add continuity check and chapter summary API routes"
```

---

## Task 10: Tiptap Editor — StoryEditor Component

**Files:**
- Create: `src/app/components/editor/StoryEditor.tsx`
- Create: `src/app/components/editor/EditorToolbar.tsx`
- Create: `src/app/components/editor/EditorFooter.tsx`
- Create: `src/app/components/editor/useAutosave.ts`

This is the core UI task — the full-screen immersive editor.

- [ ] **Step 1: Create useAutosave hook**

Create `src/app/components/editor/useAutosave.ts`:

```typescript
import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";

export function useAutosave(
  editor: Editor | null,
  chapterId: string,
  onSave: (content: string, contentJson: object) => Promise<void>
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(async () => {
    if (!editor) return;
    const json = editor.getJSON();
    const text = editor.getText();
    if (text === lastSavedRef.current) return;
    lastSavedRef.current = text;
    await onSave(text, json);
  }, [editor, onSave]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(save, 3000);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [editor, save]);

  // Flush on unmount
  useEffect(() => {
    return () => { save(); };
  }, [save]);

  return { flush: save };
}
```

- [ ] **Step 2: Create EditorToolbar**

Create `src/app/components/editor/EditorToolbar.tsx`:

Header with: back button, chapter dropdown/navigation (Chapter N of M), Bible toggle button (book icon), annotations badge, settings menu.

Mobile: icons only, no text labels. Touch targets >= 44px.

- [ ] **Step 3: Create EditorFooter**

Create `src/app/components/editor/EditorFooter.tsx`:

Footer with: live word count (from editor), "Continue Story" button (gradient, same style as current).

Mobile: stacks vertically.

- [ ] **Step 4: Create StoryEditor — the main component**

Create `src/app/components/editor/StoryEditor.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Story, Chapter } from "../../types/story";
import EditorToolbar from "./EditorToolbar";
import EditorFooter from "./EditorFooter";
import { useAutosave } from "./useAutosave";

interface StoryEditorProps {
  story: Story;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
}

export default function StoryEditor({ story, onBack, onUpdate, onDelete }: StoryEditorProps) {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(story.chapters.length - 1);
  const [showBible, setShowBible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentChapter = story.chapters[currentChapterIdx];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      CharacterCount,
    ],
    content: currentChapter?.contentJson || textToTiptap(currentChapter?.content || ""),
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-zinc max-w-none min-h-[60vh] focus:outline-none p-6",
      },
    },
  });

  // Autosave
  const handleSave = useCallback(async (content: string, contentJson: object) => {
    const supabase = (await import("../../lib/supabase/client")).createClient();
    await supabase
      .from("chapters")
      .update({ content, content_json: contentJson, word_count: content.split(/\s+/).length })
      .eq("id", currentChapter.id);
  }, [currentChapter?.id]);

  const { flush } = useAutosave(editor, currentChapter?.id, handleSave);

  // Chapter navigation
  const switchChapter = useCallback(async (idx: number) => {
    await flush();
    setCurrentChapterIdx(idx);
    const ch = story.chapters[idx];
    editor?.commands.setContent(ch.contentJson || textToTiptap(ch.content));
  }, [flush, story.chapters, editor]);

  // Continue story
  const handleContinue = async () => {
    await flush();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/continue-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to continue story");
      }
      const data = await res.json();
      // Add chapter to DB, update story, navigate
      const { addChapterToDB } = await import("../../lib/supabase/stories");
      const updated = await addChapterToDB(story.id, story.chapters.length + 1, data.chapter);
      if (!updated) throw new Error("Failed to save chapter");
      onUpdate(updated);
      setCurrentChapterIdx(updated.chapters.length - 1);
      editor?.commands.setContent(textToTiptap(data.chapter));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const wordCount = editor?.storage.characterCount?.words?.() ?? currentChapter?.wordCount ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <EditorToolbar
        story={story}
        currentChapterIdx={currentChapterIdx}
        onBack={onBack}
        onChapterChange={switchChapter}
        onToggleBible={() => setShowBible(!showBible)}
        showBible={showBible}
        onDelete={onDelete}
      />

      <div className="flex-1 relative flex">
        {/* Editor */}
        <div className={`flex-1 max-w-3xl mx-auto transition-all ${showBible ? "mr-[35%]" : ""}`}>
          <EditorContent editor={editor} />
        </div>

        {/* Story Bible slide-over */}
        {showBible && (
          <div className="fixed right-0 top-0 bottom-0 w-[35%] max-w-md bg-[#2a1f3d] border-l border-purple-900/50 overflow-y-auto z-40 md:relative md:w-[35%]">
            {/* StoryBiblePanel will go here */}
            <div className="p-4 text-purple-300">Story Bible Panel</div>
          </div>
        )}
      </div>

      <EditorFooter
        wordCount={wordCount}
        isLatestChapter={currentChapterIdx === story.chapters.length - 1}
        loading={loading}
        error={error}
        onContinue={handleContinue}
      />
    </div>
  );
}

// Convert plain text to minimal Tiptap JSON
function textToTiptap(text: string): object {
  return {
    type: "doc",
    content: text.split("\n\n").filter(Boolean).map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p }],
    })),
  };
}
```

- [ ] **Step 5: Wire StoryEditor into page.tsx**

In `src/app/page.tsx`, replace `StoryViewer` with `StoryEditor`:

```typescript
import StoryEditor from "./components/editor/StoryEditor";

// In the activeStory render:
if (activeStory) {
  return (
    <main className="min-h-screen bg-zinc-950">
      <StoryEditor
        story={activeStory}
        onBack={() => setActiveStory(null)}
        onUpdate={handleStoryUpdate}
        onDelete={handleStoryDelete}
      />
    </main>
  );
}
```

- [ ] **Step 6: Verify the editor renders**

Run: `npm run dev`
Open browser → create a new story or open existing → verify the Tiptap editor appears and content is editable. Verify autosave fires (check Supabase chapters table for `content_json` column being populated).

- [ ] **Step 7: Commit**

```bash
git add src/app/components/editor/ src/app/page.tsx
git commit -m "feat: add Tiptap-based StoryEditor with autosave, chapter navigation, and immersive layout"
```

---

## Task 11: Story Bible Panel

**Files:**
- Create: `src/app/components/story-bible/StoryBiblePanel.tsx`
- Create: `src/app/components/story-bible/BibleSection.tsx`
- Create: `src/app/components/story-bible/CharacterCard.tsx`
- Create: `src/app/components/story-bible/WorldEditor.tsx`
- Create: `src/app/components/story-bible/SynopsisEditor.tsx`
- Create: `src/app/components/story-bible/GenreEditor.tsx`
- Create: `src/app/components/story-bible/StyleGuideEditor.tsx`
- Create: `src/app/components/story-bible/OutlineEditor.tsx`
- Create: `src/app/components/story-bible/NotesEditor.tsx`

- [ ] **Step 1: Create BibleSection — collapsible accordion**

Generic accordion component. Click header to expand/collapse. One section open at a time.

- [ ] **Step 2: Create section editors**

Each section editor:
- Receives its JSONB content as props
- Renders inline-editable fields
- Calls `PUT /api/story-bible/[storyId]` on blur with debounce
- Shows skeleton while loading

Key patterns:
- **CharacterCard**: List of character cards. Each card has editable fields (name, role, personality, appearance, voice notes). Add/remove characters.
- **WorldEditor**: Editable text fields for setting, era, customs. Array fields (rules, locations) as tag-like chips with add/remove.
- **SynopsisEditor**: Single textarea, auto-resizes.
- **GenreEditor**: Primary genre dropdown, secondary as tags, warnings as tags.
- **StyleGuideEditor**: Dropdown for POV/tense, text fields for prose/dialogue/pacing.
- **OutlineEditor**: List of chapter entries with status badges. Auto-populated from existing chapters.
- **NotesEditor**: Freeform textarea/markdown.

- [ ] **Step 3: Create StoryBiblePanel — container**

Slide-over panel that:
- Fetches Bible via `GET /api/story-bible/[storyId]` on mount
- Shows loading skeleton while fetching
- Renders 7 BibleSections with appropriate editors
- Header: "Story Bible" title + close button (X)
- "Re-check continuity" button at bottom
- Mobile: full-screen overlay with back button

- [ ] **Step 4: Integrate into StoryEditor**

Replace the placeholder `<div>Story Bible Panel</div>` in StoryEditor with `<StoryBiblePanel>`.

- [ ] **Step 5: Add Bible auto-generation trigger**

In `page.tsx`, after `handleStoryCreated()`:
```typescript
const handleStoryCreated = async (story: Story) => {
  setStories((prev) => [story, ...prev]);
  setActiveStory(story);
  // Auto-generate Bible in background
  fetch("/api/story-bible/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storyId: story.id }),
  }).catch(console.error);
};
```

- [ ] **Step 6: Test end-to-end**

1. Create new story → verify Bible generates after Chapter 1
2. Open story → click Bible icon → verify panel slides in with populated data
3. Edit a character name → verify save (check Supabase)
4. On mobile viewport (375px) → verify Bible becomes full-screen overlay

- [ ] **Step 7: Commit**

```bash
git add src/app/components/story-bible/ src/app/components/editor/StoryEditor.tsx src/app/page.tsx
git commit -m "feat: add Story Bible panel with 7 section editors and auto-generation"
```

---

## Task 12: Craft Tools UI — Floating Toolbar & Bottom Drawer

**Files:**
- Create: `src/app/components/editor/CraftToolbar.tsx`
- Create: `src/app/components/editor/CraftDrawer.tsx`
- Create: `src/app/components/editor/CraftPreview.tsx`
- Create: `src/app/components/editor/useCraftTools.ts`

- [ ] **Step 1: Create useCraftTools hook**

Manages craft tool state: selected tool, loading, result, accept/dismiss. Makes API calls to `/api/craft/{tool}`.

```typescript
export function useCraftTools(storyId: string) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | string[] | null>(null);

  const callTool = async (tool: string, selectedText: string, context: string, direction?: string) => {
    setActiveTool(tool);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/craft/${tool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, selectedText, context, direction }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => { setActiveTool(null); setResult(null); };

  return { activeTool, loading, result, callTool, dismiss };
}
```

- [ ] **Step 2: Create CraftToolbar — floating toolbar for desktop**

Positioned above selection using Tiptap's `BubbleMenu` extension or manual positioning via selection coordinates. Shows 4 buttons: Rewrite (dropdown for directions), Expand, Describe, Brainstorm. When loading, shows spinner. When result available, transitions to CraftPreview.

- [ ] **Step 3: Create CraftDrawer — bottom drawer for mobile**

Slides up from bottom when text is selected. Same 4 buttons in a row. 44px+ touch targets. Dismisses on accept/dismiss or tap outside.

- [ ] **Step 4: Create CraftPreview — diff-style preview**

Shows original text (dimmed/strikethrough) and suggested text (highlighted). Accept/Dismiss buttons. For Describe (array of options), shows 4 cards to pick from. For Brainstorm, shows 5 plot direction cards with title + description + preview.

- [ ] **Step 5: Integrate into StoryEditor**

Add CraftToolbar and CraftDrawer to the StoryEditor component. Use media query or window width to show toolbar (desktop) vs drawer (mobile).

- [ ] **Step 6: Test craft tools**

1. Select text in editor → verify floating toolbar appears (desktop)
2. Click "Rewrite" → pick direction → verify loading → verify result preview
3. Click Accept → verify text is replaced in editor
4. Click Dismiss → verify original text stays
5. Test Expand, Describe, Brainstorm each
6. On mobile viewport → verify bottom drawer appears instead

- [ ] **Step 7: Commit**

```bash
git add src/app/components/editor/CraftToolbar.tsx src/app/components/editor/CraftDrawer.tsx src/app/components/editor/CraftPreview.tsx src/app/components/editor/useCraftTools.ts src/app/components/editor/StoryEditor.tsx
git commit -m "feat: add craft tools UI (floating toolbar, bottom drawer, preview) with Rewrite/Expand/Describe/Brainstorm"
```

---

## Task 13: Continuity Engine — Annotations UI

**Files:**
- Create: `src/app/components/editor/AnnotationTooltip.tsx`
- Modify: `src/app/components/editor/StoryEditor.tsx` (add annotation decorations)
- Modify: `src/app/components/editor/EditorToolbar.tsx` (add badge count)

- [ ] **Step 1: Create AnnotationTooltip**

Tooltip component: shows annotation message, source chapter reference, severity color (yellow=warning, orange=error), Dismiss button.

Desktop: appears on hover over annotated text.
Mobile: appears on tap.

- [ ] **Step 2: Add annotation decorations to Tiptap**

Use Tiptap's decoration system or the Highlight extension to underline text matching annotations. On editor load:
1. Fetch annotations for current chapter via `getChapterAnnotations(chapterId)`
2. For each annotation, search for `text_match` in document
3. If found, add a decoration (yellow/orange underline) at that position
4. Store decoration positions for tooltip rendering

- [ ] **Step 3: Add annotation badge to toolbar**

In EditorToolbar, show badge count: "3 issues" next to the Bible icon. Clicking scrolls to first annotation.

- [ ] **Step 4: Wire up continuity check triggers**

After "Continue Story" generates a new chapter:
1. Call `POST /api/chapters/[chapterId]/summary` to generate summary
2. Call `POST /api/continuity/check` to scan for contradictions
3. Update annotation decorations

Also add "Check continuity" button in Bible panel (from spec 1.5).

- [ ] **Step 5: Test continuity flow**

1. Generate a story with 2+ chapters
2. Verify summary is generated after each chapter
3. Introduce a deliberate contradiction (change eye color)
4. Click "Check continuity" → verify annotation appears
5. Hover → verify tooltip shows issue
6. Click Dismiss → verify annotation disappears

- [ ] **Step 6: Commit**

```bash
git add src/app/components/editor/AnnotationTooltip.tsx src/app/components/editor/StoryEditor.tsx src/app/components/editor/EditorToolbar.tsx
git commit -m "feat: add continuity engine with inline annotations, tooltips, and auto-check"
```

---

## Task 14: Update Continue-Chapter for Smart Context

**Files:**
- Modify: `src/app/api/continue-chapter/route.ts`
- Modify: `src/app/lib/prompts.ts`

- [ ] **Step 1: Update continue-chapter route to use Bible**

```typescript
// Fetch Bible sections for this story
const { data: bibleSections } = await supabase
  .from("story_bibles")
  .select("*")
  .eq("story_id", story.id);

// Format Bible for prompt
const bibleContext = formatBibleForPrompt(buildBibleFromRows(bibleSections));

// Pass to prompt builder
const prompt = buildContinuationPrompt(story, chapterNum, bibleContext);
```

- [ ] **Step 2: Verify smart context budget**

For a story with 5+ chapters, log the prompt length. Verify it's under 50K tokens (roughly 200K characters). The last 2 chapters should be full text, earlier ones should be summaries.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/continue-chapter/route.ts src/app/lib/prompts.ts
git commit -m "feat: integrate Story Bible and smart context budget into continuation prompt"
```

---

## Task 15: Polish & Mobile Testing

**Files:**
- Various component files for CSS/UX fixes

- [ ] **Step 1: Mobile responsiveness pass**

Test at 375px viewport:
- Editor: full-width, no horizontal scroll
- Bible panel: full-screen overlay, not side panel
- Craft drawer: bottom sheet, 44px+ buttons
- Navigation: icons only, no text overflow
- Annotations: tap to show tooltip

Fix any issues found.

- [ ] **Step 2: Loading states**

Verify:
- Bible generation: "Generating Story Bible..." spinner
- Craft tools: inline spinner in toolbar/drawer
- Continue: "Writing the next chapter..." with Loader2 animation
- Chapter summary: silent background (no UI needed)
- Continuity check: "Checking continuity..." badge

- [ ] **Step 3: Transitions & animations**

Verify:
- Bible panel: slides in from right (200-300ms ease)
- Craft toolbar: fades in on selection
- Craft drawer: slides up from bottom
- Annotations: smooth underline appearance
- Chapter switch: content transition (not jarring)

- [ ] **Step 4: Error handling**

Verify:
- API failures show user-friendly error messages
- Network errors don't crash the app
- Bible generation failure allows retry
- Craft tool failures dismiss gracefully

- [ ] **Step 5: Final build check**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: polish UI, mobile responsiveness, loading states, and transitions"
```

---

## Task 16: Clean Up & Final Commit

- [ ] **Step 1: Remove deprecated StoryViewer references**

If StoryViewer is no longer imported anywhere, add a deprecation comment or remove the file entirely (StoryEditor replaces it).

- [ ] **Step 2: Verify full application flow**

End-to-end test:
1. Login → create story → Chapter 1 generates
2. Story Bible auto-generates → open Bible → verify 7 sections populated
3. Edit a character in Bible → save → verify persisted
4. Edit Chapter 1 in Tiptap → verify autosave
5. Continue to Chapter 2 → verify continuity check runs
6. Select text → use Rewrite tool → accept suggestion
7. Use Expand, Describe, Brainstorm tools
8. Check mobile layout at 375px
9. Export story to .txt → verify Chapter objects export correctly

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 Writing Studio Foundation"
```
