# Streaming Responses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add word-by-word streaming to `generate-story` and `continue-chapter` API routes so users see text appear instantly instead of waiting 15-25 seconds.

**Architecture:** Server routes switch from `anthropic.messages.create()` to `anthropic.messages.stream()` and emit Server-Sent Events. A new client-side SSE reader utility parses the stream. `StoryEditor` gains streaming state and progressively inserts tokens into Tiptap. `CreateStoryTab` creates a placeholder story record and hands off to the editor for streaming.

**Tech Stack:** Next.js 16+ (App Router), Anthropic SDK v0.80.0 (`messages.stream()`), Tiptap 2, ProseMirror decorations (`@tiptap/pm`), Supabase Postgres

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/lib/stream.ts` | Create | SSE stream reader utility + SSE formatter |
| `src/app/api/generate-story/route.ts` | Modify | Switch to streaming SSE with title buffering |
| `src/app/api/continue-chapter/route.ts` | Modify | Switch to streaming SSE |
| `src/app/lib/supabase/stories.ts` | Modify | Add `updateStoryTitle`, `updateChapterContent` helpers |
| `src/app/components/CreateStoryTab.tsx` | Modify | Remove API call, create placeholder story, pass formData |
| `src/app/page.tsx` | Modify | Store streamingFormData, pass to StoryEditor, defer bible |
| `src/app/components/editor/StoryEditor.tsx` | Modify | Add streamingFormData prop, streaming state, progressive insertion, pulsing cursor |

---

### Task 1: SSE Stream Reader Utility

**Files:**
- Create: `src/app/lib/stream.ts`

- [ ] **Step 1: Create the SSE stream reader**

```typescript
// src/app/lib/stream.ts

/**
 * Format a string as an SSE event (server-side).
 * Handles newlines in data by splitting across multiple data: lines.
 */
export function sseEvent(event: string, data: string): string {
  const dataLines = data.split("\n").map((line) => `data: ${line}`).join("\n");
  return `event: ${event}\n${dataLines}\n\n`;
}

