# Fiction Flow Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose StoryEditor (1,058→~400 lines) and ArtifactsTab (2,646→~700-800 lines) into focused hooks and components, then fix 6 fiction flow friction points.

**Architecture:** Hooks-first extraction — move state + handlers into custom hooks first (zero visual change), then extract newsletter sub-components from ArtifactsTab, then apply 6 targeted friction fixes. Each task produces a compilable, working state.

**Tech Stack:** React 19, TypeScript 5 (strict), Next.js 16, Tiptap 3, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-03-fiction-flow-refactor-design.md`

---

## File Structure

### New files
```
src/app/hooks/useMediaQuery.ts           — general-purpose media query hook
src/app/lib/editorUtils.ts               — textToTiptapDoc utility
src/app/hooks/useChapterEditor.ts        — chapter navigation & content sync
src/app/hooks/useCodexFocus.ts           — Codex/artifact focus request management
src/app/hooks/useChapterAnnotations.ts   — annotation lifecycle & tooltip state
src/app/hooks/useStoryStreaming.ts       — streaming generation & continuation
src/app/lib/artifactsHelpers.ts          — filter/format/label utilities from ArtifactsTab
src/app/hooks/usePlanningDrafts.ts       — debounced planning edits
src/app/hooks/useReadinessReport.ts      — newsletter preflight state
src/app/hooks/usePackageSelection.ts     — newsletter canonical package state
src/app/components/editor/NewsletterReadinessPanel.tsx — pre-send checks + export
src/app/components/editor/NewsletterSetupPanel.tsx     — profile editor + memory snapshot
```

### Modified files
```
src/app/components/editor/StoryEditor.tsx  — rewire to use extracted hooks
src/app/components/editor/ArtifactsTab.tsx — rewire to use extracted hooks/components
src/app/components/editor/useAutosave.ts   — add onError callback + lastSaveError
src/app/components/editor/EditorToolbar.tsx — add streamingActive disabled state
src/app/components/editor/EditorFooter.tsx  — add saveError indicator
src/app/components/editor/CraftTab.tsx      — scope direction input + add breadcrumb
src/app/components/editor/SidePanel.tsx     — no structural changes (CraftTab handles breadcrumb)
```

---

## Task 1: Extract shared utilities (useMediaQuery + editorUtils)

**Files:**
- Create: `src/app/hooks/useMediaQuery.ts`
- Create: `src/app/lib/editorUtils.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx:69-95`

- [ ] **Step 1: Create useMediaQuery.ts**

```typescript
// src/app/hooks/useMediaQuery.ts
"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: Create editorUtils.ts**

```typescript
// src/app/lib/editorUtils.ts

/** Convert plain text to Tiptap document JSON */
export function textToTiptapDoc(text: string): object {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p.replace(/\n/g, " ") }],
    })),
  };
}
```

- [ ] **Step 3: Update StoryEditor imports**

Replace the inline `useMediaQuery` function (lines 68-83) and `textToTiptapDoc` function (lines 85-95) with imports:

```typescript
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { textToTiptapDoc } from "../../lib/editorUtils";
```

Delete the inline function definitions (lines 68-95).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/app/hooks/useMediaQuery.ts src/app/lib/editorUtils.ts src/app/components/editor/StoryEditor.tsx
git commit -m "refactor: extract useMediaQuery and textToTiptapDoc to shared files"
```

---

## Task 2: Extract useChapterEditor hook

**Files:**
- Create: `src/app/hooks/useChapterEditor.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx`

This hook owns `currentChapterIdx` and handles chapter navigation, content resolution, and editor content sync. It accepts `editor` as nullable (null on first render) per the spec's dependency resolution.

- [ ] **Step 1: Create useChapterEditor.ts**

Extract from StoryEditor:
- `currentChapterIdx` state (line ~133)
- `getChapterContent` function (lines ~202-209) — uses `textToTiptapDoc` from editorUtils
- `switchChapter` handler (lines ~537-548) — calls `flush()` from autosave before switching
- Content sync effect (lines ~212-247) — sets editor content when chapter changes, skips during streaming

The hook signature:

```typescript
interface UseChapterEditorOptions {
  story: Story;
  editor: Editor | null;
  streamingActive: boolean;
}

