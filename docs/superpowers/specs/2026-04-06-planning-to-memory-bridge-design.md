# Planning-to-Memory Bridge

**Date:** 2026-04-06
**Status:** Proposed
**Scope:** Phase B3, prompt-only first pass

---

## Goal

Make memory suggestion generation aware of the planning layer for the current unit so the system can better identify:

- facts that were newly established
- relationships or state shifts that were intentionally advanced
- tracked threads or planned reveals that appear to have actually landed in the draft

This turns planning into upstream guidance for memory review without forcing memory updates from the plan alone.

---

## Current State

The existing memory suggestion route is still draft-plus-memory only:

- `src/app/api/memory/suggestions/generate/route.ts`
  - loads the chapter
  - loads current memory entries
  - calls `config.buildSuggestionPrompt(chapter.content, existingEntries, chapterNumber)`

That means the suggestion prompt can see:

- the current unit text
- current memory entries

but it cannot see:

- the outline intent for the current unit
- expected reveal or turn
- active arcs
- due or open tracked threads

So the system can propose updates from the draft, but it cannot distinguish well between:

- something that was planned and now actually happened
- something that was planned but did not land
- something that is newly established outside the plan

---

## Chosen Approach

Add planning context to the suggestion-generation prompt path only.

This pass will:

1. Load planning context for the current unit inside the suggestion route.
2. Extend `ModeConfig.buildSuggestionPrompt(...)` so prompt builders can receive that planning context.
3. Update the fiction and newsletter suggestion prompts to use planning as soft guidance.

This pass will **not**:

- change suggestion persistence schema
- add new suggestion types
- add a new UI action such as `beat completed`
- auto-accept or auto-apply suggestions

---

## Design Principle

Planning should sharpen memory review, not create fictional memory changes by implication.

The prompt must explicitly instruct the model:

- use planning to understand what the unit was trying to do
- use planning to notice when a tracked arc, reveal, or thread appears to have genuinely landed
- only suggest memory updates for changes that are actually present in the current draft text
- do not create suggestions solely because something was planned

That guardrail is the core quality constraint for this slice.

---

## Behavior

### Route behavior

`src/app/api/memory/suggestions/generate/route.ts` should:

1. authenticate the story as it already does
2. load the chapter as it already does
3. resolve planning context for `chapter.chapter_number`
4. pass that planning context into the mode config suggestion prompt builder

This should work for both:

- fiction
- newsletter

because both currently support suggestions.

### Mode config API

Update the suggestion prompt signature from:

```ts
buildSuggestionPrompt(
  content,
  existingEntries,
  contentUnitNumber
)
```

to:

```ts
buildSuggestionPrompt(
  content,
  existingEntries,
  contentUnitNumber,
  planningContext?
)
```

The new parameter should be optional so existing callers and future modes do not break.

### Prompt behavior

The fiction and newsletter suggestion prompts should include the planning block when present and add guidance similar to:

- use planning as context for what this unit was meant to establish or advance
- suggest memory changes only for facts, relationships, aliases, or state shifts that clearly appear in the draft
- if a planned reveal or thread did not actually land in the text, do not suggest it as a memory update

This is a prompt-shaping change, not a rules engine.

---

## Files

### Modify

- `src/app/lib/modes/types.ts`
  - extend `buildSuggestionPrompt(...)` signature with optional `planningContext?: string`

- `src/app/lib/modes/fiction.ts`
  - include planning context in the fiction suggestion prompt
  - add the “planned does not equal established” guardrail

- `src/app/lib/modes/newsletter.ts`
  - include planning context in the newsletter suggestion prompt
  - add the same guardrail in newsletter language

- `src/app/api/memory/suggestions/generate/route.ts`
  - resolve planning context for the current unit
  - pass it into `buildSuggestionPrompt(...)`

### Optional pure helper if useful

- `src/app/lib/memorySuggestionPrompt.ts`
  - only if extracting a small pure helper makes testing cleaner

No database changes are needed.

---

## Testing

Add focused tests around the prompt builders so we can prove:

1. fiction suggestion prompts include planning context when provided
2. newsletter suggestion prompts include planning context when provided
3. the guardrail language about “only suggest what actually landed in the draft” remains present

Then run:

- `node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none <test-file>`
- `npx tsc --noEmit`
- `npm run lint`

The route wiring itself can then rely on TypeScript coverage plus the prompt-builder regression tests.

---

## Non-goals

This pass does not:

- introduce a new suggestion status or metadata field for “planned”
- mark beats as completed
- mutate planning state from the memory panel
- infer planning completion without evidence in the draft
- formalize planning schema in `ModeConfig` beyond the optional prompt parameter

---

## Why this slice

This is the smallest B3 step that materially improves suggestion quality:

- planning can inform memory review immediately
- the route and prompt surface stay simple
- we avoid premature UI and schema work
- we create a clean foundation for a later explicit `beat completed` trigger if it proves valuable
