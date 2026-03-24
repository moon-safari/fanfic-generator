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

- `StoryBiblePanel.tsx` renders as a standalone right panel (35% width, min 320px)
- `CraftPreview.tsx` renders inline below the editor
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

### Files to Create/Modify

- Create: `src/app/components/editor/SidePanel.tsx` — tabbed container
- Create: `src/app/components/editor/CraftTab.tsx` — craft results display
- Create: `src/app/components/editor/HistoryTab.tsx` — history display
- Modify: `src/app/components/editor/StoryEditor.tsx` — replace separate Bible panel + CraftPreview with SidePanel
- Modify: `src/app/components/story-bible/StoryBiblePanel.tsx` — extract inner content into a renderable body (no outer shell/close button)

---

## 2. Editor Toolbar with Craft Tools

### Current State

- `CraftToolbar.tsx` renders as a floating bar that appears on text selection
- `CraftDrawer.tsx` renders on mobile as a slide-up drawer
- `EditorToolbar.tsx` has the chapter nav and Bible icon

### Target State

Craft tool buttons live permanently in the editor header toolbar, right-aligned, next to the Bible icon:

```
← Story Title  |  ◀ Ch 2 of 5 ▶        ✏️ Rewrite  📐 Expand  🎨 Describe  💡 Brainstorm  |  📖  ⋮
```

### Behavior

- Tools are always visible (not dependent on selection)
- Clicking a tool with selected text: triggers the tool, opens side panel to Craft tab, shows loading then results
- Clicking a tool without selected text: shows a subtle hint near cursor or in the Craft tab: "Select text to use craft tools"
- Active tool is highlighted (purple background tint + border)
- On mobile (< 768px), tools render as emoji-only icons in the header (no labels)

### Selection Hint

When text is selected and the user hasn't clicked a tool yet, no floating toolbar appears. The toolbar buttons are always visible — the selection itself (purple highlight) is the only indicator.

### Files to Create/Modify

- Modify: `src/app/components/editor/EditorToolbar.tsx` — add craft tool buttons inline
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

The Describe API returns structured sensory descriptions:

**API Response Shape:**
```typescript
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

When Brainstorm is active:
- Side panel expands to ~50% of viewport width (from 35%)
- Editor dims slightly (opacity: 0.7) to focus attention
- Panel shows 3-5 idea cards, each with:
  - **Title** (bold, e.g., "The lighthouse keeper is alive")
  - **Description** (2-3 sentences explaining the idea)
  - **Prose preview** (italic quote showing how it might read in the story)
  - Action buttons: "Use this" (inserts prose preview) + "Copy"
- "Generate more" link at top-right generates additional ideas
- Closing Brainstorm or switching tabs returns panel to normal width

### Files to Create/Modify

- Create: `src/app/components/editor/CraftTab.tsx` — result display for all 4 tools
- Create: `src/app/components/editor/DescribeResults.tsx` — sensory cards + blend
- Create: `src/app/components/editor/BrainstormResults.tsx` — expanded idea cards
- Modify: `src/app/api/craft/describe/route.ts` — return structured sensory response
- Modify: `src/app/api/craft/brainstorm/route.ts` — return structured ideas with title/description/prose

---

## 4. Insert Action — Replace with Undo Toast

### Behavior

1. User clicks "Insert" on any result card
2. Selected text in editor is replaced with the craft result
3. Side panel stays open (user may want to try another direction)
4. An **undo toast** appears at bottom-center of the editor:
   ```
   ✓ Inserted rewrite — [Undo] 4s
   ```
5. Toast shows a countdown (5s → 0s) then fades out
6. Clicking "Undo" reverts the editor to the pre-insert state
7. Undo uses Tiptap's built-in undo (transaction-based)

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

### API

- `GET /api/craft/history?storyId=X&chapter=N` — fetch history for a chapter
- `POST /api/craft/history` — save a history entry (called automatically when a craft tool returns results)
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
- Create: `src/app/api/craft/history/route.ts` — GET + POST endpoints
- Create: `src/app/api/craft/history/[id]/route.ts` — PATCH endpoint
- Create: `src/app/lib/supabase/craftHistory.ts` — database helpers
- Modify: existing craft API routes to save history after generation

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

### Describe API (`/api/craft/describe`)

Current: Returns a single string description.

New: Returns structured sensory response:

```typescript
// Request (unchanged)
{ storyId: string, selectedText: string, chapterContent: string }

// Response (new shape)
{
  blend: string,
  senses: Array<{ type: string, text: string }>
}
```

The prompt instructs Claude to return JSON with a `blend` field and a `senses` array. Only relevant senses are included.

### Brainstorm API (`/api/craft/brainstorm`)

Current: Returns a list of idea strings.

New: Returns structured ideas:

```typescript
// Request (unchanged)
{ storyId: string, selectedText: string, chapterContent: string }

// Response (new shape)
{
  ideas: Array<{
    title: string,
    description: string,
    prose: string
  }>
}
```

### All Craft APIs

After returning results, each craft API also saves a `craft_history` entry.

---

## 9. State Management

### New Hook: `useCraftPanel`

Manages the unified panel state:

```typescript
interface CraftPanelState {
  isOpen: boolean;
  activeTab: 'bible' | 'craft' | 'history';
  activeTool: 'rewrite' | 'expand' | 'describe' | 'brainstorm' | null;
  selectedText: string | null;
  direction: string;
  result: CraftResult | null;
  loading: boolean;
  panelWidth: 'normal' | 'expanded'; // expanded for brainstorm
}
```

This replaces the current `useCraftTools` hook and scattered state in `StoryEditor.tsx`.

### Undo State

```typescript
interface UndoState {
  visible: boolean;
  previousContent: string | null; // or rely on Tiptap undo stack
  countdown: number;
}
```

---

## 10. Existing Code to Remove

- `src/app/components/editor/CraftToolbar.tsx` — floating toolbar, replaced by header buttons
- `src/app/components/editor/CraftDrawer.tsx` — mobile drawer, replaced by bottom sheet
- `src/app/components/editor/CraftPreview.tsx` — inline preview, replaced by Craft tab
- Floating toolbar logic in `StoryEditor.tsx` (selection-based toolbar show/hide)

---

## 11. Non-Goals (Out of Scope)

- Real-time collaboration / multiplayer editing
- Craft tool keyboard shortcuts (future enhancement)
- Custom user-defined craft tools
- Streaming craft results (batch response is fine for Haiku speed)
- Visual/illustration tools (separate future feature)