export interface SSECallbacks {
  onTitle?: (title: string) => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Reads a Server-Sent Events stream from a fetch Response.
 * Handles chunked reads, partial lines across chunks, and multi-line data fields.
 */
export async function readSSEStream(
  response: Response,
  callbacks: SSECallbacks
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("Response body is not readable");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";
  let currentData: string[] = [];

  function dispatchEvent() {
    if (!currentEvent && currentData.length === 0) return;
    const data = currentData.join("\n");
    currentData = [];

    switch (currentEvent) {
      case "title":
        callbacks.onTitle?.(data);
        break;
      case "delta":
        callbacks.onDelta(data);
        break;
      case "done":
        callbacks.onDone();
        break;
      case "error":
        callbacks.onError(data);
        break;
    }
    currentEvent = "";
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line === "") {
          // Empty line = end of event
          dispatchEvent();
        } else if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData.push(line.slice(6));
        }
      }
    }
    // Handle any remaining data in buffer
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          currentData.push(line.slice(6));
        }
      }
    }
    // Dispatch any final event
    dispatchEvent();
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : "Stream read failed");
  } finally {
    reader.releaseLock();
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/stream.ts
git commit -m "feat: add SSE stream reader utility"
```

---

### Task 2: generate-story Streaming API Route

**Files:**
- Modify: `src/app/api/generate-story/route.ts`

**Context:** The current route calls `anthropic.messages.create()`, waits for the full response, parses `Title: ...` from the first line, and returns JSON `{ title, chapter }`. We switch to `messages.stream()` and emit SSE events. Auth + validation stay before the stream. The title is extracted by buffering tokens until the first newline.

- [ ] **Step 1: Replace the route with streaming version**

Replace the entire contents of `src/app/api/generate-story/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { StoryFormData } from "../../types/story";
import { buildChapter1Prompt } from "../../lib/prompts";
import { createServerSupabase } from "../../lib/supabase/server";
import { sseEvent } from "../../lib/stream";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: StoryFormData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.characters ||
    !Array.isArray(body.characters) ||
    body.characters.filter((c: string) => c.trim().length > 0).length < 2 ||
    !body.tone ||
    !Array.isArray(body.tone) ||
    body.tone.length < 1 ||
    !body.rating ||
    !body.relationshipType
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const prompt = buildChapter1Prompt(body);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });

        let titleBuffer = "";
        let titleEmitted = false;

        anthropicStream.on("text", (text) => {
          if (!titleEmitted) {
            titleBuffer += text;
            const newlineIdx = titleBuffer.indexOf("\n");
            if (newlineIdx !== -1) {
              // Extract title from "Title: ..." line
              const titleLine = titleBuffer.substring(0, newlineIdx);
              const titleMatch = titleLine.match(/^Title:\s*(.+?)$/);
              const title = titleMatch ? titleMatch[1].trim() : "Untitled Story";
              controller.enqueue(encoder.encode(sseEvent("title", title)));
              titleEmitted = true;

              // Emit any remaining text after the title line
              const remainder = titleBuffer.substring(newlineIdx + 1).trimStart();
              if (remainder) {
                controller.enqueue(encoder.encode(sseEvent("delta", remainder)));
              }
            }
          } else {
            controller.enqueue(encoder.encode(sseEvent("delta", text)));
          }
        });

        anthropicStream.on("error", (err) => {
          const message = err instanceof Error ? err.message : "Generation failed";
          controller.enqueue(encoder.encode(sseEvent("error", message)));
          controller.close();
        });

        // Wait for the stream to finish
        await anthropicStream.finalMessage();
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(sseEvent("error", message)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate-story/route.ts
git commit -m "feat: switch generate-story to streaming SSE"
```

---

### Task 3: continue-chapter Streaming API Route

**Files:**
- Modify: `src/app/api/continue-chapter/route.ts`

**Context:** The current route fetches story + bible, builds a continuation prompt, calls `anthropic.messages.create()`, and returns JSON `{ chapter }`. We switch to streaming SSE. All the Supabase fetching + prompt building happens before the stream starts.

- [ ] **Step 1: Replace the route with streaming version**

Replace the entire contents of `src/app/api/continue-chapter/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "../../lib/supabase/server";
import { buildContinuationPrompt } from "../../lib/prompts";
import { formatBibleForPrompt } from "../../lib/prompts/bible";
import { Story, Chapter } from "../../types/story";
import {
  BibleSectionType,
  BibleSectionContent,
  BibleSection,
  StoryBible,
} from "../../types/bible";
import { sseEvent } from "../../lib/stream";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  let body: { storyId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { storyId } = body;

  if (!storyId) {
    return NextResponse.json(
      { error: "storyId is required" },
      { status: 400 }
    );
  }

  // Auth check
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch story server-side
  const { data, error } = await supabase
    .from("stories")
    .select("*, chapters(id, content, content_json, summary, chapter_number, word_count)")
    .eq("id", storyId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  // Build Story object from DB data
  const chapters = (
    data.chapters as Array<{
      id: string;
      content: string;
      content_json?: object;
      summary?: string;
      chapter_number: number;
      word_count: number;
    }>
  )
    .sort((a, b) => a.chapter_number - b.chapter_number)
    .map((ch): Chapter => ({
      id: ch.id,
      chapterNumber: ch.chapter_number,
      content: ch.content,
      contentJson: ch.content_json || undefined,
      summary: ch.summary || undefined,
      wordCount: ch.word_count,
    }));

  const story: Story = {
    id: data.id as string,
    title: data.title as string,
    chapters,
    fandom: data.fandom as string,
    customFandom: (data.custom_fandom as string) || undefined,
    characters: data.characters as string[],
    relationshipType: data.relationship_type as Story["relationshipType"],
    rating: data.rating as Story["rating"],
    setting: (data.setting as string) || undefined,
    tone: data.tone as string[],
    tropes: data.tropes as string[],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    wordCount: data.word_count as number,
  };

  if (!story.chapters || story.chapters.length === 0) {
    return NextResponse.json(
      { error: "Story with at least one chapter is required" },
      { status: 400 }
    );
  }

  const chapterNum = story.chapters.length + 1;

  // Fetch Bible sections for smart context
  const { data: bibleSectionsData } = await supabase
    .from("story_bibles")
    .select("*")
    .eq("story_id", storyId);

  let bibleContext = "";
  if (bibleSectionsData && bibleSectionsData.length > 0) {
    const ALL_SECTION_TYPES: BibleSectionType[] = [
      "characters",
      "world",
      "synopsis",
      "genre",
      "style_guide",
      "outline",
      "notes",
    ];
    const sections = Object.fromEntries(
      ALL_SECTION_TYPES.map((t) => [t, null])
    ) as Record<BibleSectionType, BibleSection | null>;

    for (const row of bibleSectionsData) {
      sections[row.section_type as BibleSectionType] = {
        id: row.id as string,
        storyId: row.story_id as string,
        sectionType: row.section_type as BibleSectionType,
        content: row.content as BibleSectionContent,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      };
    }

    const bible: StoryBible = { storyId, sections };
    bibleContext = formatBibleForPrompt(bible);
  }

  const prompt = buildContinuationPrompt(story, chapterNum, bibleContext);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });

        anthropicStream.on("text", (text) => {
          controller.enqueue(encoder.encode(sseEvent("delta", text)));
        });

        anthropicStream.on("error", (err) => {
          const message = err instanceof Error ? err.message : "Generation failed";
          controller.enqueue(encoder.encode(sseEvent("error", message)));
          controller.close();
        });

        await anthropicStream.finalMessage();
        controller.enqueue(encoder.encode(sseEvent("done", "{}")));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(sseEvent("error", message)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/continue-chapter/route.ts
git commit -m "feat: switch continue-chapter to streaming SSE"
```

---

### Task 4: Supabase Helper Functions

**Files:**
- Modify: `src/app/lib/supabase/stories.ts`

**Context:** The streaming flow needs two new helpers: `updateStoryTitle` (to persist the title extracted mid-stream) and `updateChapterContent` (to save the accumulated chapter text after streaming completes). Also modify `createStoryInDB` to accept an optional placeholder chapter.

- [ ] **Step 1: Modify createStoryInDB to support placeholder chapters**

In `src/app/lib/supabase/stories.ts`, change the `CreateStoryInput` interface (lines 6-18) and `createStoryInDB` function (lines 51-93).

Change the interface from:
```typescript
export interface CreateStoryInput {
  title: string;
  firstChapterContent: string;
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
```
to:
```typescript
export interface CreateStoryInput {
  title: string;
  firstChapterContent?: string;
  fandom: string;
  customFandom?: string;
  characters: string[];
  relationshipType: RelationshipType;
  rating: Rating;
  setting?: string;
  tone: string[];
  tropes: string[];
  wordCount?: number;
}
```

Also update the story insert (line 72) to default `word_count` to 0. Change:
```typescript
      word_count: input.wordCount,
```
to:
```typescript
      word_count: input.wordCount ?? 0,
```

Change the chapter insert block (lines 80-87) from:
```typescript
  // Insert first chapter
  const { error: chapError } = await supabase
    .from("chapters")
    .insert({
      story_id: dbStory.id,
      chapter_number: 1,
      content: input.firstChapterContent,
      word_count: input.firstChapterContent.split(/\s+/).length,
    });
```
to:
```typescript
  // Insert first chapter
  const chapterContent = input.firstChapterContent || " ";
  const { error: chapError } = await supabase
    .from("chapters")
    .insert({
      story_id: dbStory.id,
      chapter_number: 1,
      content: chapterContent,
      word_count: chapterContent.trim() ? chapterContent.split(/\s+/).length : 0,
    });
```

- [ ] **Step 2: Add updateStoryTitle helper**

Add after the `addChapterToDB` function (after line 124):

```typescript
/** Update a story's title */
export async function updateStoryTitle(
  storyId: string,
  title: string
): Promise<boolean> {
  const { error } = await supabase
    .from("stories")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", storyId);
  return !error;
}
```

- [ ] **Step 3: Add updateChapterContent helper**

Add after the new `updateStoryTitle` function:

```typescript
/** Update a chapter's content and word count */
export async function updateChapterContent(
  chapterId: string,
  content: string
): Promise<boolean> {
  const wordCount = content.trim() ? content.split(/\s+/).length : 0;
  const { error } = await supabase
    .from("chapters")
    .update({ content, word_count: wordCount })
    .eq("id", chapterId);
  return !error;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/supabase/stories.ts
git commit -m "feat: add updateStoryTitle and updateChapterContent helpers, support placeholder chapters"
```

---

### Task 5: CreateStoryTab — Hand Off to Editor

**Files:**
- Modify: `src/app/components/CreateStoryTab.tsx`

**Context:** Currently `CreateStoryTab` calls `/api/generate-story`, waits for the full JSON response, saves to DB, then calls `onStoryCreated(story)`. We change it to: create a placeholder story in DB (title: "Generating...", empty chapter), then call `onStoryCreated(story, formData)` so the editor can start streaming.

- [ ] **Step 1: Update the component**

In `src/app/components/CreateStoryTab.tsx`, change the `CreateStoryTabProps` interface (line 15-17) from:
```typescript
interface CreateStoryTabProps {
  onStoryCreated: (story: Story) => void;
}
```
to:
```typescript
interface CreateStoryTabProps {
  onStoryCreated: (story: Story, formData: StoryFormData) => void;
}
```

Replace the `handleSubmit` function (lines 44-89) with:
```typescript
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const formData: StoryFormData = {
      fandom: fandom === "custom" ? "" : fandom,
      customFandom: fandom === "custom" ? customFandom : undefined,
      characters: characters.filter((c) => c.trim().length > 0),
      relationshipType,
      rating,
      setting: setting.trim() || undefined,
      tone,
      tropes,
    };

    try {
      // Create placeholder story — editor will stream the actual content
      const story = await createStoryInDB({
        title: "Generating...",
        ...formData,
      });

      if (!story) throw new Error("Failed to create story");
      onStoryCreated(story, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
```

Also remove the unused `GenerateResponse` import. Change line 11 from:
```typescript
import { Story, StoryFormData, GenerateResponse, RelationshipType, Rating } from "../types/story";
```
to:
```typescript
import { Story, StoryFormData, RelationshipType, Rating } from "../types/story";
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build may show type error in `page.tsx` since `onStoryCreated` callback signature changed — that's expected and will be fixed in next task.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/CreateStoryTab.tsx
git commit -m "feat: CreateStoryTab creates placeholder story and hands off to editor"
```

---

### Task 6: page.tsx — Pass Streaming Form Data

**Files:**
- Modify: `src/app/page.tsx`

**Context:** `page.tsx` is the main app component. It renders `CreateStoryTab` and `StoryEditor`. We need to: (1) store `streamingFormData` in state, (2) pass it to `StoryEditor`, (3) move story bible generation out of `handleStoryCreated` (it will be triggered by the editor after streaming completes).

- [ ] **Step 1: Update page.tsx**

Add the `StoryFormData` import. Change line 8 from:
```typescript
import { Story } from "./types/story";
```
to:
```typescript
import { Story, StoryFormData } from "./types/story";
```

Add a new state variable after `activeStory` state (after line 18):
```typescript
  const [streamingFormData, setStreamingFormData] = useState<StoryFormData | null>(null);
```

Replace `handleStoryCreated` (lines 33-43) with:
```typescript
  const handleStoryCreated = (story: Story, formData: StoryFormData) => {
    setStories((prev) => [story, ...prev]);
    setActiveStory(story);
    setStreamingFormData(formData);
    // NOTE: story bible generation is deferred until after streaming completes
    // (triggered by StoryEditor's done handler)
  };
```

Update the `StoryEditor` render (lines 61-66) from:
```typescript
      <StoryEditor
        story={activeStory}
        onBack={() => setActiveStory(null)}
        onUpdate={handleStoryUpdate}
        onDelete={handleStoryDelete}
      />
```
to:
```typescript
      <StoryEditor
        story={activeStory}
        streamingFormData={streamingFormData}
        onBack={() => { setActiveStory(null); setStreamingFormData(null); }}
        onUpdate={handleStoryUpdate}
        onDelete={handleStoryDelete}
        onStreamingComplete={() => setStreamingFormData(null)}
      />
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Build may show type errors in `StoryEditor` since props changed — that's expected and will be fixed in next task.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: pass streamingFormData from page to StoryEditor"
```

---

### Task 7: StoryEditor — Streaming Integration

**Files:**
- Modify: `src/app/components/editor/StoryEditor.tsx`

**Context:** This is the largest change. `StoryEditor` gains: (1) new props for streaming, (2) a `StreamingState` interface, (3) a `useEffect` that starts streaming on mount when `streamingFormData` is provided, (4) a rewritten `handleContinue` that streams instead of fetching JSON, (5) a pulsing cursor via ProseMirror decoration, (6) UI guards that disable controls during streaming.

- [ ] **Step 1: Add new imports and props**

Add the stream utility import after the existing imports (after line 21):
```typescript
import { readSSEStream } from "../../lib/stream";
import { updateStoryTitle, updateChapterContent } from "../../lib/supabase/stories";
import { StoryFormData } from "../../types/story";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/core";
```

Change the `StoryEditorProps` interface (lines 23-28) from:
```typescript
interface StoryEditorProps {
  story: Story;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
}
```
to:
```typescript
interface StoryEditorProps {
  story: Story;
  streamingFormData?: StoryFormData | null;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
  onStreamingComplete?: () => void;
}
```

Update the destructuring (line 59-64) from:
```typescript
export default function StoryEditor({
  story,
  onBack,
  onUpdate,
  onDelete,
}: StoryEditorProps) {
```
to:
```typescript
export default function StoryEditor({
  story,
  streamingFormData,
  onBack,
  onUpdate,
  onDelete,
  onStreamingComplete,
}: StoryEditorProps) {
```

- [ ] **Step 2: Add streaming state and pulsing cursor extension**

Add after the `useMediaQuery` function and before `StoryEditor` component (after line 57, before `export default`):

```typescript
/** Streaming cursor decoration — pulsing purple cursor at end of doc */
const streamingCursorKey = new PluginKey("streamingCursor");

function createStreamingCursorExtension(isActive: () => boolean) {
  return Extension.create({
    name: "streamingCursor",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: streamingCursorKey,
          props: {
            decorations(state) {
              if (!isActive()) return DecorationSet.empty;
              const pos = state.doc.content.size;
              const cursorEl = document.createElement("span");
              cursorEl.className = "streaming-cursor";
              cursorEl.innerHTML = "&#8203;"; // zero-width space
              return DecorationSet.create(state.doc, [
                Decoration.widget(pos, cursorEl, { side: 1 }),
              ]);
            },
          },
        }),
      ];
    },
  });
}
```

Add inside the `StoryEditor` component, after the annotations state (after line 87):

```typescript
  // Streaming state
  const [streaming, setStreaming] = useState<{
    active: boolean;
    fullText: string;
    source: "generate" | "continue";
  }>({ active: false, fullText: "", source: "generate" });
  const streamingRef = useRef(streaming);
  streamingRef.current = streaming;

  // Ref to track latest story prop — avoids stale closures in streaming callbacks
  const storyRef = useRef(story);
  storyRef.current = story;
```

- [ ] **Step 2b: Guard chapter content sync effect against streaming**

The existing `useEffect` that syncs editor content when `currentChapterIdx` changes (around line 300-310) must skip during streaming to avoid overwriting streamed content. Change it from:

```typescript
  useEffect(() => {
    if (!editor) return;
    const content = getChapterContent(currentChapterIdx);
    // Only set content if it differs from what we computed on mount
    if (initialContentRef.current === null) {
      initialContentRef.current = content;
      return; // Skip first render, editor already has this content
    }
    editor.commands.setContent(content);
    initialContentRef.current = content;
  }, [editor, currentChapterIdx, getChapterContent]);
```
to:
```typescript
  useEffect(() => {
    if (!editor) return;
    // Skip content sync during streaming — streaming manages editor content directly
    if (streamingRef.current.active) return;
    const content = getChapterContent(currentChapterIdx);
    // Only set content if it differs from what we computed on mount
    if (initialContentRef.current === null) {
      initialContentRef.current = content;
      return; // Skip first render, editor already has this content
    }
    editor.commands.setContent(content);
    initialContentRef.current = content;
  }, [editor, currentChapterIdx, getChapterContent]);
```

- [ ] **Step 3: Add streaming cursor extension to editor**

The `createStreamingCursorExtension` needs to be instantiated with a stable reference. Add after the streaming state:

```typescript
  const streamingCursorExtension = useRef(
    createStreamingCursorExtension(() => streamingRef.current.active)
  ).current;
```

Then add `streamingCursorExtension` to the editor extensions array. Change the `extensions` array in `useEditor` (lines 106-111) from:
```typescript
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      CharacterCount,
      AnnotationExtension,
    ],
```
to:
```typescript
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      CharacterCount,
      AnnotationExtension,
      streamingCursorExtension,
    ],
```

- [ ] **Step 4: Add CSS for the pulsing cursor**

Add a `<style>` tag in the component's return JSX. Inside the outermost `<div>` (line 412), add as the first child:

```tsx
      <style>{`
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background: #a855f7;
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: pulse-cursor 1s ease-in-out infinite;
        }
        @keyframes pulse-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
```

- [ ] **Step 5: Add generate-story streaming effect**

Add a `useEffect` that triggers streaming when `streamingFormData` is provided. Add after the chapter content sync effect (after line 310):

```typescript
  // Stream chapter 1 when entering editor with streamingFormData
  useEffect(() => {
    if (!streamingFormData || !editor) return;

    const chapter = story.chapters[0];
    if (!chapter) return;

    // Clear placeholder content and start streaming
    editor.commands.setContent({ type: "doc", content: [] });
    setStreaming({ active: true, fullText: "", source: "generate" });

    let accumulated = "";

    const startStream = async () => {
      try {
        const res = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(streamingFormData),
        });

        if (!res.ok) {
          let errorMsg = "Failed to generate story";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          } catch {}
          setError(errorMsg);
          setStreaming({ active: false, fullText: "", source: "generate" });
          return;
        }

        await readSSEStream(res, {
          onTitle: (title) => {
            // Fire-and-forget DB update; use storyRef to avoid stale closure
            updateStoryTitle(storyRef.current.id, title).catch(() => {});
            onUpdate({ ...storyRef.current, title });
          },
          onDelta: (text) => {
            accumulated += text;
            setStreaming((prev) => ({ ...prev, fullText: accumulated }));
            editor.commands.insertContent(text);
          },
          onDone: () => {
            setStreaming({ active: false, fullText: "", source: "generate" });
            const latestStory = storyRef.current;
            const ch = latestStory.chapters[0];
            // Save accumulated content to DB
            if (ch) {
              updateChapterContent(ch.id, accumulated).catch(() => {});
            }
            // Update word count — read from storyRef to get latest (includes title update)
            const wordCount = accumulated.trim() ? accumulated.split(/\s+/).length : 0;
            const updatedStory = {
              ...latestStory,
              wordCount,
              chapters: latestStory.chapters.map((c, i) =>
                i === 0 ? { ...c, content: accumulated, wordCount } : c
              ),
            };
            onUpdate(updatedStory);
            onStreamingComplete?.();
            // Trigger story bible generation now that we have content
            fetch("/api/story-bible/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storyId: latestStory.id }),
            }).catch(() => {});
          },
          onError: (errorMsg) => {
            setError(errorMsg);
            setStreaming({ active: false, fullText: "", source: "generate" });
            // Save whatever we accumulated
            const ch = storyRef.current.chapters[0];
            if (accumulated && ch) {
              updateChapterContent(ch.id, accumulated).catch(() => {});
            }
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Streaming failed");
        setStreaming({ active: false, fullText: "", source: "generate" });
      }
    };

    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingFormData, editor]);
```

- [ ] **Step 6: Rewrite handleContinue for streaming**

Replace the entire `handleContinue` function (lines 313-386) with:

```typescript
  const handleContinue = async () => {
    if (streaming.active) return;
    setLoading(true);
    setError("");

    try {
      await flush();

      const chapterNum = story.chapters.length + 1;

      // Jump to new empty chapter view
      setCurrentChapterIdx(story.chapters.length); // will be out of bounds briefly
      editor?.commands.setContent({ type: "doc", content: [] });
      setStreaming({ active: true, fullText: "", source: "continue" });

      let accumulated = "";

      const res = await fetch("/api/continue-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to continue story";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      await readSSEStream(res, {
        onDelta: (text) => {
          accumulated += text;
          setStreaming((prev) => ({ ...prev, fullText: accumulated }));
          editor?.commands.insertContent(text);
        },
        onDone: async () => {
          setStreaming({ active: false, fullText: "", source: "continue" });
          setLoading(false);

          // Save chapter to DB
          const updated = await addChapterToDB(story.id, chapterNum, accumulated);
          if (!updated) {
            setError("Failed to save chapter");
            return;
          }
          onUpdate(updated);
          setCurrentChapterIdx(updated.chapters.length - 1);

          // Post-generation pipeline (non-blocking)
          const newChapter = updated.chapters[updated.chapters.length - 1];
          if (newChapter?.id) {
            fetch(`/api/chapters/${newChapter.id}/summary`, { method: "POST" }).catch(() => {});

            fetch("/api/continuity/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                storyId: story.id,
                chapterId: newChapter.id,
              }),
            })
              .then(async (checkRes) => {
                if (checkRes.ok) {
                  const checkData = await checkRes.json();
                  if (checkData.annotations && checkData.annotations.length > 0) {
                    const newAnnotations: ChapterAnnotation[] = checkData.annotations.map(
                      (a: { text: string; issue: string; sourceChapter: number; severity: string }, idx: number) => ({
                        id: `temp-${idx}-${Date.now()}`,
                        chapterId: newChapter.id,
                        textMatch: a.text,
                        annotationType: "continuity",
                        message: a.issue,
                        sourceChapter: String(a.sourceChapter),
                        severity: a.severity,
                        dismissed: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      })
                    );
                    setAnnotations(newAnnotations);
                  }
                }
              })
              .catch(() => {});
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setStreaming({ active: false, fullText: "", source: "continue" });
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStreaming({ active: false, fullText: "", source: "continue" });
      setLoading(false);
    }
  };
```

- [ ] **Step 7: Add UI guards during streaming**

The Continue button and craft tools should be disabled during streaming. Find the `EditorFooter` render in the return JSX and update the `loading` prop. The footer component already accepts a `loading` prop — update it to also be true during streaming.

Find where `EditorFooter` is rendered and change:
```
loading={loading}
```
to:
```
loading={loading || streaming.active}
```

Similarly, for craft tool invocations, find `handleCraftTool` and add a guard at the top:
```typescript
    if (streaming.active) return;
```

- [ ] **Step 8: Add pre-first-token placeholder**

In the editor area, when streaming is active but no text has arrived yet, show a "Generating..." placeholder. Find the `EditorContent` render in the JSX and add a conditional element above it:

```tsx
        {streaming.active && streaming.fullText === "" && (
          <div className="px-4 sm:px-8 py-6 text-zinc-500 text-sm flex items-center gap-2">
            <span className="streaming-cursor" style={{ height: '0.9em' }} />
            Generating...
          </div>
        )}
```

- [ ] **Step 9: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 10: Commit**

```bash
git add src/app/components/editor/StoryEditor.tsx
git commit -m "feat: add streaming support to StoryEditor with progressive Tiptap insertion"
```

---

### Task 8: Integration Test — Manual Verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test Chapter 1 streaming**

1. Open the app in browser
2. Fill out the story creation form (pick any fandom, 2+ characters, a tone)
3. Click "Start My Story"
4. **Verify:** Editor opens immediately with "Generating..." placeholder and pulsing cursor
5. **Verify:** Text starts appearing word-by-word within ~1 second
6. **Verify:** Story title updates from "Generating..." to the actual title
7. **Verify:** After streaming completes, the pulsing cursor disappears
8. **Verify:** The chapter content is saved (refresh the page, reopen the story)

- [ ] **Step 3: Test Continue Chapter streaming**

1. Open an existing story with at least 1 chapter
2. Click "Continue"
3. **Verify:** Editor shows empty new chapter with "Generating..." and pulsing cursor
4. **Verify:** Text streams in word-by-word
5. **Verify:** After streaming completes, cursor disappears, controls re-enable
6. **Verify:** Chapter is saved and appears in chapter navigation

- [ ] **Step 4: Test error handling**

1. Temporarily set an invalid API key in `.env.local`
2. Try generating a story
3. **Verify:** Error message appears after a brief moment
4. Restore the correct API key

- [ ] **Step 5: Commit any fixes**

```bash
git add -u
git commit -m "fix: integration test fixes for streaming"
```
