# Fiction Flow Refactor: Mega-Component Decomposition + Friction Fixes

> Date: 2026-04-03
> Status: Approved
> Approach: Hooks-first extraction (Approach A), then targeted friction fixes

## Problem

Two mega-components are the bottleneck for iteration speed and reliability:

- **StoryEditor.tsx (1,058 lines)** handles 18 responsibilities with 14 useState calls
- **ArtifactsTab.tsx (2,646 lines)** handles 4 unrelated feature areas with 28 useState calls

Plus 6 high-friction issues in the fiction flow that need surgical fixes.

## Goals

1. Decompose StoryEditor from ~1,058 → ~400 lines
2. Decompose ArtifactsTab from ~2,646 → ~700-800 lines
3. Fix 6 fiction flow friction points
4. Zero visual regressions — same behavior, same props, same interfaces
5. Every new file has a single clear responsibility

## Non-Goals

- No new features
- No visual redesign
- No changes to API routes or database schema
- No breaking changes to existing hook interfaces (new optional fields/callbacks are fine)

---

## Part 1: StoryEditor Hook Extractions

### `useStoryStreaming(editor, story, onUpdate)`

**Extracted from:** StoryEditor lines ~628-805
**Owns:** `streaming` state (active, fullText, source), `loading`, `error`
**Handles:**
- Initial generation stream (from `streamingFormData`)
- Continuation stream (`handleContinue`)
- Progressive Tiptap insertion via `editor.commands.insertContent()`
- Post-generation DB saves (`updateStoryTitle`, `updateChapterContent`)
- Triggering `runChapterPostProcessing` on completion
- Streaming cursor extension setup

**Returns:** `{ streaming, loading, error, setError, handleContinue, startInitialStream }`

### `useChapterAnnotations(chapterId, editor, isMobile)`

**Extracted from:** StoryEditor lines ~163-165, 318-344, 361-437
**Owns:** `annotations[]`, `activeAnnotation`, `annotationAnchorRect`
**Handles:**
- Fetch annotations on chapter change
- Push to Tiptap AnnotationExtension plugin
- Desktop hover handler for tooltip positioning
- Click handler for mobile tooltip
- Dismiss handler (POST to API, filter from state)
- Apply action handler (POST to API, remove annotation, optional artifact focus)
- Open planning target handler (navigate to Artifacts tab)

**Returns:** `{ annotations, activeAnnotation, annotationAnchorRect, handleMouseOver, handleDismiss, handleApplyAction, handleOpenPlanningTarget, handleEditorClick }`

### `useChapterEditor(story, editor)`

**Extracted from:** StoryEditor lines ~133-135, 202-247, 537-548, 614-626
**Owns:** `currentChapterIdx`
**Handles:**
- Chapter content resolution (prefers `contentJson`, falls back to `textToTiptapDoc()`)
- Content sync to editor on chapter switch (skip during streaming)
- Chapter switching with autosave flush before switch
- Guard against switching during active streaming

**Returns:** `{ currentChapterIdx, currentChapter, switchChapter, getChapterContent }`

### `useCodexFocus(craftPanel)`

**Extracted from:** StoryEditor lines ~140-143, 390-407, 427-434, 440-475
**Owns:** `codexFocusRequest`, `artifactFocusRequest`
**Handles:**
- Setting focus from Codex mention clicks in editor
- Setting focus from annotation planning target navigation
- Clearing after the target component has consumed the request

**Returns:** `{ codexFocusRequest, artifactFocusRequest, focusCodexEntry, focusArtifact, clearFocus }`

### Shared utilities extracted from StoryEditor

These inline utilities move to shared locations since they are general-purpose:

- `useMediaQuery(query)` → `src/app/hooks/useMediaQuery.ts` (currently defined inline at StoryEditor lines 69-83)
- `textToTiptapDoc(text)` → `src/app/lib/editorUtils.ts` (currently inline at lines 85-95)