interface UseChapterEditorReturn {
  currentChapterIdx: number;
  currentChapter: Chapter | undefined;
  switchChapter: (newIdx: number, beforeSwitch?: () => Promise<void>) => void;
  setChapterIdx: (idx: number) => void; // no guards, for streaming hook
  getChapterContent: (idx: number) => object | string;
}
```

Key details:
- `getChapterContent` works immediately (reads from `story.chapters`, no editor needed)
- Content sync effect guards on `editor !== null` and `!streamingActive`
- `switchChapter` bounds-checks and blocks during streaming; accepts an optional `beforeSwitch` callback (used by StoryEditor to pass `autosave.flush` at call time, avoiding circular dependency)
- `setChapterIdx` is unguarded — used by streaming hook for out-of-bounds index during continuation
- Import `textToTiptapDoc` from `../../lib/editorUtils`
- **No dependency on `flush`/`useAutosave`** — the `beforeSwitch` callback pattern keeps this hook independent of the autosave lifecycle

- [ ] **Step 2: Wire into StoryEditor**

Replace inline chapter state/handlers with the hook. The composition pattern:

```typescript
// useChapterEditor does NOT depend on flush — no circular dependency
const chapterEditor = useChapterEditor({
  story, editor: editor ?? null, streamingActive: streaming.active
});

// useAutosave depends on editor (created after chapterEditor.getChapterContent)
const autosave = useAutosave({ editor, chapterId: chapterEditor.currentChapter?.id });

// StoryEditor coordinates flush at call site:
const handleSwitchChapter = (newIdx: number) => {
  chapterEditor.switchChapter(newIdx, () => autosave.flush());
};
```

Note: `editor` is null on first render. `useEditor` gets initial content from `chapterEditor.getChapterContent(initialIdx)`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/useChapterEditor.ts src/app/components/editor/StoryEditor.tsx
git commit -m "refactor: extract useChapterEditor hook from StoryEditor"
```

---

## Task 3: Extract useCodexFocus hook

**Files:**
- Create: `src/app/hooks/useCodexFocus.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx`

- [ ] **Step 1: Create useCodexFocus.ts**

Extract from StoryEditor:
- `codexFocusRequest` state (line ~140)
- `artifactFocusRequest` state (line ~142)
- `focusCodexEntry(entryId)` — sets codexFocusRequest with incrementing nonce
- `focusArtifact(sectionType, targetLabel?)` — sets artifactFocusRequest with nonce
- `handleMentionClick(e: React.MouseEvent): boolean` — checks if click target has `data-codex-mention-id`, sets focus, returns true if consumed
- `clearFocus()` — resets both to null

Import the `CodexFocusRequest` and `ArtifactFocusRequest` interfaces (move them to this file or a shared types location).

- [ ] **Step 2: Wire into StoryEditor**

Replace inline focus state with hook. StoryEditor's `handleEditorClick` becomes:

```typescript
const handleEditorClick = (e: React.MouseEvent) => {
  if (codexFocus.handleMentionClick(e)) return;
  chapterAnnotations.handleClick(e);
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/useCodexFocus.ts src/app/components/editor/StoryEditor.tsx
git commit -m "refactor: extract useCodexFocus hook from StoryEditor"
```

---

## Task 4: Extract useChapterAnnotations hook

**Files:**
- Create: `src/app/hooks/useChapterAnnotations.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx`

- [ ] **Step 1: Create useChapterAnnotations.ts**

Extract from StoryEditor:
- `annotations` state (line ~163)
- `activeAnnotation` state (line ~164)
- `annotationAnchorRect` state (line ~165)
- Fetch annotations effect (lines ~318-344) — with AbortController for cancellation on chapter change
- Push annotations to Tiptap plugin effect (lines ~346-360)
- `handleMouseOver` — desktop hover tooltip positioning (lines ~361-390)
- `handleDismiss` — POST dismiss, filter from state (lines ~408-418)
- `handleApplyAction` — POST action, remove annotation, return focus target (lines ~419-437)
- `handleClick(e: React.MouseEvent)` — annotation click + tooltip dismissal (lines ~440-475, annotation portion only)
- `refresh(chapterId)` — re-fetches AND sets `pendingNotification` if warnings/errors found

The `refresh` implementation (distinct from passive fetch):

