# Mobile Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 4 highest-impact mobile UX issues: safe area insets, bottom sheet scroll conflicts, annotation tooltip overflow, and touch target sizes.

**Architecture:** All fixes are independent CSS/layout changes to existing components. No new files, no API changes, no state management changes. Each task modifies 1-4 files.

**Tech Stack:** Next.js 16+ (App Router), React, TypeScript, Tailwind CSS v4

---

## File Map

All modifications only — no new files:

| File | Fix | Change |
|------|-----|--------|
| `src/app/layout.tsx` | 1 | Add `Viewport` export with `viewportFit: "cover"` |
| `src/app/components/editor/EditorToolbar.tsx:67` | 1 | Add top safe area padding |
| `src/app/components/editor/EditorFooter.tsx:21` | 1 | Add bottom safe area padding |
| `src/app/components/editor/MobileBottomSheet.tsx` | 1+2 | Add bottom safe area + scroll-aware dismiss |
| `src/app/components/editor/AnnotationTooltip.tsx:115` | 3 | Add `max-w` cap |
| `src/app/components/ToneSelector.tsx:30` | 4 | Add `min-h-[44px]` |
| `src/app/components/TropeSelector.tsx:41,64` | 4 | Add `min-h-[44px]` to tabs + chips |
| `src/app/components/RelationshipSelector.tsx:29` | 4 | Add `min-h-[44px]` |
| `src/app/components/RatingSelector.tsx:27` | 4 | Add `min-h-[44px]` |

---

### Task 1: Safe area insets

**Files:**
- Modify: `src/app/layout.tsx:1,16`
- Modify: `src/app/components/editor/EditorToolbar.tsx:67`
- Modify: `src/app/components/editor/EditorFooter.tsx:21`
- Modify: `src/app/components/editor/MobileBottomSheet.tsx:63`

- [ ] **Step 1: Add Viewport export to layout.tsx**

Change the import on line 1 from:
```typescript
import type { Metadata } from "next";
```
to:
```typescript
import type { Metadata, Viewport } from "next";
```

Add after the `metadata` export (after line 19):
```typescript
export const viewport: Viewport = {
  viewportFit: "cover",
};
```

- [ ] **Step 2: Add top safe area to EditorToolbar**

On line 67, change:
```
<header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0">
```
to:
```
<header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0 pt-[env(safe-area-inset-top)]">
```

- [ ] **Step 3: Add bottom safe area to EditorFooter**

On line 21, change:
```
<footer className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0">
```
to:
```
<footer className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0 pb-[env(safe-area-inset-bottom)]">
```

- [ ] **Step 4: Add bottom safe area to MobileBottomSheet**

On line 63, change:
```
className="absolute bottom-0 left-0 right-0 bg-[#13101e] rounded-t-2xl border-t border-zinc-700 max-h-[60vh] overflow-y-auto transition-transform duration-300 ease-out"
```
to:
```
className="absolute bottom-0 left-0 right-0 bg-[#13101e] rounded-t-2xl border-t border-zinc-700 max-h-[60vh] overflow-y-auto transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)]"
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/components/editor/EditorToolbar.tsx src/app/components/editor/EditorFooter.tsx src/app/components/editor/MobileBottomSheet.tsx
git commit -m "fix(mobile): add safe area insets for notch and gesture bar"
```

---

### Task 2: Bottom sheet scroll-aware dismiss

**Files:**
- Modify: `src/app/components/editor/MobileBottomSheet.tsx`

- [ ] **Step 1: Add drag handle ref tracking**

Add a new ref after line 19 (`currentTranslateY`):
```typescript
const isDragHandleTouch = useRef(false);
```

- [ ] **Step 2: Update handleTouchStart to detect drag handle**

Replace the `handleTouchStart` callback (lines 21-24) with:
```typescript
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  dragStartY.current = e.touches[0].clientY;
  currentTranslateY.current = 0;
  const target = e.target as HTMLElement;
  isDragHandleTouch.current = !!target.closest("[data-drag-handle]");
}, []);
```

- [ ] **Step 3: Update handleTouchMove to check scrollTop**

Replace the `handleTouchMove` callback (lines 26-33) with:
```typescript
const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (dragStartY.current === null || !sheetRef.current) return;
  const deltaY = e.touches[0].clientY - dragStartY.current;
  if (deltaY > 0) {
    // Only allow dismiss gesture if drag started on handle OR content is scrolled to top
    if (isDragHandleTouch.current || sheetRef.current.scrollTop <= 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      e.preventDefault();
    }
  }
}, []);
```

- [ ] **Step 4: Add data-drag-handle attribute to drag handle div**

On line 69, change:
```html
<div className="flex justify-center pt-3 pb-2">
```
to:
```html
<div data-drag-handle className="flex justify-center pt-3 pb-2">
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add src/app/components/editor/MobileBottomSheet.tsx
git commit -m "fix(mobile): only dismiss bottom sheet when scrolled to top or via drag handle"
```

---

### Task 3: Annotation tooltip width cap

**Files:**
- Modify: `src/app/components/editor/AnnotationTooltip.tsx:115`

- [ ] **Step 1: Add max-w class to tooltip**

On line 115, change:
```
className={`fixed z-[60] w-72 ${colors.bg} border ${colors.border} rounded-lg shadow-xl p-3 animate-in fade-in duration-200`}
```
to:
```
className={`fixed z-[60] w-72 max-w-[calc(100vw-2rem)] ${colors.bg} border ${colors.border} rounded-lg shadow-xl p-3 animate-in fade-in duration-200`}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/components/editor/AnnotationTooltip.tsx
git commit -m "fix(mobile): cap annotation tooltip width to viewport"
```

---

### Task 4: Touch target minimums on form buttons

**Files:**
- Modify: `src/app/components/ToneSelector.tsx:30`
- Modify: `src/app/components/TropeSelector.tsx:41,64`
- Modify: `src/app/components/RelationshipSelector.tsx:29`
- Modify: `src/app/components/RatingSelector.tsx:27`

- [ ] **Step 1: Add min-h to ToneSelector buttons**

On line 30, change:
```
className={`flex flex-col items-start px-3 py-2 rounded-lg text-sm transition-colors ${
```
to:
```
className={`flex flex-col items-start px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] ${
```

- [ ] **Step 2: Add min-h to TropeSelector category tabs**

On line 41, change:
```
className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
```
to:
```
className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 min-h-[44px] ${
```

- [ ] **Step 3: Add min-h to TropeSelector chips**

On line 64, change:
```
className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
```
to:
```
className={`px-3 py-1.5 rounded-full text-sm transition-colors min-h-[44px] ${
```

- [ ] **Step 4: Add min-h to RelationshipSelector buttons**

On line 29, change:
```
className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
```
to:
```
className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
```

- [ ] **Step 5: Add min-h to RatingSelector buttons**

On line 27, change:
```
className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
```
to:
```
className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
```

- [ ] **Step 6: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ Compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add src/app/components/ToneSelector.tsx src/app/components/TropeSelector.tsx src/app/components/RelationshipSelector.tsx src/app/components/RatingSelector.tsx
git commit -m "fix(mobile): ensure 44px minimum touch targets on form buttons"
```
