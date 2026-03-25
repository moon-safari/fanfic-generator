# Craft Tools UX Redesign — Design Spec

## Goal

Redesign the craft tools (Rewrite, Expand, Describe, Brainstorm) to match or exceed Sudowrite's polish level, with a unified tabbed side panel, sensory Describe, expanded Brainstorm, persistent history, and a mobile bottom sheet — all integrated into the existing Tiptap editor.

## Architecture

The editor gains a unified side panel with three tabs (Bible, Craft, History) replacing the current separate Bible panel and floating craft preview. Craft tools move from a floating toolbar/drawer to persistent header buttons. Results render in the Craft tab. History is persisted per chapter in Supabase. Mobile uses a bottom sheet instead of the side panel.

## Tech Stack

- React + TypeScript (existing)
- Tiptap 2 / ProseMirror (existing editor)
- Tailwind CSS (existing)
- Supabase Postgres (existing, new `craft_history` table)
- Anthropic Claude API — Haiku for craft tools (existing)
- Lucide React icons (existing)

---

## Design Decisions

| Question | Choice | Key |
|----------|--------|-----|
| Desktop panel layout | Unified tabbed side panel (Bible/Craft/History) | C |
| Tool trigger | Persistent top toolbar + selection hint | C |
| Describe format | Sensory categories (Sight/Smell/Sound/Touch/Taste) + Blend | C |
| Brainstorm layout | Expanded panel (~50% width) | B |
| History persistence | Per-chapter, saved to database | B |
| Mobile results | Bottom sheet | A |
| Insert action | Replace selection with undo toast (5s) | B |
| Scope | Craft tools UX + sensory Describe + tool history | C |

---

## 1. Unified Tabbed Side Panel

### Current State

- `StoryBiblePanel.tsx` renders as a standalone right panel (35% width, min 320px) with its own header (close/back buttons), loading skeleton, section accordion, and regenerate footer
- `CraftPreview.tsx` renders as a fixed overlay at the bottom of the viewport
- No history panel exists

### Target State

A single `SidePanel` component with three tabs:

- **Bible** — existing `StoryBiblePanel` content, extracted into a tab body
- **Craft** — craft tool results (replaces `CraftPreview`)
- **History** — per-chapter craft history log

### Behavior

- Panel is hidden by default on desktop; opens when Bible icon or a craft tool is clicked
- Clicking a craft tool auto-switches to the Craft tab
- Clicking the Bible icon switches to Bible tab
- Panel width: 35% (min 320px), same as current Bible panel
- Tab bar: 3 equal tabs with active indicator (2px bottom border, purple)
- Close button (X) on desktop, back arrow on mobile (existing pattern)
- When panel is closed, editor takes full width

### StoryBiblePanel Extraction

The current `StoryBiblePanel` is a self-contained component with:
- Outer wrapper div (width, background, border, animation classes)
- Header with close/back buttons
- Loading skeleton
- Section accordion list
- Regenerate footer

**After extraction**, `StoryBiblePanel` becomes a "headless" body component:

```typescript
// New props — no onClose, no outer shell
interface StoryBibleBodyProps {
  storyId: string;
}
```

- Removes the outer wrapper div (width, positioning, z-index) — `SidePanel` owns that
- Removes the header with close/back buttons — `SidePanel` has its own close button
- Keeps: loading skeleton (rendered inside its tab area), section accordion, regenerate footer
- `SidePanel` renders `<StoryBibleBody storyId={storyId} />` inside the Bible tab

### Files to Create/Modify

- Create: `src/app/components/editor/SidePanel.tsx` — tabbed container with close button, tab bar, tab content area
- Create: `src/app/components/editor/CraftTab.tsx` — craft results display
- Create: `src/app/components/editor/HistoryTab.tsx` — history display
- Modify: `src/app/components/editor/StoryEditor.tsx` — replace separate Bible panel + CraftPreview with SidePanel
- Modify: `src/app/components/story-bible/StoryBiblePanel.tsx` — extract into `StoryBibleBody` (remove outer shell, header, close logic)