### Streaming cursor extension ownership

`createStreamingCursorExtension()` (lines 98-123) stays in StoryEditor because it is a Tiptap extension factory used at `useEditor` construction time. The extension instance is created via `useRef` and passed to `useEditor`'s `extensions` array. `useStoryStreaming` does not own the extension — it only controls the streaming state that the extension reacts to via the Tiptap plugin.

### Hook composition order in StoryEditor

Hooks must be called in this order due to data dependencies:

```
1. useMediaQuery(mobileCutoff)           → isMobile
2. useChapterEditor(story, null)         → { currentChapterIdx, currentChapter, getChapterContent }
3. useEditor({ content: getChapterContent(idx), extensions: [...] })  → editor
4. useChapterEditor.setEditor(editor)    — see note below
5. useAutosave(editor, chapter, options) → { flush, lastSaveError }
6. useCraftPanel(storyId, ...)           → craftPanel
7. useCodexFocus(craftPanel)             → { codexFocusRequest, ... }
8. useStoryStreaming(editor, story, callbacks) → { streaming, ... }
9. useChapterAnnotations(chapterId, editor, isMobile) → { annotations, ... }
10. useCodexMentions(...)                → mentions
11. useChapterAdaptation(...)            → adaptation
```

### Critical: useChapterEditor / useEditor dependency resolution

`getChapterContent` is needed by `useEditor` for initial content, but `useChapterEditor` also needs the `editor` instance for `setContent()` on chapter switch.

**Resolution:** `useChapterEditor` accepts `editor` as an optional parameter (null initially). It exposes `getChapterContent` immediately (no editor needed for this — it reads from `story.chapters`). The content sync effect inside the hook guards on `editor !== null`. StoryEditor calls:

```typescript
const chapterEditor = useChapterEditor(story, editor);  // editor is null on first render
const editor = useEditor({ content: chapterEditor.getChapterContent(initialIdx), ... });
// On subsequent renders, editor is non-null and chapterEditor's sync effect runs
```

This works because `useEditor` only reads `content` on initialization, and `useChapterEditor`'s sync effect only fires when `editor` transitions from null to an instance.

### Cross-hook coordination: runChapterPostProcessing

`runChapterPostProcessing` currently writes to state owned by multiple hooks:
- Sets annotations (owned by `useChapterAnnotations`)
- Sets `codexSuggestionRefreshKey` (loose state)

**Resolution:** `runChapterPostProcessing` stays in StoryEditor as a coordinator function. It is not owned by any single hook. It calls:
- `annotations.refresh(chapterId)` — a new method on `useChapterAnnotations` that re-fetches
- `setCodexSuggestionRefreshKey(prev => prev + 1)` — stays as simple state in StoryEditor

`useStoryStreaming` receives `onPostProcess: (storyId, chapterId) => void` callback from StoryEditor. This avoids the hook needing to know about annotation or Codex state.

### storyRef closure pattern

The current code uses `storyRef = useRef(story)` to avoid stale closures in streaming callbacks. This ref stays in StoryEditor and is passed to `useStoryStreaming` as a ref parameter. The hook reads `storyRef.current` inside async callbacks instead of capturing `story` in closure scope.

### Remaining state in StoryEditor shell (~400 lines)

These simple states stay in StoryEditor (not worth extracting):
- `showDeleteConfirm` — delete confirmation UI toggle
- `undoToast` — undo feedback after craft insertion
- `codexSuggestionRefreshKey` — trigger for Codex suggestion panel refresh
- `selectedText` / `selectionContext` — editor selection tracking for craft tools
- `isMobile` — from useMediaQuery

### useCodexFocus: handleEditorClick split

`handleEditorClick` (lines 440-475) handles three concerns:
1. Codex mention clicks → owned by `useCodexFocus`
2. Annotation clicks → owned by `useChapterAnnotations`
3. Tooltip dismissal → owned by `useChapterAnnotations`

