# Mobile Polish Pass — Design Spec

**Goal:** Fix the 5 highest-impact mobile UX issues that would frustrate real users on iPhone and Android devices.

**Scope:** Targeted fixes only — no layout redesigns, no new features. Approach A from brainstorming.

**Devices targeted:** iPhone 14 (390px), iPhone SE (375px), Pixel 7 (412px), Galaxy S23 (360px). Both iOS Safari and Android Chrome.

---

## Fix 1: Safe Area Insets

**Problem:** On iPhones with notch/Dynamic Island and Android devices with gesture navigation bars, content at the top and bottom edges gets clipped or hidden behind system UI.

**Files:**
- Modify: `src/app/layout.tsx` — add `viewport-fit=cover` via Next.js Metadata API
- Modify: `src/app/components/editor/EditorToolbar.tsx` — add top safe area padding
- Modify: `src/app/components/editor/EditorFooter.tsx` — add bottom safe area padding
- Modify: `src/app/components/editor/MobileBottomSheet.tsx` — add bottom safe area padding

**Implementation:**

In `layout.tsx`, export a `viewport` config:
```typescript
export const viewport: Viewport = {
  viewportFit: "cover",
};
```

On the three components, add Tailwind's safe area utilities or inline `env()` padding:
- EditorToolbar header: `pt-[env(safe-area-inset-top)]`
- EditorFooter: `pb-[env(safe-area-inset-bottom)]`
- MobileBottomSheet inner sheet: `pb-[env(safe-area-inset-bottom)]`

**Risk:** None. `env(safe-area-inset-*)` evaluates to `0px` on devices without notches/gesture bars.

---

## Fix 2: Bottom Sheet Scroll Conflict

**Problem:** `MobileBottomSheet` captures all downward swipe gestures for dismiss. When craft results are long (e.g., Describe with 6 sense cards), users can't scroll the content without accidentally closing the sheet.

**File:** Modify: `src/app/components/editor/MobileBottomSheet.tsx`

**Implementation:**

In `handleTouchMove`, check the sheet's `scrollTop` before allowing the dismiss gesture:
- If `scrollTop > 0`, the user is scrolling content — do not intercept, let native scroll happen.
- If `scrollTop === 0` and the user swipes down, begin the dismiss gesture as before.

Add a ref to track the scrollable content area. The drag handle area at the top should always trigger dismiss regardless of scroll position.

**Behavior:**
- Swiping down on the drag handle → always dismisses
- Swiping down on content when scrolled to top → dismisses
- Swiping down on content when scrolled down → scrolls content up (native behavior)

---

## Fix 3: Annotation Tooltip Overflow

**Problem:** `AnnotationTooltip` uses fixed `w-72` (288px). On a 375px-wide device, with any horizontal offset, the tooltip overflows the viewport causing horizontal scroll.

**File:** Modify: `src/app/components/editor/AnnotationTooltip.tsx`

**Implementation:**

Replace `w-72` with `w-72 max-w-[calc(100vw-2rem)]`. This caps the tooltip at viewport width minus 32px (16px margin each side).

For horizontal positioning, clamp the `left` style so the tooltip stays within viewport bounds:
- `left: Math.max(16, Math.min(anchorLeft, window.innerWidth - tooltipWidth - 16))`

Use a ref + `useLayoutEffect` to measure the tooltip's rendered width and adjust position.

---

## Fix 4: Dropdown Menu Overflow

**Problem:** The `CharacterSelector` dropdown can overflow on mobile. The EditorToolbar's "more options" menu works (uses `right-0`) but character selector dropdowns use absolute positioning that can go off-screen.

**Files:**
- Modify: `src/app/components/CharacterSelector.tsx` — constrain dropdown

**Implementation:**

Add `max-h-[50vh] overflow-y-auto` to the dropdown list so it doesn't exceed half the viewport height. Add `left-0 right-0` to make the dropdown match the parent width instead of growing beyond it. Since the character selector input is already full-width within its container, this naturally constrains the dropdown.

---

## Fix 5: Touch Target Minimums on Form Buttons

**Problem:** Tone buttons, trope chips, relationship buttons, and rating buttons rely on padding for height. On mobile, they render at ~36px — below the 44px minimum recommended by both Apple HIG and Material Design.

**Files:**
- Modify: `src/app/components/ToneSelector.tsx` — add `min-h-[44px]` to tone buttons
- Modify: `src/app/components/TropeSelector.tsx` — add `min-h-[44px]` to trope chips
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
- Dropdown repositioning based on viewport edge detection (complex, low ROI)