```typescript
const refresh = async (chapterId: string) => {
  const res = await fetch(`/api/annotations?chapterId=${chapterId}`);
  if (!res.ok) return;
  const data: ChapterAnnotation[] = await res.json();
  setAnnotations(data);
  // Only refresh() sets pendingNotification — passive fetch does NOT
  const issues = data.filter(a => a.severity === "warning" || a.severity === "error");
  if (issues.length > 0) {
    setPendingNotification({ count: issues.length, firstAnnotation: issues[0] });
  }
};
```

The hook signature:

```typescript
interface UseChapterAnnotationsOptions {
  chapterId: string | undefined;
  editor: Editor | null;
  isMobile: boolean;
}

interface UseChapterAnnotationsReturn {
  annotations: ChapterAnnotation[];
  activeAnnotation: ChapterAnnotation | null;
  annotationAnchorRect: DOMRect | null;
  pendingNotification: { count: number; firstAnnotation: ChapterAnnotation } | null;
  clearNotification: () => void;
  handleMouseOver: (e: React.MouseEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
  handleDismiss: (id: string) => Promise<void>;
  handleApplyAction: (annotation: ChapterAnnotation, action: ChapterAnnotationAction) => Promise<AnnotationActionResponse | null>;
  handleOpenPlanningTarget: (annotation: ChapterAnnotation) => { sectionType: PlanningArtifactSubtype; targetLabel?: string } | null;
  refresh: (chapterId: string) => Promise<void>;
}
```

Key details:
- `refresh()` is called by `runChapterPostProcessing` (stays in StoryEditor)
- `refresh()` sets `pendingNotification` when results contain warnings/errors
- The passive fetch effect on `chapterId` change does NOT set `pendingNotification`
- AbortController in fetch effect cancels on `chapterId` change or unmount
- `handleOpenPlanningTarget` returns the target info instead of calling `focusArtifact` — StoryEditor coordinates

- [ ] **Step 2: Wire into StoryEditor**

Replace inline annotation state/handlers with the hook. Update `runChapterPostProcessing` to call `chapterAnnotations.refresh(chapterId)`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/useChapterAnnotations.ts src/app/components/editor/StoryEditor.tsx
git commit -m "refactor: extract useChapterAnnotations hook from StoryEditor"
```

---

## Task 5: Extract useStoryStreaming hook

**Files:**
- Create: `src/app/hooks/useStoryStreaming.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx`

This is the largest extraction — streaming generation and continuation logic.

- [ ] **Step 1: Create useStoryStreaming.ts**

Extract from StoryEditor:
- `streaming` state `{ active, fullText, source }` (line ~166)
- `loading` state (line ~134)
- `error` state (line ~135)
- Initial stream effect (lines ~628-730) — triggered by `streamingFormData`
- `handleContinue` handler (lines ~734-805) — continuation with SSE

The hook signature:

```typescript
interface UseStoryStreamingOptions {
  editor: Editor | null;
  storyRef: React.MutableRefObject<Story>;
  streamingFormData?: StoryFormData | null;
  onUpdate: (story: Story) => void;
  onPostProcess: (storyId: string, chapterId: string) => void;
  onStreamingComplete?: () => void;
  setChapterIdx: (idx: number) => void;
}

interface UseStoryStreamingReturn {
  streaming: { active: boolean; fullText: string; source: "initial" | "continue" | null };
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  handleContinue: () => Promise<void>;
  startInitialStream: () => void; // manually trigger initial generation (exposed per spec)
  streamError: { hasPartialContent: boolean; message: string } | null;
}
```

Key details:
- Receives `storyRef` (not `story`) to avoid stale closures in async SSE callbacks
- Receives `onPostProcess` callback — StoryEditor implements this as the coordinator
- Receives `setChapterIdx` from `useChapterEditor` — used to set out-of-bounds index during continuation
- Uses `fullTextRef` internally for the SSE accumulator (state version for rendering, ref for callbacks)
- All `editor?.commands` calls use optional chaining for null safety
- Guards initial stream effect on `editor !== null` and `streamingFormData` existence
- Imports `readSSEStream` from `../../lib/stream`
- Imports `updateStoryTitle`, `updateChapterContent`, `addChapterToDB` from `../../lib/supabase/stories`

Core SSE streaming loop scaffolding (both initial and continuation share this pattern):

```typescript
const fullTextRef = useRef("");

