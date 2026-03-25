# Mobile Polish Pass — Design Spec

**Goal:** Fix the highest-impact mobile UX issues that would frustrate real users on iPhone and Android devices.

**Scope:** Targeted fixes only — no layout redesigns, no new features. Approach A from brainstorming.

**Devices targeted:** iPhone 14 (390px), iPhone SE (375px), Pixel 7 (412px), Galaxy S23 (360px). Both iOS Safari and Android Chrome.

---

## Fix 1: Safe Area Insets

**Problem:** On iPhones with notch/Dynamic Island and Android devices with gesture navigation bars, content at the top and bottom edges gets clipped or hidden behind system UI.

**Files:**
- Modify: `src/app/layout.tsx` — add `viewport-fit=cover` via Next.js Viewport API
- Modify: `src/app/components/editor/EditorToolbar.tsx` — add top safe area padding
- Modify: `src/app/components/editor/EditorFooter.tsx` — add bottom safe area padding
- Modify: `src/app/components/editor/MobileBottomSheet.tsx` — add bottom safe area padding

**Implementation:**

In `layout.tsx`, add the `Viewport` import and export a `viewport` config:
```typescript
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  viewportFit: "cover",
};
```

On the three components, add Tailwind arbitrary value classes for safe area padding:
- EditorToolbar header: `pt-[env(safe-area-inset-top)]`
- EditorFooter: `pb-[env(safe-area-inset-bottom)]`
- MobileBottomSheet inner sheet: `pb-[env(safe-area-inset-bottom)]`

**Risk:** None. `env(safe-area-inset-*)` evaluates to `0px` on devices without notches/gesture bars.

---

## Fix 2: Bottom Sheet Scroll Conflict

**Problem:** `MobileBottomSheet` captures all downward swipe gestures for dismiss. When craft results are long (e.g., Describe with 6 sense cards), users can't scroll the content without accidentally closing the sheet.

**File:** Modify: `src/app/components/editor/MobileBottomSheet.tsx`

**Implementation:**

The sheet element (`sheetRef`) is itself the scrollable container (`overflow-y-auto`). No additional ref is needed.

In `handleTouchMove`, read `sheetRef.current.scrollTop` before allowing the dismiss gesture:
- If `sheetRef.current.scrollTop > 0`, the user is scrolling content — do not intercept, let native scroll happen.
- If `sheetRef.current.scrollTop === 0` and the user swipes down (`deltaY > 0`), begin the dismiss gesture as before.

For the drag handle: add a separate `data-drag-handle` attribute to the drag handle div. In `handleTouchStart`, check if the touch originated on or within the drag handle element using `e.target.closest('[data-drag-handle]')`. Store this in a ref (`isDragHandleTouch`). In `handleTouchMove`, if `isDragHandleTouch` is true, always allow dismiss regardless of `scrollTop`.

**Behavior:**
- Swiping down on the drag handle → always dismisses
- Swiping down on content when scrolled to top → dismisses
- Swiping down on content when scrolled down → scrolls content up (native behavior)

---

## Fix 3: Annotation Tooltip Width Cap

**Problem:** `AnnotationTooltip` uses fixed `w-72` (288px). Horizontal position clamping already exists (lines 85-86), but the tooltip's intrinsic width is not capped. On extremely narrow viewports or during the first render frame before the positioning effect fires, the tooltip can be wider than the viewport.

**File:** Modify: `src/app/components/editor/AnnotationTooltip.tsx`

**Implementation:**

Add `max-w-[calc(100vw-2rem)]` alongside the existing `w-72` class. This is a one-line CSS change. No JavaScript changes needed — the existing `useEffect` positioning logic is correct and already handles horizontal clamping.

---

## Fix 4: Touch Target Minimums on Form Buttons

**Problem:** Tone buttons, trope chips, trope category tabs, relationship buttons, and rating buttons rely on padding for height. On mobile, they render at ~32-36px — below the 44px minimum recommended by both Apple HIG and Material Design.

**Files:**
- Modify: `src/app/components/ToneSelector.tsx` — add `min-h-[44px]` to tone buttons
- Modify: `src/app/components/TropeSelector.tsx` — add `min-h-[44px]` to trope chips AND category tab buttons
- Modify: `src/app/components/RelationshipSelector.tsx` — add `min-h-[44px]` to relationship buttons
- Modify: `src/app/components/RatingSelector.tsx` — add `min-h-[44px]` to rating buttons

**Implementation:**

Add `min-h-[44px]` to each interactive button element in these components. This ensures the tap target meets the minimum without changing visual design — the buttons just get slightly taller where needed.

---

## Out of Scope

- Landscape mode optimization
- iOS keyboard avoidance
- Mobile-first form redesign
- CSS `touch-action` optimization
- Disabled button visibility
- Dropdown repositioning (CharacterSelector already has `w-full max-h-48 overflow-y-auto`)
