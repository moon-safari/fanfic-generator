# Newsletter-Native Memory And Review Design

> Give newsletter mode its own operating-memory and review language instead of relying on fiction-shaped fallback behavior.

## Goal

Make newsletter mode feel like a real Writing OS mode, not just "issues instead of chapters."

This slice focuses on three things:

1. shared newsletter memory for prompts
2. newsletter-specific drift language in continuity
3. a visible memory surface inside `Artifacts`

## What Shipped

### 1. Shared newsletter memory builder

Added:

- `src/app/lib/newsletterMemory.ts`

This builds one newsletter-native memory snapshot from:

- newsletter title
- topic
- audience
- cadence
- current issue angle
- synopsis / promise
- style guide
- outline
- planning notes
- arcs
- due follow-ups

The same snapshot now powers:

- continuation context
- adaptation context
- visible workspace memory in `Artifacts`

This keeps newsletter memory from splintering into separate prompt-only and UI-only summaries.

### 2. Newsletter memory is now the prompt context

Updated:

- `src/app/lib/storyContext.ts`

Newsletter projects now skip the fiction Codex path and resolve a dedicated newsletter-memory block instead of falling back to the generic Story Bible formatter.

That memory now emphasizes:

- series promise
- audience
- current angle
- voice guardrails
- active throughlines
- due follow-ups

## 3. Newsletter-specific review language

Updated:

- `src/app/lib/prompts/continuity.ts`
- `src/app/api/continuity/check/route.ts`
- `src/app/lib/annotationMetadata.ts`
- `src/app/types/bible.ts`
- `src/app/components/editor/AnnotationTooltip.tsx`

Newsletter continuity now understands drift like:

- `promise_drift`
- `voice_drift`
- existing issue-intent drift
- due follow-up drift

Planning-drift annotations can now target:

- `synopsis`
- `style_guide`
- `outline`
- `notes`

So the system can say:

- this issue drifted from the stored series promise
- this issue broke the stored voice/style guide
- this issue missed its planned angle
- this follow-up was due and still did not advance

without pretending everything is a character/world contradiction.

### 4. Visible newsletter memory in Artifacts

Updated:

- `src/app/components/editor/ArtifactsTab.tsx`
- `src/app/components/editor/SidePanel.tsx`
- `src/app/components/editor/StoryEditor.tsx`

Newsletter projects now show a compact `Newsletter memory` panel inside `Artifacts`.

It surfaces:

- audience
- current angle
- series promise
- voice guardrails
- current issue plan
- due follow-ups

This makes the memory layer inspectable instead of hidden inside prompts.

## Why This Matters

Newsletter mode now has the beginnings of its own OS shape:

- stored series memory
- inspectable memory
- mode-native review logic

This is still not a full newsletter-native Codex equivalent.

What it does do is remove the biggest fiction-shaped gap:

- newsletter projects now have a real memory-and-review loop that matches the mode better.

## Deliberate Boundaries

Still not in this slice:

- newsletter entity graph / Codex equivalent
- newsletter-specific change suggestions
- newsletter-specific context steering controls
- hook / CTA / subject-line review passes
- recurring segment schema

Those can layer on later once the shared memory model proves useful.

## Next Logical Step

The next strongest step after this slice is:

- newsletter-specific review passes on top of the new memory model

Examples:

- hook quality
- promise/payoff check
- CTA consistency
- recurring segment continuity
