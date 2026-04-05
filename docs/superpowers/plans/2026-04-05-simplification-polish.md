# Phase A: Simplification & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the default Writing OS experience feel obvious and confident — reduce visible surfaces, use plain language everywhere, improve empty states, and verify mobile readiness.

**Architecture:** This is a UI polish phase — no new backend routes or database changes. All changes are in React components, with mode-aware content unit labels threaded through the last remaining hardcoded spots. The work is organized as four independent tasks (A1–A4) that can be executed in any order.

**Tech Stack:** React 19, TypeScript 5 (strict), Next.js 16, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-05-writing-os-next-steps-roadmap.md` (Phase A)

---

## File Structure

### Modified files

```
src/app/components/memory/ContextConsole.tsx      — thread contentUnitLabel to helper functions
src/app/components/memory/MemoryPanel.tsx          — fix "Ch." hardcode, improve empty state
src/app/components/memory/EntryList.tsx            — improve empty state copy
src/app/components/editor/ArtifactsTab.tsx         — audit default vs Advanced visibility
src/app/components/editor/AdaptTab.tsx             — audit default vs Advanced visibility
src/app/components/editor/SidePanel.tsx            — minor: rename internal tab key references in comments if any
src/app/page.tsx                                   — improve first-run empty state
src/app/components/CreateStoryTab.tsx              — improve mode selection guidance
```

No new files. No deleted files. No type changes.

---

## Task 1: Thread contentUnitLabel to ContextConsole helper functions

**Files:**
- Modify: `src/app/components/memory/ContextConsole.tsx:557-602`

The `formatPriorityLabel()` and `describeNextChapterBehavior()` functions use hardcoded "chapter" strings. The `contentUnitLabel` prop already exists on the component (line 26, defaults to `"chapter"`) but isn't passed to these helpers.

- [ ] **Step 1: Update `formatPriorityLabel` to accept contentUnitLabel**

Change the function signature and replace the hardcoded string:

```typescript
function formatPriorityLabel(
  priority: "priority" | "supporting" | "excluded",
  contentUnitLabel: string
) {
  switch (priority) {
    case "priority":
      return `Next-${contentUnitLabel} focus`;
    case "excluded":
      return "Not injected";
    default:
      return "Supporting context";
  }
}
```

- [ ] **Step 2: Update `describeNextChapterBehavior` to accept contentUnitLabel**

```typescript
function describeNextChapterBehavior(
  contextMode: MemoryContextMode,
  priority: "priority" | "supporting" | "excluded",
  contentUnitLabel: string
) {
  if (contextMode === "exclude") {
    return "Excluded entries stay in the Memory but are omitted from the active prompt context.";
  }

  if (contextMode === "pin") {
    return `Pinned entries are surfaced first in the next ${contentUnitLabel} prompt.`;
  }

  if (priority === "priority") {
    return `This entry will be surfaced early in the next ${contentUnitLabel} prompt because it changed recently, was mentioned, or is tied to a pinned entry.`;
  }

  return "This entry remains available as supporting context after the higher-priority story truth.";
}
```

- [ ] **Step 3: Update all call sites to pass contentUnitLabel**

Find every call to `formatPriorityLabel(...)` and `describeNextChapterBehavior(...)` in ContextConsole.tsx and add the `contentUnitLabel` argument. The prop is already available in the component scope.

Search for these patterns:
- `formatPriorityLabel(` — add `, contentUnitLabel` as second arg
- `describeNextChapterBehavior(` — add `, contentUnitLabel` as third arg

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/app/components/memory/ContextConsole.tsx
git commit -m "fix: thread contentUnitLabel to ContextConsole helper functions"
```

---

## Task 2: Fix hardcoded "Ch." in MemoryPanel summary

**Files:**
- Modify: `src/app/components/memory/MemoryPanel.tsx:161-163`

The header summary line uses `"mentions in Ch. ${currentChapter}"` — this should use the mode-aware content unit label.

- [ ] **Step 1: Read the current memorySummary construction**

Read `src/app/components/memory/MemoryPanel.tsx` lines 155-175 to confirm the exact code and how `contentUnitLabel` is derived.

- [ ] **Step 2: Replace hardcoded "Ch." with content unit abbreviation**

The `contentUnitLabel` is already derived in MemoryPanel (capitalized `contentUnitSingular` from mode config). Change:

```typescript
// Before:
`${chapterMentionCount} mentions in Ch. ${currentChapter}`,

// After:
`${chapterMentionCount} mentions in ${contentUnitLabel} ${currentChapter}`,
```

This will render as "3 mentions in Chapter 1" for fiction or "3 mentions in Issue 1" for newsletter.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/components/memory/MemoryPanel.tsx
git commit -m "fix: use mode-aware content unit label in MemoryPanel summary"
```

---

## Task 3: Improve empty states across panels

**Files:**
- Modify: `src/app/components/memory/EntryList.tsx:222-233`
- Modify: `src/app/components/memory/ContextConsole.tsx` (empty state section)
- Modify: `src/app/page.tsx` (homepage library empty state)

- [ ] **Step 1: Read current empty states**

Read EntryList.tsx lines 218-240, ContextConsole.tsx lines 180-195, and page.tsx lines 50-80 to understand current empty state handling.

- [ ] **Step 2: Improve EntryList empty state**

The current "No facts yet. Build from Chapter 1 or add the first fact manually." should be mode-aware:

```typescript
// Before:
"No facts yet. Build from Chapter 1 or add the first fact manually."

// After - use contentUnitLabel from mode config:
// The EntryList component needs a contentUnitLabel prop (or derive from projectMode)
`No facts yet. Start writing your first ${contentUnitLabel.toLowerCase()} and facts will appear here, or add one manually.`
```

If `contentUnitLabel` isn't available in EntryList, thread it from MemoryPanel (which already has it). Add an optional `contentUnitLabel?: string` prop with default `"chapter"`.

- [ ] **Step 3: Verify the ContextConsole empty state is mode-aware**

Check if "No story context is available yet" uses `contentUnitLabel`. If not, update to:
```typescript
`No project context available yet. Write your first ${contentUnitLabel} to see what the system knows.`
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/app/components/memory/EntryList.tsx src/app/components/memory/ContextConsole.tsx src/app/components/memory/MemoryPanel.tsx
git commit -m "feat: improve empty states with mode-aware guidance copy"
```

---

## Task 4: Progressive disclosure audit — AdaptTab

**Files:**
- Modify: `src/app/components/editor/AdaptTab.tsx`

The AdaptTab currently shows all controls by default. Chain configuration and per-output-type settings should be behind an Advanced reveal, consistent with the pattern in MemoryPanel and SidePanel.

- [ ] **Step 1: Read AdaptTab to identify controls to move behind Advanced**

Read `src/app/components/editor/AdaptTab.tsx` fully. Identify:
- Chain selector (AdaptationChainId selection)
- Per-output settings
- Newsletter package management controls
- Delete output buttons

The primary action should be: select output type → generate → review result → insert.
Secondary actions (chain config, package management, delete) should be behind Advanced.

- [ ] **Step 2: Add Advanced toggle state**

Add a `showAdvanced` state to the component:

```typescript
const [showAdvanced, setShowAdvanced] = useState(false);
```

- [ ] **Step 3: Wrap secondary controls with Advanced toggle**

Wrap chain configuration and delete controls with the Advanced reveal pattern used elsewhere:

```tsx
<button
  type="button"
  onClick={() => setShowAdvanced((prev) => !prev)}
  className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
>
  {showAdvanced ? "Hide advanced" : "Advanced"}
  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
</button>

{showAdvanced && (
  <div className="space-y-3">
    {/* Chain selector, delete buttons, package management */}
  </div>
)}
```

Keep visible by default:
- Output type tabs
- Generate button (primary action)
- Current result display
- Insert button

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Verify ESLint passes**

Run: `npm run lint`
Expected: zero errors

- [ ] **Step 6: Commit**

```bash
git add src/app/components/editor/AdaptTab.tsx
git commit -m "feat: move AdaptTab secondary controls behind Advanced toggle"
```

---

## Task 5: Mobile & narrow-width verification pass

**Files:**
- No file changes expected (verification only)
- Potentially modify any component where issues are found

This task is a verification pass, not a blind code change. Use the browser DevTools to check each panel at 375px width.

- [ ] **Step 1: Check MemoryPanel at 375px**

Open the editor with a story. Set viewport to 375px width. Verify:
- EntryList renders without horizontal overflow
- EntryForm fields are full-width
- EntryDetail sections don't overflow
- ProgressionEditor inputs don't overflow
- All buttons have 44px minimum touch targets
- The compact layout (stacked, not split) is active

- [ ] **Step 2: Check SidePanel tabs at 375px**

Verify:
- Tab buttons wrap correctly (flex-wrap is set)
- No tab text is truncated to unreadable length
- Advanced toggle button is accessible
- Mobile back button (ArrowLeft) is visible and has 44px target

- [ ] **Step 3: Check ArtifactsTab at 375px**

Verify:
- Content doesn't overflow
- Buttons and inputs are full-width
- Any grid layouts collapse to single column

- [ ] **Step 4: Check AdaptTab at 375px**

Verify:
- Output type tabs wrap or scroll correctly
- Generate/insert buttons are accessible
- Result display doesn't overflow

- [ ] **Step 5: Fix any issues found**

If any component has overflow, truncation, or touch target issues at 375px, fix them. Common fixes:
- Add `min-w-0` to flex children that overflow
- Add `break-words` to text that overflows
- Ensure `min-h-[44px] min-w-[44px]` on interactive elements
- Use `w-full` on inputs/textareas in narrow contexts

- [ ] **Step 6: Commit fixes if any**

```bash
git add -A
git commit -m "fix: mobile layout issues found in 375px verification pass"
```

If no issues found, skip this step.

---

## Task 6: Final verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: ESLint check**

Run: `npm run lint`
Expected: zero errors

- [ ] **Step 3: Verify no hardcoded "chapter" strings remain in Memory components**

Run: `grep -rn '"chapter"' src/app/components/memory/ --include="*.tsx" | grep -v contentUnitLabel | grep -v "Chapter"` to find any remaining hardcoded lowercase "chapter" strings that should be mode-aware.

Expected: Only default prop values like `contentUnitLabel = "chapter"` should remain.

- [ ] **Step 4: Verify no hardcoded "Chapter" strings remain (excluding defaults)**

Run: `grep -rn '"Chapter"' src/app/components/memory/ --include="*.tsx"` and verify each match is either a default prop value or appropriately using the contentUnitLabel variable.

- [ ] **Step 5: Update CLAUDE.md shipped list**

Add to the shipped list:
```
12. Phase A simplification & polish (progressive disclosure, content unit threading, empty states, mobile verification)
```