---

## 2. Editor Toolbar with Craft Tools

### Current State

- `CraftToolbar.tsx` renders as a floating bar that appears on text selection
- `CraftDrawer.tsx` renders on mobile as a slide-up drawer
- `EditorToolbar.tsx` has the chapter nav, Bible icon, and overflow menu. Current props:
  ```typescript
  interface EditorToolbarProps {
    story: Story;
    currentChapterIdx: number;
    totalChapters: number;
    showBible: boolean;
    annotationCount?: number;
    onBack: () => void;
    onPrevChapter: () => void;
    onNextChapter: () => void;
    onToggleBible: () => void;
    onExport: () => void;
    onDelete: () => void;
  }
  ```

### Target State

Craft tool buttons live permanently in the editor header toolbar, right-aligned, next to the Bible icon:

```
← Story Title  |  ◀ Ch 2 of 5 ▶        ✏️ Rewrite  📐 Expand  🎨 Describe  💡 Brainstorm  |  📖  ⋮
```

### New EditorToolbar Props

```typescript
interface EditorToolbarProps {
  // ... existing props unchanged ...
  // New craft tool props:
  activeTool: CraftTool | null;
  hasSelection: boolean;         // whether editor has text selected
  craftLoading: boolean;         // show spinner on active tool button
  onCraftTool: (tool: CraftTool) => void;  // called when a craft button is clicked
}
```

- `activeTool` highlights the active button (purple tint + border)
- `hasSelection` determines behavior: if false and a tool is clicked, show "Select text" hint in Craft tab instead of calling the API
- `craftLoading` shows a subtle spin animation on the active tool's icon
- `onCraftTool` callback triggers the craft tool flow in the parent

### Behavior

- Tools are always visible (not dependent on selection)
- Clicking a tool with selected text: triggers the tool, opens side panel to Craft tab, shows loading then results
- Clicking a tool without selected text: opens side panel to Craft tab showing "Select text to use craft tools" hint
- Active tool is highlighted (purple background tint + border)
- On mobile (< 768px), tools render as emoji-only icons in the header (no labels)

### Selection Hint

When text is selected and the user hasn't clicked a tool yet, no floating toolbar appears. The toolbar buttons are always visible — the selection itself (purple highlight) is the only indicator.

### Files to Create/Modify

- Modify: `src/app/components/editor/EditorToolbar.tsx` — add craft tool buttons and new props
- Delete: `src/app/components/editor/CraftToolbar.tsx` — replaced by toolbar buttons
- Delete: `src/app/components/editor/CraftDrawer.tsx` — replaced by mobile bottom sheet

---

## 3. Craft Tab — Tool Results

### Rewrite / Expand Results

Single result card with:
- Tool label + direction (e.g., "REWRITE · Show, not tell")
- Direction input field + "Go" button for re-running with different direction
- Result text (the generated rewrite/expansion)
- Action buttons: "Insert" (primary purple) + "Copy" (secondary)
- Helper text: "Try another direction or select new text"

### Describe Results — Sensory Categories + Blend

The Describe API response changes from `{ result: string[] }` to a structured sensory format.

**New API Response Shape (wrapped in `result` key for consistency):**
```typescript
// Response: { result: DescribeResult }
interface DescribeResult {
  blend: string;        // Combined best-of-all-senses description
  senses: {
    type: 'sight' | 'smell' | 'sound' | 'touch' | 'taste';
    text: string;
  }[];
}
```

**UI:**
1. **Blend card** (featured, top) — gradient border, "Recommended" label, combined description
2. **Individual sense cards** below — each with sense icon + emoji, sense name, description text
3. Each card has Insert + Copy buttons
4. AI skips senses that don't apply (e.g., no "taste" for a lighthouse)