**Resolution:** StoryEditor keeps `handleEditorClick` as a thin dispatcher:
```typescript
const handleEditorClick = (e: React.MouseEvent) => {
  if (codexFocus.handleMentionClick(e)) return;
  annotations.handleClick(e);
};
```

Each hook exposes a handler that returns `true` if it consumed the event.

### Result

StoryEditor becomes ~400 lines of composition:
- Shared utilities extracted (`useMediaQuery`, `textToTiptapDoc`)
- Tiptap editor instance setup (extensions, config, streaming cursor)
- Selection tracking for craft tools
- `runChapterPostProcessing` coordinator
- `handleEditorClick` dispatcher
- Wiring hooks together in documented order
- Layout: EditorToolbar + EditorContent + SidePanel + EditorFooter + mobile sheets

---

## Part 2: ArtifactsTab Hook Extractions

### `useReadinessReport(storyId, currentChapterId, projectMode, refreshToken)`

**Extracted from:** ArtifactsTab lines ~130-166 (state), 430-470 (effect), readiness helpers
**Owns:** `readinessReport`, `readinessLoading`, `readinessError`, `readinessRefreshNonce`, `showReadinessDetails`
**Handles:**
- Fetch `/api/newsletter/{storyId}/preflight` on chapter/refresh change
- Newsletter-only guard (no-op for fiction)
- Error formatting
- Readiness group computation via `buildReadinessGroups()`

**Returns:** `{ report, loading, error, groups, visibleChecks, showDetails, toggleDetails, refresh }`

### `usePackageSelection(storyId, currentChapterId, artifact, projectMode)`

**Extracted from:** ArtifactDetail lines ~1339-1363 (state), 1447-1499 (effect), 1501-1554 (handler)
**Owns:** `packageSelection`, `packageSelectionDrafts`, loading/saving/error/message states, `showOfficialEditor`
**Handles:**
- Load current selections on artifact change (GET `/api/newsletter/{storyId}/package`)
- Persist single field (PUT to same endpoint)
- Draft editing
- Field mapping from adaptation output type to selection field

**Returns:** `{ selection, drafts, loading, saving, error, message, showEditor, setShowEditor, updateDraft, persistField, selectionField, currentValue, parsedOptions }`

### `usePlanningDrafts(storyId, saveArtifactFn)`

**Extracted from:** ArtifactsTab lines ~130-166 (state), 472-518 (handlers)
**Owns:** `planningDrafts`, `savingSections[]`, debounce timers ref
**Handles:**
- Update draft state immediately on editor change
- Debounce save (700ms) via timer ref
- Call `savePlanningArtifact` from useArtifacts on timer fire
- Track which sections are currently saving
- Cleanup timers on unmount

**Returns:** `{ drafts, savingSections, handleChange, getDraftContent }`

---

## Part 3: ArtifactsTab Component Extractions

### `NewsletterReadinessPanel`

**Extracted from:** ArtifactsTab lines ~815-1079
**File:** `src/app/components/editor/NewsletterReadinessPanel.tsx`
**Props:** `report`, `groups`, `loading`, `error`, `showDetails`, `onToggleDetails`, `onOpenNextStep`, `onExportBundle`, `exportingBundle`, `canExport`
**Renders:** Readiness status overview, grouped checks with status colors, next-step action buttons, export copy/download buttons

### `NewsletterSetupPanel`

**Extracted from:** ArtifactsTab lines ~1081-1128 + NewsletterMemoryPanel lines ~2464-2646
**File:** `src/app/components/editor/NewsletterSetupPanel.tsx`
**Props:** `storyId`, `projectMode`, `modeConfig`, `currentChapter`, `onProfileChange`
**Renders:** Setup drawer toggle, publication profile editor, newsletter memory snapshot with collapsible detail

### `artifactsHelpers.ts`

