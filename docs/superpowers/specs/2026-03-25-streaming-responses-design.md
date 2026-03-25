# Streaming Responses — Design Spec

**Goal:** Add streaming to the two story generation API routes (`generate-story` and `continue-chapter`) so users see text appear word-by-word instead of waiting 15-25 seconds for a full response.

**Scope:** Two API routes, one new utility, client-side changes in CreateStoryTab and StoryEditor. No new pages, no new dependencies (ProseMirror decorations available via existing `@tiptap/pm`), no architectural changes.

**Devices:** All — streaming works identically on desktop and mobile.

---

## API Routes (Server Side)

Both `generate-story` and `continue-chapter` switch from `anthropic.messages.create()` to `anthropic.messages.stream()`. Instead of returning JSON, they return a `ReadableStream` using the Web Streams API with Server-Sent Events (SSE) format.

### SSE Event Types

| Event | Data | Sent by |
|-------|------|---------|
| `title` | Extracted story title string | `generate-story` only |
| `delta` | Text chunk (token or small group of tokens) | Both routes |
| `done` | `{}` | Both routes |
| `error` | Error message string | Both routes |

### generate-story Streaming

The Claude prompt produces output starting with `Title: Some Title\n` followed by chapter text. The route buffers tokens until the first newline, extracts the title, then:

1. Emits `event: title` with the extracted title
2. Emits `event: delta` for each subsequent text chunk
3. Emits `event: done` when the stream completes

Auth + validation still happen before the stream starts. If auth fails or validation fails, the route returns a normal JSON error response (not SSE).

### continue-chapter Streaming

Simpler — no title parsing. The route:

1. Performs auth, fetches story + bible from Supabase, builds the prompt (all before streaming starts)
2. Emits `event: delta` for each text chunk
3. Emits `event: done` when complete

**Important:** The `continue-chapter` route does NOT pre-create an empty chapter. The client sends only `{ storyId }` as before. The server fetches the story, counts existing chapters to determine `chapterNum`, builds the prompt, and streams. The client creates the DB chapter record *after* streaming completes (same as current flow, just deferred). This avoids the race condition where the server would see an empty chapter in its query.

### Mid-Stream Error Handling

If the Anthropic API errors during an active stream (rate limit, context length, network timeout), the route catches the error from the stream iterator and emits an `event: error` with the error message. The stream then closes. The client displays the error and keeps whatever text was accumulated (if any).

### SSE Wire Format

```
event: title
data: The Morning After

event: delta
data: The morning sun cast

event: delta
data: long shadows across

event: done
data: {}
```

**Newline handling:** SSE spec requires that data containing newlines be split across multiple `data:` lines. In practice, Anthropic's streaming tokens rarely contain newlines (tokens are typically words/punctuation), but the SSE writer must handle this: any `\n` in a chunk becomes a separate `data:` line. The client parser reassembles multi-line data by joining with `\n`.

### `max_tokens`

Both routes keep `max_tokens: 2000`, same as current. This can be revisited later — streaming makes longer generation more tolerable, but changing output length is a separate product decision.

---

## Client: CreateStoryTab → generate-story

**Current flow:** Form submit → fetch JSON → `createStoryInDB` (with chapter content) → `onStoryCreated(story)` → editor renders with complete chapter.

**New flow:**

1. Form submit → `createStoryInDB` with placeholder first chapter (content: `" "`, title: `"Generating..."`) → `onStoryCreated(story, formData)` → editor renders immediately
2. `StoryEditor` detects it received a story with streaming form data via new `streamingFormData` prop
3. Editor kicks off the streaming fetch to `/api/generate-story` on mount (via `useEffect`), reads SSE events
4. `title` event → updates story title in state + calls `updateStoryTitle(storyId, title)` to persist
5. `delta` events → progressively inserts text into Tiptap editor
6. `done` event → saves final chapter content to DB via `updateChapterContent`, clears streaming state, triggers background story bible generation

**Key change:** `CreateStoryTab` no longer calls the generation API itself. It creates the DB record (placeholder chapter) and hands off. `StoryEditor` owns the streaming lifecycle.

**`createStoryInDB` modification:** The function is modified to accept an optional `firstChapterContent` parameter. When omitted or empty, it creates the chapter with a single space (`" "`) and `word_count: 0`. This keeps the function's existing contract while supporting the streaming flow.

**Props changes:**
- `CreateStoryTabProps.onStoryCreated` signature changes to `(story: Story, formData?: StoryFormData) => void`
- `page.tsx` stores `streamingFormData` in state alongside `activeStory`, passes it to `StoryEditor`
- `StoryEditorProps` gains optional `streamingFormData?: StoryFormData` prop
- `StoryEditor` consumes `streamingFormData` in a mount `useEffect` and clears it after streaming starts