**Sense Icons:**
| Sense | Emoji | Color |
|-------|-------|-------|
| Sight | 👁 | Blue (#3b82f6) |
| Smell | 👃 | Green (#10b981) |
| Sound | 👂 | Amber (#f59e0b) |
| Touch | 🤚 | Rose (#f43f5e) |
| Taste | 👅 | Orange (#f97316) |
| Blend | ✨ | Purple (#7c3aed) |

### Brainstorm Results — Expanded Panel

**Current state:** Brainstorm already returns structured objects with `{ title, description, preview }` (via `BrainstormItem` type in `useCraftTools.ts`). The existing `CraftPreview.tsx` already renders title, description, and preview fields.

**Change:** Rename `preview` → `prose` in the response and type. Update the prompt to generate richer prose previews (1-2 sentences showing how it would read in the story).

When Brainstorm is active:
- Side panel expands to ~50% of viewport width (from 35%)
- Editor dims slightly (opacity: 0.7) to focus attention
- Panel shows 3-5 idea cards, each with:
  - **Title** (bold, e.g., "The lighthouse keeper is alive")
  - **Description** (2-3 sentences explaining the idea)
  - **Prose** (italic quote showing how it might read in the story)
  - Action buttons: "Use this" (inserts prose) + "Copy"
- "Generate more" link at top-right generates additional ideas
- Closing Brainstorm or switching tabs returns panel to normal width

### Error States

When a craft API call fails:
- **Craft tab (desktop):** Shows an error card with message and "Try again" button. Example: "Something went wrong generating your rewrite. [Try again]"
- **Mobile bottom sheet:** Same error card inside the sheet
- **Toolbar:** Active tool button stops spinning, returns to normal state
- Error card uses `border-red-800/40` with `text-red-400` message text
- "Try again" re-runs the same tool with the same parameters

### Files to Create/Modify

- Create: `src/app/components/editor/CraftTab.tsx` — result display for all 4 tools + error state
- Create: `src/app/components/editor/DescribeResults.tsx` — sensory cards + blend
- Create: `src/app/components/editor/BrainstormResults.tsx` — expanded idea cards
- Modify: `src/app/api/craft/describe/route.ts` — return structured sensory response wrapped in `{ result: DescribeResult }`
- Modify: `src/app/api/craft/brainstorm/route.ts` — rename `preview` → `prose` in response objects

---

## 4. Insert Action — Replace with Undo Toast

### Behavior

1. User clicks "Insert" on any result card
2. Selected text in editor is replaced with the craft result (single Tiptap transaction via `editor.chain().focus().deleteRange().insertContentAt().run()`)
3. Side panel stays open (user may want to try another direction)
4. An **undo toast** appears at bottom-center of the editor:
   ```
   ✓ Inserted rewrite — [Undo] 4s
   ```
5. Toast shows a countdown (5s → 0s) then fades out
6. Clicking "Undo" calls `editor.commands.undo()` which reverts the transaction (text replacement). Note: this restores the text content but does not restore the original selection range — this is acceptable behavior.
7. After undo, toast dismisses immediately

### Toast Design

- Background: `#1a1025` with `#7c3aed40` border
- Position: absolute, bottom 60px, centered
- Rounded corners, subtle shadow
- "Undo" button in purple
- Auto-dismisses after 5 seconds with fade-out animation

### Files to Create/Modify

- Create: `src/app/components/editor/UndoToast.tsx` — toast component with countdown
- Modify: `src/app/components/editor/StoryEditor.tsx` — insert logic + undo state management

---

## 5. History Tab — Persistent per Chapter

### Database

New Supabase table:

```sql
CREATE TABLE craft_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('rewrite', 'expand', 'describe', 'brainstorm')),
  direction TEXT,
  selected_text TEXT NOT NULL,
  result JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'inserted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_craft_history_story_chapter ON craft_history(story_id, chapter_number);
ALTER TABLE craft_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own craft history"
  ON craft_history FOR ALL USING (auth.uid() = user_id);
```

### History Save Strategy

History is saved **server-side within each craft API route** after successfully generating results. This is simpler and more reliable than client-side POSTing. Each craft route (`rewrite`, `expand`, `describe`, `brainstorm`) inserts a `craft_history` row before returning the response. The `user_id` and `story_id` are already available in the route handler via `authenticateAndFetchBible`.

The client only needs to:
- `GET /api/craft/history?storyId=X&chapter=N` — fetch history for display
- `PATCH /api/craft/history/[id]` — update status when user inserts or dismisses

### API

- `GET /api/craft/history?storyId=X&chapter=N` — fetch history for a chapter (reverse chronological)
- `PATCH /api/craft/history/[id]` — update status (inserted/dismissed)

### UI

- Grouped by chapter, reverse chronological
- Current chapter entries shown expanded
- Older chapters collapsed with count ("Chapter 1 · Yesterday — 4 entries")
- Each entry shows:
  - Tool type icon + name
  - Direction (if applicable)
  - Result preview (truncated to 2 lines)
  - Timestamp + status badge (Inserted in green, Dismissed in gray)
  - "Re-insert" + "Copy" action links

### Files to Create/Modify

- Create: `src/app/components/editor/HistoryTab.tsx` — history list UI
- Create: `src/app/api/craft/history/route.ts` — GET endpoint
- Create: `src/app/api/craft/history/[id]/route.ts` — PATCH endpoint
- Create: `src/app/lib/supabase/craftHistory.ts` — database helpers
- Modify: `src/app/api/craft/rewrite/route.ts` — save history entry after generation
- Modify: `src/app/api/craft/expand/route.ts` — save history entry after generation
- Modify: `src/app/api/craft/describe/route.ts` — save history entry after generation
- Modify: `src/app/api/craft/brainstorm/route.ts` — save history entry after generation

---

## 6. Mobile — Bottom Sheet

### Current State

`CraftDrawer.tsx` is a mobile-only drawer with tool buttons. Results show in `CraftPreview.tsx`.

### Target State

On mobile (< 768px):
- Craft tools render as emoji-only icons in the editor header
- When a tool is used, a **bottom sheet** slides up from the bottom
- Sheet has a drag handle (32px wide, centered) for swipe-to-dismiss
- Sheet contains: direction input + Go button, result card(s), Insert/Copy actions
- Pressing Insert dismisses the sheet and shows the undo toast
- Bible and History are accessible via their header icons, opening as full-screen overlays (existing pattern)

### Sheet Behavior

- Slides up with spring animation (300ms ease-out)
- Max height: 60vh (scrollable if content exceeds)
- Swipe down to dismiss
- Tapping outside (on dimmed editor) dismisses
- Describe shows Blend card first, then scrollable sense cards
- Brainstorm shows idea cards in a scrollable list (no panel expansion on mobile)

### Files to Create/Modify

- Create: `src/app/components/editor/MobileBottomSheet.tsx` — generic bottom sheet with drag-to-dismiss
- Create: `src/app/components/editor/MobileCraftSheet.tsx` — craft-specific bottom sheet content
- Delete: `src/app/components/editor/CraftDrawer.tsx` — replaced by bottom sheet

---

## 7. Loading States

All craft tools show a loading state while the API call is in progress:

- **Craft tab**: Skeleton pulse cards matching the expected result layout
- **Mobile sheet**: Same skeleton inside the bottom sheet
- **Toolbar**: Active tool button shows a subtle spinning indicator
- Generation typically takes 2-5 seconds (Haiku is fast)

---

## 8. API Changes

### Request Body (All Craft APIs)

The request body uses the existing field names from `shared.ts`. No changes to the request shape:

```typescript
// Request body (unchanged — uses existing field names)
{
  storyId: string;
  selectedText: string;
  context?: string;    // surrounding chapter text for context
  direction?: string;  // user-provided direction (rewrite/expand only)
}
```

The shared `authenticateAndFetchBible` helper in `src/app/api/craft/shared.ts` parses these fields and fetches the Bible context. No changes needed to the shared helper.

### Describe API (`/api/craft/describe`)

**Current:** Returns `{ result: string[] }` (array of description options).

**New:** Returns `{ result: DescribeResult }` (structured sensory response):

```typescript
// Response (new shape, keeping `result` wrapper)
{
  result: {
    blend: string,
    senses: Array<{ type: 'sight' | 'smell' | 'sound' | 'touch' | 'taste', text: string }>
  }
}
```

The prompt changes to instruct Claude to return JSON with a `blend` field and a `senses` array. Only relevant senses are included.

### Brainstorm API (`/api/craft/brainstorm`)

**Current:** Returns `{ result: BrainstormItem[] }` where `BrainstormItem` is `{ title: string, description: string, preview: string }`. This is already structured — not a list of plain strings.

**Change:** Rename `preview` → `prose` in the response objects for clarity. Update the prompt to generate richer prose previews.

```typescript
// Response (renamed field)
{
  result: Array<{
    title: string,
    description: string,
    prose: string          // renamed from "preview"
  }>
}
```

### All Craft APIs — History Save

Each craft route adds a server-side insert into `craft_history` after successful generation, before returning the response. Uses the same Supabase client already created in the route.

---

## 9. State Management

### New Hook: `useCraftPanel`

Replaces the current `useCraftTools` hook (`src/app/components/editor/useCraftTools.ts`). Manages the unified panel state:

```typescript
import { CraftTool } from './useCraftTools'; // reuse type

// Updated CraftResult to match new response shapes
type CraftResult =
  | { type: 'rewrite'; text: string }
  | { type: 'expand'; text: string }
  | { type: 'describe'; blend: string; senses: Array<{ type: string; text: string }> }
  | { type: 'brainstorm'; ideas: Array<{ title: string; description: string; prose: string }> };

interface CraftPanelState {
  isOpen: boolean;
  activeTab: 'bible' | 'craft' | 'history';
  activeTool: CraftTool | null;
  selectedText: string | null;
  direction: string;                        // preserved per tool session, cleared on tool change
  result: CraftResult | null;
  error: string | null;                     // error message from failed API call
  loading: boolean;
  panelWidth: 'normal' | 'expanded';        // expanded for brainstorm
}
```

**Direction behavior:** `direction` is cleared when the user switches to a different tool. It persists while the same tool is active so the user can see what direction they used and modify it for a re-run.

### Undo State

```typescript
interface UndoState {
  visible: boolean;
  toolLabel: string;     // e.g., "rewrite" for display in toast
  countdown: number;     // seconds remaining (5 → 0)
}
```

Undo relies on Tiptap's built-in undo stack (`editor.commands.undo()`). No need to store previous content manually.

### Files to Create/Modify

- Create: `src/app/hooks/useCraftPanel.ts` — new unified hook
- Delete: `src/app/components/editor/useCraftTools.ts` — replaced by useCraftPanel

---

## 10. Existing Code to Remove

- `src/app/components/editor/CraftToolbar.tsx` — floating toolbar, replaced by header buttons
- `src/app/components/editor/CraftDrawer.tsx` — mobile drawer, replaced by bottom sheet
- `src/app/components/editor/CraftPreview.tsx` — inline preview, replaced by Craft tab
- `src/app/components/editor/useCraftTools.ts` — replaced by `useCraftPanel`
- Floating toolbar logic in `StoryEditor.tsx` (selection-based toolbar show/hide)

---

## 11. Non-Goals (Out of Scope)

- Real-time collaboration / multiplayer editing
- Craft tool keyboard shortcuts (future enhancement)
- Custom user-defined craft tools
- Streaming craft results (batch response is fine for Haiku speed)
- Visual/illustration tools (separate future feature)