const processStream = async (
  response: Response,
  source: "initial" | "continue",
  chapterId: string
) => {
  setStreaming({ active: true, fullText: "", source });
  fullTextRef.current = "";

  try {
    await readSSEStream(response, (chunk: string) => {
      fullTextRef.current += chunk;
      setStreaming(s => ({ ...s, fullText: fullTextRef.current }));
      // Progressive Tiptap insertion
      editor?.commands.insertContent(chunk);
    });

    // Stream complete — save final content
    const currentStory = storyRef.current;
    await updateChapterContent(chapterId, fullTextRef.current, editor?.getJSON());

    // Post-processing (continuity check, codex suggestions)
    onPostProcess(currentStory.id, chapterId);
    onStreamingComplete?.();
  } catch (err) {
    const hasPartialContent = fullTextRef.current.length > 0;
    if (hasPartialContent) {
      await updateChapterContent(chapterId, fullTextRef.current, editor?.getJSON());
    }
    setStreamError({ hasPartialContent, message: (err as Error).message });
  } finally {
    setStreaming({ active: false, fullText: "", source: null });
  }
};

// startInitialStream triggers the initial generation effect
const startInitialStream = () => { /* set trigger state to kick off useEffect */ };
```

Note: The actual implementation should be extracted line-by-line from StoryEditor lines ~628-805. The scaffolding above shows the structural pattern; the real code handles additional concerns (title extraction from first SSE event, chapter creation for continuation, `addChapterToDB`, `setChapterIdx` for new chapters).

- [ ] **Step 2: Wire into StoryEditor**

Replace inline streaming state/handlers with the hook. StoryEditor passes `runChapterPostProcessing` as `onPostProcess`. The `storyRef` pattern stays in StoryEditor:

```typescript
const storyRef = useRef(story);
storyRef.current = story;