**Story bible generation:** Currently triggered in `page.tsx` `handleStoryCreated`. Under the new flow, this is deferred — the editor triggers it after streaming completes (in the `done` handler), so the bible is generated against the full chapter content, not an empty placeholder.

---

## Client: StoryEditor → continue-chapter

**Current flow:** Click Continue → fetch JSON → `addChapterToDB` → update state → jump to new chapter.

**New flow:**

1. Click Continue → set streaming state → jump to new empty chapter view (no DB write yet)
2. Start streaming fetch to `/api/continue-chapter` with `{ storyId }`
3. `delta` events → progressively insert text into Tiptap with pulsing cursor
4. `done` event → save completed chapter to DB via `addChapterToDB`, update story state, clear streaming state, kick off post-generation pipeline (summary + continuity check)

**Key difference from generate-story flow:** No pre-created empty chapter in DB. The chapter is only saved after streaming completes. This avoids the server seeing a phantom empty chapter when it queries the story to build the continuation prompt.

**During streaming, the UI:**

- Disables the Continue button
- Disables craft tools (can't run craft on text still being generated)
- Shows the pulsing cursor at the end of the streaming text
- Allows the user to scroll up to read earlier parts while new text appears

---

## Streaming State

Lives in `StoryEditor` as a simple object:

```typescript
interface StreamingState {
  active: boolean;
  fullText: string;     // accumulated text so far
  source: "generate" | "continue";
}
```

`fullText` accumulates every delta for DB save when done. Tiptap gets tokens inserted via `editor.commands.insertContent(chunk)` as each delta arrives.

---

## Pulsing Cursor

A CSS-only element — a small `span` with a purple pulsing animation. Implemented as a Tiptap/ProseMirror widget decoration at the end of the document so it sits inline with the text and doesn't affect actual document content.

**Pre-first-token state:** Between clicking Generate/Continue and the first delta arriving, show a subtle "Generating..." text with the pulsing cursor in the editor area. Once the first token arrives, that placeholder is replaced by the actual streaming text.

---

## SSE Stream Reader Utility

One small utility function in `src/app/lib/stream.ts`:

```typescript
async function readSSEStream(
  response: Response,
  callbacks: {
    onTitle?: (title: string) => void;
    onDelta: (text: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }
): Promise<void>
```

Reads the response body as a `ReadableStream`, parses SSE `event:` and `data:` lines, calls appropriate callbacks. Handles chunked reads (partial lines across chunks) and multi-line `data:` fields (reassembles with `\n`). Approximately 40-60 lines, no library needed.

API routes use a `TextEncoder` instance to encode SSE-formatted strings into the `ReadableStream` controller via `controller.enqueue(encoder.encode(...))`.

---

## DB Save Strategy

**Current:** API returns full text → client saves to DB in one call.

**New:** Client accumulates text during streaming → saves to DB once after `done` event.

- **generate-story:** Story record + placeholder chapter created before streaming starts (content: `" "`, title: `"Generating..."`). After streaming completes, update chapter content via `updateChapterContent` and story title via `updateStoryTitle`. If user closes tab mid-stream, they get a story with a placeholder chapter — they can delete or re-generate.
- **continue-chapter:** No pre-created chapter. The chapter is only saved to DB after streaming completes via existing `addChapterToDB`. If user closes tab mid-stream, no orphan chapter is created.

No server-side saves during streaming needed.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/generate-story/route.ts` | Switch to `messages.stream()`, emit SSE events with title buffering |
| `src/app/api/continue-chapter/route.ts` | Switch to `messages.stream()`, emit SSE events |
| `src/app/lib/stream.ts` | **New file** — SSE stream reader utility |
| `src/app/components/CreateStoryTab.tsx` | Remove API call, create placeholder story, pass formData to callback |
| `src/app/page.tsx` | Store `streamingFormData` in state, pass to StoryEditor, defer bible generation |
| `src/app/components/editor/StoryEditor.tsx` | Add `streamingFormData` prop, streaming state, progressive Tiptap insertion, pulsing cursor, DB save on completion, trigger bible generation after stream |
| `src/app/lib/supabase/stories.ts` | Modify `createStoryInDB` to accept optional empty content, add `updateStoryTitle` helper, add `updateChapterContent` helper |

---

## Out of Scope

- Streaming for craft tool routes (rewrite, expand, describe, brainstorm) — future pass
- Streaming for story-bible/generate and continuity/check — background tasks, no user wait
- AbortController / cancel generation mid-stream — nice-to-have, not in this pass
- Token count display during streaming
- Retry/resume interrupted streams
