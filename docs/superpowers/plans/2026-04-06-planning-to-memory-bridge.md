# Planning-to-Memory Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make memory suggestion generation aware of the current unit's planning context so suggestions are informed by intent, arcs, and threads without inventing memory changes that never landed in the draft.

**Architecture:** Keep the change prompt-only. Extend `ModeConfig.buildSuggestionPrompt(...)` with an optional planning-context argument, add regression tests around the fiction and newsletter prompt builders, and wire the current-unit planning context into the existing memory suggestion generation route.

**Tech Stack:** Next.js 16, TypeScript 5, Node 24 built-in test runner (`node --experimental-strip-types --test`)

---

## File Structure

### Modified files

```
src/app/lib/modes/types.ts                     - extend the suggestion prompt builder signature
src/app/lib/modes/fiction.ts                   - include planning-aware suggestion guidance for fiction
src/app/lib/modes/newsletter.ts                - include planning-aware suggestion guidance for newsletter
src/app/api/memory/suggestions/generate/route.ts - resolve planning context and pass it into the prompt builder
```

### New files

```
src/app/lib/modes/suggestionPrompt.test.ts     - regression tests for planning-aware suggestion prompts
docs/superpowers/plans/2026-04-06-planning-to-memory-bridge.md - execution plan
```

### Verification

```
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/modes/suggestionPrompt.test.ts
npx tsc --noEmit
npm run lint
```

---

## Task 1: Add prompt-builder regression coverage

**Files:**
- Create: `src/app/lib/modes/suggestionPrompt.test.ts`
- Modify: `src/app/lib/modes/fiction.ts`
- Modify: `src/app/lib/modes/newsletter.ts`

- [ ] **Step 1: Write the failing tests**

Add tests that prove:

1. the fiction suggestion prompt includes planning context when passed
2. the newsletter suggestion prompt includes planning context when passed
3. both prompts include guardrail language that only draft-established changes should become memory suggestions

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/modes/suggestionPrompt.test.ts
```

Expected: FAIL because the prompt builders either do not expose the necessary behavior yet or do not accept planning context.

- [ ] **Step 3: Export or otherwise expose the prompt builders minimally**

Make the fiction and newsletter suggestion prompt builders callable from the test file without changing unrelated behavior.

- [ ] **Step 4: Re-run the test**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/modes/suggestionPrompt.test.ts
```

Expected: still FAIL until planning-aware prompt content is added.

---

## Task 2: Make suggestion prompts planning-aware

**Files:**
- Modify: `src/app/lib/modes/types.ts`
- Modify: `src/app/lib/modes/fiction.ts`
- Modify: `src/app/lib/modes/newsletter.ts`

- [ ] **Step 1: Extend the mode config type**

Update `buildSuggestionPrompt(...)` to accept:

```ts
planningContext?: string
```

as a fourth, optional argument.

- [ ] **Step 2: Update the fiction suggestion prompt**

When planning context exists:

- include the planning block in the prompt
- instruct the model to use planning as guidance for what the chapter was trying to establish or advance
- explicitly forbid suggestions for facts or changes that were only planned but did not actually appear in the chapter text

- [ ] **Step 3: Update the newsletter suggestion prompt**

Apply the same structure in newsletter language:

- planning is guidance
- suggestions must come from what the issue actually established
- planned but unlanded material must not become memory updates

- [ ] **Step 4: Re-run the focused prompt tests**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/modes/suggestionPrompt.test.ts
```

Expected: PASS

---

## Task 3: Wire planning context into suggestion generation

**Files:**
- Modify: `src/app/api/memory/suggestions/generate/route.ts`

- [ ] **Step 1: Resolve planning context for the current unit**

Load planning context using:

```ts
resolvePlanningPromptContext(auth.supabase, storyId, chapter.chapter_number as number, projectMode)
```

- [ ] **Step 2: Pass planning context into the mode prompt builder**

Update the route call to:

```ts
config.buildSuggestionPrompt(
  chapter.content as string,
  memory.entries.map(...),
  chapter.chapter_number as number,
  planningContext
)
```

- [ ] **Step 3: Re-run the focused tests**

Run:

```bash
node --experimental-strip-types --test --test-concurrency=1 --test-isolation=none src/app/lib/modes/suggestionPrompt.test.ts
```

Expected: PASS

- [ ] **Step 4: Run full verification**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero TypeScript errors and zero ESLint errors.
