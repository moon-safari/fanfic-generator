# Prompt Context Assembly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize planning-aware prompt context assembly so continuation and adaptation both pull story context and planning context from one shared helper.

**Architecture:** Keep the existing `resolvePromptStoryContext()` and `resolvePlanningPromptContext()` behavior, but add a new orchestration helper in `storyContext.ts` that fetches story metadata once and returns both context blocks together. Migrate the continuation and adaptation loaders to the new helper and add a small `node:test` regression file that proves the helper computes planning-unit defaults and project-mode fallback correctly.

**Tech Stack:** Next.js 16, TypeScript 5, Node 24 built-in test runner (`node --experimental-strip-types --test`)

---

## File Structure

### Modified files

```
src/app/lib/storyContext.ts                    - export shared prompt-context bundle wrapper
src/app/api/continue-chapter/route.ts          - use shared helper instead of route-level planning assembly
src/app/api/adapt/shared.ts                    - use shared helper instead of route-level planning assembly
tsconfig.json                                  - allow `.ts` test imports under no-emit TypeScript checks
```

### New files

```
src/app/lib/promptContextBundle.ts             - testable prompt-context orchestration helper
src/app/lib/promptContextBundle.test.ts        - regression tests for prompt-context bundle orchestration
```

### Verification

```
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/promptContextBundle.test.ts
npx tsc --noEmit
npm run lint
```

---

## Task 1: Add prompt-context bundle helper

**Files:**
- Modify: `src/app/lib/storyContext.ts`

- [ ] **Step 1: Write the failing test for default next-unit planning assembly**

Add a test that calls the new helper with injected dependencies and confirms:
- story context resolves against `resolvedThroughUnitNumber`
- planning context defaults to `resolvedThroughUnitNumber + 1`
- project mode comes from fetched story metadata

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/promptContextBundle.test.ts
```

Expected: FAIL because `promptContextBundle.ts` does not exist yet.

- [ ] **Step 3: Implement the helper in `promptContextBundle.ts` and wrap it from `storyContext.ts`**

Add:
- `PromptContextBundleResult`
- a reusable orchestration helper that accepts injected dependencies
- a private wrapper in `storyContext.ts` that resolves story context from already-fetched story metadata
- `resolvePromptContextBundle(...)` that:
  - fetches story metadata once
  - resolves story context with that metadata
  - resolves planning context with either the explicit planning unit or the default next unit
  - falls back to `"fiction"` when story metadata is missing

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/promptContextBundle.test.ts
```

Expected: PASS

---

## Task 2: Cover explicit planning-unit override and fiction fallback

**Files:**
- Modify: `src/app/lib/promptContextBundle.test.ts`

- [ ] **Step 1: Add the second failing test**

Add a test that confirms:
- an explicit `planningUnitNumber` override is respected
- missing story metadata falls back to `"fiction"` for planning context resolution

- [ ] **Step 2: Run the test to verify it fails for the new case**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/promptContextBundle.test.ts
```

Expected: FAIL on the new assertion until the helper handles the fallback/override correctly.

- [ ] **Step 3: Adjust the helper only if needed**

Keep the implementation minimal. If Task 1 already covers this behavior, no extra production change should be necessary beyond making the new test green.

- [ ] **Step 4: Re-run the test file**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/promptContextBundle.test.ts
```

Expected: PASS

---

## Task 3: Migrate continuation and adaptation to the shared helper

**Files:**
- Modify: `src/app/api/continue-chapter/route.ts`
- Modify: `src/app/api/adapt/shared.ts`

- [ ] **Step 1: Update `continue-chapter` to use the shared helper**

Replace the separate `resolvePromptStoryContext(...)` and `resolvePlanningPromptContext(...)` calls with one `resolvePromptContextBundle(...)` call using:
- `resolvedThroughUnitNumber: chapterNum - 1`
- `planningUnitNumber: chapterNum`

- [ ] **Step 2: Update `adapt/shared` to use the shared helper**

Replace the separate context calls with one `resolvePromptContextBundle(...)` call using:
- `resolvedThroughUnitNumber: chapterNumber`
- `planningUnitNumber: chapterNumber`

- [ ] **Step 3: Run the focused test again**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/promptContextBundle.test.ts
```

Expected: PASS

- [ ] **Step 4: Run full static verification**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero TypeScript errors, zero ESLint errors.
