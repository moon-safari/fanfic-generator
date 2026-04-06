# Planning Drift Visual Treatment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `planning_drift` annotations visually distinct from ordinary continuity warnings inside the editor manuscript.

**Architecture:** Keep the current continuity backend, prompt, and tooltip behavior unchanged. Only extend the annotation rendering pipeline so the editor decorations can use both `annotationType` and `severity`, with a focused regression test around the resulting class helper.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Node 24 built-in test runner (`node --experimental-strip-types --test`)

---

## File Structure

### Modified files

```
src/app/components/editor/annotationExtension.ts  - thread annotationType into decoration styling and export style helper
src/app/hooks/useChapterAnnotations.ts            - pass annotationType into the editor plugin metadata
```

### New files

```
src/app/components/editor/annotationExtension.test.ts  - regression tests for annotation decoration classes
```

### Verification

```
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/components/editor/annotationExtension.test.ts
npx tsc --noEmit
npm run lint
```

---

## Task 1: Add a decoration-style helper for annotation type

**Files:**
- Modify: `src/app/components/editor/annotationExtension.ts`
- Create: `src/app/components/editor/annotationExtension.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove:

1. `planning_drift` warning styling differs from `continuity_warning` warning styling.
2. `planning_drift` info styling differs from `planning_drift` warning styling.
3. `suggestion` styling stays distinct from both.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/components/editor/annotationExtension.test.ts
```

Expected: FAIL because the exported helper does not exist yet.

- [ ] **Step 3: Implement the style helper**

In `annotationExtension.ts`:

- extend `AnnotationItem` with `annotationType`
- replace the severity-only helper with a new exported function like:

```ts
export function getAnnotationDecorationClass(
  annotationType: string,
  severity: string
): string
```

- keep continuity-warning classes in the current orange/yellow/blue family
- give `planning_drift` a purple-forward class family that still varies by severity
- keep `suggestion` soft and distinct

- [ ] **Step 4: Re-run the test**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/components/editor/annotationExtension.test.ts
```

Expected: PASS

---

## Task 2: Thread annotationType into editor decorations

**Files:**
- Modify: `src/app/components/editor/annotationExtension.ts`
- Modify: `src/app/hooks/useChapterAnnotations.ts`

- [ ] **Step 1: Update the plugin metadata shape**

Ensure `useChapterAnnotations.ts` pushes:

```ts
{ id: a.id, textMatch: a.textMatch, severity: a.severity, annotationType: a.annotationType }
```

into the plugin meta payload.

- [ ] **Step 2: Update decoration creation**

Use `annotationType` when building inline decorations:

```ts
class: getAnnotationDecorationClass(ann.annotationType, ann.severity)
```

- [ ] **Step 3: Re-run the focused test**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/components/editor/annotationExtension.test.ts
```

Expected: PASS

- [ ] **Step 4: Run full verification**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero TypeScript errors and zero ESLint errors.