const storyStreaming = useStoryStreaming({
  editor,
  storyRef,
  streamingFormData,
  onUpdate,
  onPostProcess: runChapterPostProcessing,
  onStreamingComplete,
  setChapterIdx: chapterEditor.setChapterIdx,
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Verify StoryEditor is now ~400 lines**

Run: `wc -l src/app/components/editor/StoryEditor.tsx`
Expected: ~350-450 lines

- [ ] **Step 5: Commit**

```bash
git add src/app/hooks/useStoryStreaming.ts src/app/components/editor/StoryEditor.tsx
git commit -m "refactor: extract useStoryStreaming hook from StoryEditor"
```

---

## Task 6: Extract artifactsHelpers.ts from ArtifactsTab

**Files:**
- Create: `src/app/lib/artifactsHelpers.ts`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Create artifactsHelpers.ts**

Move all utility functions and constants from ArtifactsTab lines ~2036-2462:
- `getNewsletterSelectionFieldForOutputType`
- `parseNumberedOptions`
- `summarizeSelectionValue`
- `formatArtifactListMeta`
- `labelContextSource`
- `labelArtifactKind`
- `formatTimestamp`
- `getReadinessStatusLabel`
- `getReadinessStatusClasses`
- `getReadinessErrorMessage`
- `buildReadinessGroups`
- `getAggregateReadinessStatus`
- `formatScopeLabel`
- `READINESS_GROUPS` constant
- `FilterOption`, `ScopeOption`, `ReadinessGroupSummary` interfaces

Also move the `useMinWidth` and `useElementSize` hooks (lines ~2366-2419) — these are general-purpose DOM hooks.

- [ ] **Step 2: Update ArtifactsTab imports**

Replace inline functions with imports from `../../lib/artifactsHelpers`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/artifactsHelpers.ts src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: extract artifactsHelpers from ArtifactsTab"
```

---

## Task 7: Extract usePlanningDrafts hook

**Files:**
- Create: `src/app/hooks/usePlanningDrafts.ts`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Create usePlanningDrafts.ts**

Extract from ArtifactsTab:
- `planningDrafts` state
- `savingSections` state
- `saveTimersRef`
- `updateSavingState` helper
- `handlePlanningChange` handler (debounced save at 700ms)
- Cleanup effect for timers on unmount

- [ ] **Step 2: Wire into ArtifactsTab**

Replace inline planning draft state/handlers with the hook.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/usePlanningDrafts.ts src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: extract usePlanningDrafts hook from ArtifactsTab"
```

---

## Task 8: Extract useReadinessReport hook

**Files:**
- Create: `src/app/hooks/useReadinessReport.ts`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Create useReadinessReport.ts**

Extract from ArtifactsTab:
- `readinessReport`, `readinessLoading`, `readinessError`, `readinessRefreshNonce`, `showReadinessDetails` state
- Readiness fetch effect (lines ~430-470)
- Import `buildReadinessGroups` from `artifactsHelpers`

- [ ] **Step 2: Wire into ArtifactsTab**

Replace inline readiness state/effects with the hook.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/useReadinessReport.ts src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: extract useReadinessReport hook from ArtifactsTab"
```

---

## Task 9: Extract usePackageSelection hook

**Files:**
- Create: `src/app/hooks/usePackageSelection.ts`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Create usePackageSelection.ts**

Extract from ArtifactDetail section of ArtifactsTab:
- All `packageSelection*` state variables
- `showOfficialEditor` state
- Load package selection effect
- `persistSelectionField` handler
- Import `getNewsletterSelectionFieldForOutputType`, `parseNumberedOptions` from `artifactsHelpers`

- [ ] **Step 2: Wire into ArtifactsTab's ArtifactDetail component**

Replace inline package selection state/handlers with the hook.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/usePackageSelection.ts src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: extract usePackageSelection hook from ArtifactsTab"
```

---

## Task 10: Extract NewsletterReadinessPanel component

**Files:**
- Create: `src/app/components/editor/NewsletterReadinessPanel.tsx`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Create NewsletterReadinessPanel.tsx**

Extract ArtifactsTab lines ~815-1079 (readiness checks + export options) into a standalone component.

Props:
```typescript
interface NewsletterReadinessPanelProps {
  report: ReadinessReport | null;
  groups: ReadinessGroupSummary[];
  loading: boolean;
  error: string | null;
  showDetails: boolean;
  onToggleDetails: () => void;
  onOpenNextStep: (outputType: AdaptationOutputType, chapterNumber: number) => void;
  onExportBundle: (mode: "copy" | "download") => Promise<void>;
  exportingBundle: boolean;
  canExport: boolean;
  showExportOptions: boolean;
  onToggleExport: () => void;
}
```

Import formatting helpers from `../../lib/artifactsHelpers`.

- [ ] **Step 2: Replace inline JSX in ArtifactsTab**

Replace the newsletter readiness + export JSX block with `<NewsletterReadinessPanel ... />`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/components/editor/NewsletterReadinessPanel.tsx src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: extract NewsletterReadinessPanel from ArtifactsTab"
```

---

## Task 11: Extract NewsletterSetupPanel component

**Files:**
- Create: `src/app/components/editor/NewsletterSetupPanel.tsx`
- Modify: `src/app/components/editor/ArtifactsTab.tsx`

- [ ] **Step 1: Create NewsletterSetupPanel.tsx**

Extract ArtifactsTab lines ~1081-1128 (setup drawer) plus the `NewsletterMemoryPanel` component (lines ~2464-2646) and its sub-components (`MemoryMetric`, `MemoryList`).

Props:
```typescript
interface NewsletterSetupPanelProps {
  storyId: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  currentChapter?: Chapter;
  showSetup: boolean;
  onToggleSetup: () => void;
  onProfileChange: (draft: NewsletterModeConfig) => void;
}
```

- [ ] **Step 2: Replace inline JSX in ArtifactsTab**

Replace the newsletter setup JSX block and `NewsletterMemoryPanel` definition with the extracted component.

- [ ] **Step 3: Verify TypeScript compiles and ArtifactsTab is ~700-800 lines**

Run: `npx tsc --noEmit`
Run: `wc -l src/app/components/editor/ArtifactsTab.tsx`
Expected: zero errors, ~700-800 lines

- [ ] **Step 4: Commit**

```bash
git add src/app/components/editor/NewsletterSetupPanel.tsx src/app/components/editor/ArtifactsTab.tsx
git commit -m "refactor: extract NewsletterSetupPanel from ArtifactsTab"
```

---

## Task 12: Fix 6 — Direction input scoping in CraftTab

Starting with the simplest friction fix to build confidence.

**Files:**
- Modify: `src/app/components/editor/CraftTab.tsx`

- [ ] **Step 1: Scope direction input to rewrite/expand only**

In `CraftTab.tsx`, the direction input currently shows for rewrite/expand during loading (line 132 already has the guard) but also for results. The results section at line 162 already guards correctly:

```typescript
{result && (result.type === "rewrite" || result.type === "expand") && (
```

Check the empty/idle state — if `activeTool` is set but no result yet, direction should NOT show for brainstorm/describe. Verify all code paths only show `DirectionInput` when tool is `rewrite` or `expand`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/CraftTab.tsx
git commit -m "fix: scope direction input to rewrite/expand tools only"
```

---

## Task 13: Fix 5 — Craft tools breadcrumb in CraftTab

**Files:**
- Modify: `src/app/components/editor/CraftTab.tsx`

- [ ] **Step 1: Add breadcrumb above results**

At the top of the CraftTab return (before `ToolHeader`), when `activeTool` is set, render:

```tsx
{activeTool && (
  <p className="px-4 pt-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
    Writing tools <span className="text-zinc-600">›</span>{" "}
    <span className="text-zinc-400">{TOOL_META[activeTool].label}</span>
  </p>
)}
```

This goes inside the scrollable area, above the `ToolHeader`. It provides orientation without changing the tab structure.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/CraftTab.tsx
git commit -m "fix: add breadcrumb header to craft tools for orientation"
```

---

## Task 14: Fix 4 — Autosave failure feedback

**Files:**
- Modify: `src/app/components/editor/useAutosave.ts`
- Modify: `src/app/components/editor/EditorFooter.tsx`
- Modify: `src/app/components/editor/StoryEditor.tsx`

- [ ] **Step 1: Add onError and lastSaveError to useAutosave**

Update the `UseAutosaveOptions` interface:

```typescript
interface UseAutosaveOptions {
  editor: Editor | null;
  chapterId: string | undefined;
  debounceMs?: number;
  onError?: (error: Error) => void;
}
```

In the `save` function, when `error` is truthy from the Supabase update, call `onError` and set a `lastSaveError` ref:

```typescript
if (error) {
  lastSaveErrorRef.current = error.message;
  options.onError?.(new Error(error.message));
} else {
  lastSavedRef.current = contentStr;
  lastSaveErrorRef.current = null;
}
```

Return `lastSaveError`:

```typescript
return { flush, lastSaveError: lastSaveErrorRef.current };
```

Note: Use a ref + state trigger pattern so the error is reactive. Add `const [saveErrorTick, setSaveErrorTick] = useState(0)` and increment on error to trigger re-renders.

- [ ] **Step 2: Add saveError prop to EditorFooter**

Update `EditorFooterProps` to add optional `saveError`:

```typescript
interface EditorFooterProps {
  projectMode: ProjectMode;
  wordCount: number;
  isLatestChapter: boolean;
  loading: boolean;
  error: string;
  saveError?: string | null;
  onContinue: () => void;
}
```

Render save error indicator above the word count when present:

```tsx
{saveError && (
  <div className="px-4 py-1.5 text-xs text-red-400">
    Save failed — retrying...
  </div>
)}
```

- [ ] **Step 3: Wire saveError from useAutosave to EditorFooter in StoryEditor**

Pass `autosave.lastSaveError` to EditorFooter's `saveError` prop.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/app/components/editor/useAutosave.ts src/app/components/editor/EditorFooter.tsx src/app/components/editor/StoryEditor.tsx
git commit -m "fix: show autosave failure feedback in editor footer"
```

---

## Task 15: Fix 2 — Disable chapter switching during streaming

**Files:**
- Modify: `src/app/components/editor/EditorToolbar.tsx`
- Modify: `src/app/hooks/useChapterEditor.ts` (already done in Task 2, verify)

- [ ] **Step 1: Add streamingActive prop to EditorToolbar**

Add to `EditorToolbarProps`:

```typescript
streamingActive?: boolean;
```

Apply disabled styling to chapter nav buttons when `streamingActive` is true:

```tsx
<button
  disabled={streamingActive || currentChapterIdx <= 0}
  className={`... ${streamingActive ? "opacity-40 cursor-not-allowed" : ""}`}
>
```

Same for the forward button.

- [ ] **Step 2: Pass streamingActive from StoryEditor**

```tsx
<EditorToolbar streamingActive={storyStreaming.streaming.active} ... />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/components/editor/EditorToolbar.tsx src/app/components/editor/StoryEditor.tsx
git commit -m "fix: disable chapter nav buttons during streaming"
```

---

## Task 16: Fix 3 — Continuity check notification toast

**Files:**
- Modify: `src/app/hooks/useChapterAnnotations.ts` (already has `pendingNotification` + `refresh`)
- Modify: `src/app/components/editor/StoryEditor.tsx`

- [ ] **Step 1: Verify useChapterAnnotations has pendingNotification**

Confirm from Task 4 that `refresh()` sets `pendingNotification` when warnings/errors exist. Confirm `clearNotification()` resets it.

- [ ] **Step 2: Add continuity toast to StoryEditor**

After the `<UndoToast>` in StoryEditor's JSX, add:

```tsx
{chapterAnnotations.pendingNotification && (
  <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-amber-700/50 bg-amber-950/90 px-4 py-3 shadow-lg backdrop-blur">
    <div className="flex items-center gap-3">
      <span className="text-sm text-amber-200">
        {chapterAnnotations.pendingNotification.count} continuity issue
        {chapterAnnotations.pendingNotification.count !== 1 ? "s" : ""} found
      </span>
      <button
        type="button"
        onClick={() => {
          // Scroll to first annotation and open tooltip
          const el = document.querySelector(
            `[data-annotation-id="${chapterAnnotations.pendingNotification!.firstAnnotation.id}"]`
          );
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          chapterAnnotations.clearNotification();
        }}
        className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
      >
        Review
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 3: Add auto-dismiss timer**

In a useEffect keyed on `chapterAnnotations.pendingNotification`:

```typescript
useEffect(() => {
  if (!chapterAnnotations.pendingNotification) return;
  const timer = setTimeout(() => chapterAnnotations.clearNotification(), 8000);
  return () => clearTimeout(timer);
}, [chapterAnnotations.pendingNotification]);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/app/hooks/useChapterAnnotations.ts src/app/components/editor/StoryEditor.tsx
git commit -m "fix: show continuity check notification toast after generation"
```

---

## Task 17: Fix 1 — Streaming failure recovery

**Files:**
- Modify: `src/app/hooks/useStoryStreaming.ts`
- Modify: `src/app/components/editor/StoryEditor.tsx`

- [ ] **Step 1: Add streamError to useStoryStreaming**

In the error handling paths of both initial stream and continuation:

```typescript
// On stream error
const hasPartialContent = fullTextRef.current.length > 0;
if (hasPartialContent) {
  // Save what we have
  await updateChapterContent(chapterId, fullTextRef.current, editor?.getJSON());
}
// Fix the title if still "Generating..."
const currentStory = storyRef.current;
if (currentStory.title === "Generating...") {
  const fallbackTitle = streamingFormData?.title || "Untitled";
  await updateStoryTitle(currentStory.id, fallbackTitle);
}
setStreamError({ hasPartialContent, message: errorMessage });
```

Add `streamError` to return value.

- [ ] **Step 2: Add recovery UI in StoryEditor**

When `storyStreaming.streamError` is set, render recovery banner:

```tsx
{storyStreaming.streamError && (
  <div className="mx-4 mt-2 rounded-2xl border border-red-800/40 bg-red-950/30 p-4">
    <p className="text-sm font-medium text-red-300">Generation interrupted</p>
    <p className="mt-1 text-sm text-zinc-400">{storyStreaming.streamError.message}</p>
    <div className="mt-3 flex gap-2">
      {storyStreaming.streamError.hasPartialContent ? (
        <button onClick={() => storyStreaming.setError("")}
          className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white">
          Keep what was generated
        </button>
      ) : (
        <button onClick={onBack}
          className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200">
          Go back
        </button>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hooks/useStoryStreaming.ts src/app/components/editor/StoryEditor.tsx
git commit -m "fix: add streaming failure recovery with partial content handling"
```

---

## Task 18: Final verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: ESLint check**

Run: `npm run lint`
Expected: zero errors

- [ ] **Step 3: Verify file sizes**

Run:
```bash
wc -l src/app/components/editor/StoryEditor.tsx src/app/components/editor/ArtifactsTab.tsx
```

Expected: StoryEditor ~350-450, ArtifactsTab ~700-800

- [ ] **Step 4: Update CLAUDE.md**

Add to the "What's shipped" section:

```markdown
9. Mega-component decomposition (StoryEditor 1058→~400 lines, ArtifactsTab 2646→~700-800 lines)
10. Fiction flow friction fixes (streaming recovery, chapter nav guard, continuity toast, autosave feedback, craft breadcrumb, direction scoping)
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with decomposition and friction fix status"
```

- [ ] **Step 6: Push**

```bash
git push
```