**Extracted from:** ArtifactsTab lines ~2036-2462
**File:** `src/app/lib/artifactsHelpers.ts`
**Contains:** All utility functions — `getNewsletterSelectionFieldForOutputType`, `parseNumberedOptions`, `summarizeSelectionValue`, `formatArtifactListMeta`, `labelContextSource`, `labelArtifactKind`, `formatTimestamp`, `getReadinessStatusLabel`, `getReadinessStatusClasses`, `getReadinessErrorMessage`, `buildReadinessGroups`, `getAggregateReadinessStatus`, `formatScopeLabel`, `READINESS_GROUPS` constant, `FilterOption`/`ScopeOption`/`ReadinessGroupSummary` interfaces

### Result

ArtifactsTab becomes ~700-800 lines:
- Filter state and computed filter values
- Artifact list/detail layout logic (split vs stacked)
- ArtifactList inline component
- ArtifactDetail inline component (slimmed by package selection hook extraction)
- Composing NewsletterReadinessPanel, NewsletterSetupPanel, PlanningArtifactEditor

---

## Part 4: Fiction Flow Friction Fixes

### Fix 1: Streaming failure recovery

**File:** `useStoryStreaming.ts`
**Problem:** Story created with title "Generating..." — if stream fails, user stuck with empty story.
**Fix:**
- On stream error with accumulated text: save text, show error banner with "Retry" / "Keep what was generated"
- On stream error with no text: show error with "Try again" / "Go back"
- Replace "Generating..." title with user's original title or "Untitled" on failure
- Return `streamError` object with `hasPartialContent` flag so StoryEditor can render appropriate recovery UI

### Fix 2: Disable chapter switching during streaming

**Files:** `useChapterEditor.ts`, `EditorToolbar.tsx`
**Problem:** Chapter nav buttons stay clickable during streaming but silently no-op.
**Fix:**
- `useChapterEditor` accepts `streamingActive` as a hook parameter (not a function parameter)
- `switchChapter` reads this internally and returns early if true
- EditorToolbar receives `streamingActive` prop
- Chapter nav buttons get `disabled` state with `opacity-40 cursor-not-allowed` styling

**Edge case:** `handleContinue` sets `currentChapterIdx` to an intentionally out-of-bounds index (`story.chapters.length`) until the new chapter is saved. `useChapterEditor` must NOT bounds-check this — the out-of-bounds index is the signal to show an empty editor during streaming. `switchChapter` only bounds-checks user-initiated switches, not programmatic ones. Expose a separate `setChapterIdx(idx)` for the streaming hook to use without guards.

### Fix 3: Continuity check notification

**File:** `useChapterAnnotations.ts`
**Problem:** Annotations appear silently — user may never notice.
**Fix:**
- `useChapterAnnotations` exposes a `refresh(chapterId)` method for post-generation use
- When `refresh()` is called (not the passive fetch-on-chapter-change effect), and results contain severity `warning` or `error`:
- Set `pendingNotification: { count, firstAnnotation }`
- StoryEditor renders brief toast: "{count} continuity issue(s) found" with "Review" button
- "Review" scrolls to first annotation and opens tooltip
- Auto-dismisses after 8 seconds

**Important distinction:** The toast only appears after `refresh()` (post-generation). The passive `useEffect` fetch on chapter switch does NOT trigger the toast — that would be annoying when navigating between chapters that already have annotations.

### Fix 4: Autosave failure feedback

**File:** `useAutosave.ts` (existing hook), `EditorFooter.tsx`
**Problem:** Save errors logged to console only.
**Fix:**
- Add `onError?: (error: Error) => void` callback to useAutosave options
- Add `lastSaveError` to return value
- EditorFooter receives `saveError` prop
- Shows subtle red text: "Save failed — retrying..." when error present
- Auto-retry after 5 seconds (existing debounce mechanism)

### Fix 5: Craft tools tab consistency

