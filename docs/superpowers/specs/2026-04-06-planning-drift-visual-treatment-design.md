# Planning Drift Visual Treatment

**Date:** 2026-04-06
**Status:** Proposed
**Scope:** Phase B2 finish pass

---

## Goal

Make `planning_drift` annotations visually distinct from ordinary continuity warnings inside the editor, not just inside the tooltip.

This completes the roadmap promise that plan drift should read as a different kind of review signal from fact contradiction.

---

## Current State

The continuity system already supports planning-aware review:

- `buildContinuityCheckPrompt()` emits `planning_drift` as a first-class annotation type.
- `api/continuity/check` persists `planning_drift` annotations.
- `AnnotationTooltip` already labels plan drift separately and explains planning metadata.
- Annotation actions already route the writer into the relevant planning surface.

The remaining gap is the editor decoration path:

- `annotationExtension.ts` only receives `severity`
- underline/background styling is keyed only off `severity`
- a `planning_drift` warning looks the same as a `continuity_warning` warning in the manuscript itself

So the distinction exists in data and tooltip copy, but not in the primary reading surface.

---

## Chosen Approach

Thread `annotationType` through the editor annotation decoration pipeline and style `planning_drift` differently from ordinary continuity annotations while preserving severity cues.

This means:

- `continuity_warning`
  - keeps the current severity-based yellow/orange/blue treatment
- `planning_drift`
  - gets a distinct purple-forward treatment in the manuscript
  - still reflects severity through intensity, not through the same color family as continuity
- `suggestion`
  - remains visually separate from both

This is intentionally a UI-only completion pass. The continuity prompt, persistence model, tooltip content, and action behavior stay unchanged.

---

## Behavior

### Editor decorations

The Tiptap annotation plugin should receive:

- `id`
- `textMatch`
- `severity`
- `annotationType`

Decoration classes should be derived from both `annotationType` and `severity`.

Recommended styling direction:

- `continuity_warning`
  - keep existing orange/yellow/blue family by severity
- `planning_drift`
  - use purple/magenta family with severity-based emphasis
  - warning and error remain visually stronger than info
- `suggestion`
  - retain a softer cyan treatment

The key requirement is legibility and differentiation, not introducing a new badge system in-line.

### Notification behavior

The post-review notification path should preserve the first returned annotation as-is so any plan-drift-first review result can carry its distinct styling into the initial focus/open flow.

No new notification UI is required unless the existing path is currently dropping `annotationType`.

---

## Files

### Modify

- `src/app/components/editor/annotationExtension.ts`
  - include `annotationType` in `AnnotationItem`
  - derive decoration classes from both `annotationType` and `severity`

- `src/app/hooks/useChapterAnnotations.ts`
  - pass `annotationType` into the editor plugin metadata

### Optional touch if needed

- `src/app/components/editor/AnnotationTooltip.tsx`
  - only if a shared style helper is worth extracting

No API or database changes are needed.

---

## Testing

Add a focused regression test around the decoration-class helper so we can prove:

1. `planning_drift` and `continuity_warning` do not share the same class output for the same severity.
2. `planning_drift` warning/error styles are distinct from `planning_drift` info.
3. Existing continuity-warning severity styling still behaves as expected.

Then run:

- `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none <test-file>`
- `npx tsc --noEmit`
- `npm run lint`

---

## Non-goals

This pass does not:

- change continuity prompt behavior
- add new planning-drift reason types
- add a new review summary panel
- refactor the continuity route
- change tooltip action behavior

---

## Why this slice

This is the smallest B2 completion step that delivers clear user-visible value:

- the writer can distinguish truth drift from plan drift without opening every tooltip
- the review system feels more intentional
- the implementation stays low-risk because it only touches the annotation rendering path