**Files:** `CraftTab.tsx`, `SidePanel.tsx`
**Problem:** Toolbar buttons open craft results directly, but craft lives in "Advanced" — confusing.
**Fix:**
- When a toolbar craft button triggers, SidePanel opens directly to the CraftTab content
- CraftTab renders a breadcrumb at the top of its own content area (above the results): "Writing tools > Rewrite" (using `craftPanel.activeTool` for the label)
- The breadcrumb is a text label only, not a navigation link — it just provides orientation
- SidePanel itself does not change tab structure; CraftTab is simply rendered when `activeTab === "craft"`
- No change to tab organization — toolbar buttons remain shortcuts that bypass the tab hierarchy

### Fix 6: Direction input scoping

**File:** `CraftTab.tsx`
**Problem:** Direction/tone input shows for all tools including Describe and Brainstorm.
**Fix:**
- Only render direction input when `activeTool === "rewrite" || activeTool === "expand"`
- Hide for brainstorm and describe

---

## File Map

### New files
```
src/app/hooks/useStoryStreaming.ts
src/app/hooks/useChapterAnnotations.ts
src/app/hooks/useChapterEditor.ts
src/app/hooks/useCodexFocus.ts
src/app/hooks/useMediaQuery.ts
src/app/hooks/useReadinessReport.ts
src/app/hooks/usePackageSelection.ts
src/app/hooks/usePlanningDrafts.ts
src/app/components/editor/NewsletterReadinessPanel.tsx
src/app/components/editor/NewsletterSetupPanel.tsx
src/app/lib/artifactsHelpers.ts
src/app/lib/editorUtils.ts
```

### Modified files
```
src/app/components/editor/StoryEditor.tsx     — 1,058 → ~400 lines
src/app/components/editor/ArtifactsTab.tsx    — 2,646 → ~700-800 lines
src/app/components/editor/EditorToolbar.tsx   — add streamingActive prop
src/app/components/editor/EditorFooter.tsx    — add saveError prop
src/app/components/editor/CraftTab.tsx        — scope direction input
src/app/components/editor/SidePanel.tsx       — add craft breadcrumb
src/app/components/editor/useAutosave.ts      — add onError callback
```

### Unchanged
- All API routes
- All database schema / migrations
- All type definitions
- All existing hook interfaces (useCraftPanel, useCodex, useCodexMentions, etc.)
- All other components

---

## Edge Cases & Guards

### Annotation fetch cancellation
`useChapterAnnotations` must cancel in-flight annotation fetches when `chapterId` changes. Use an AbortController in the fetch effect and abort on cleanup. This prevents annotations from a previous chapter appearing in the current one if the user switches chapters while post-processing is running.

### Editor null during SSR
`useStoryStreaming` receives `editor` which may be `null` during SSR or before Tiptap hydration. All editor method calls must use optional chaining (`editor?.commands.insertContent()`). The streaming initiation effect must guard on `editor !== null`.

### Streaming state as ref for async callbacks
`useStoryStreaming` must use a ref for the accumulated `fullText` inside the SSE callback to avoid stale closure reads. The state version is for rendering; the ref version is for the streaming callback accumulator.

---

## Backwards Compatibility

- All existing exports stay intact
- Component props unchanged (new optional props only)
- Hook return values unchanged (new optional fields only)
- No behavior changes except the 6 targeted friction fixes
- No visual changes except: disabled chapter nav during streaming, save error indicator, continuity toast, craft breadcrumb, scoped direction input

## Verification

After implementation:
1. TypeScript compiles clean (`tsc --noEmit`)
2. ESLint passes (`npm run lint`)
3. Manual walkthrough: create story → stream first chapter → use craft tool → check Codex → continue chapter → see continuity annotations → adapt chapter
4. Verify streaming failure recovery with network throttle
5. Verify autosave error indicator with network disconnect
6. Verify mobile layout unchanged
