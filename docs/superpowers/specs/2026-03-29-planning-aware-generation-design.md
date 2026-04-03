# Planning-Aware Generation

> Feed the planning layer into live writing and adaptation without turning the
> system into a rigid outline engine.

## Goal

Use the existing planning layer during:

- continuation generation
- chapter adaptation
- chained adaptation workflows

This should help the model honor:

- target unit intent
- expected reveal or turn
- active arcs
- due or open threads

without forcing the draft into stiff outline-following behavior.

## What Changed

### 1. Continuation now sees planning guidance

`continue-chapter` now resolves a planning prompt block for the *next* unit and
injects it into the continuation prompt alongside story context.

That means the model can see:

- the planned next chapter or issue intent
- expected reveal
- active arcs
- due threads
- other open threads

### 2. Adaptation now sees planning guidance

`adapt/chapter` and `adapt/chain` now receive the planning layer for the
current unit.

This helps adaptation outputs preserve:

- why the unit mattered
- what it was trying to land
- which arcs or threads should stay visible

### 3. Planning stays a soft constraint

The prompt wording is intentional:

- project truth still wins
- source draft still wins for adaptation
- planning is guidance, not rigid law

This is important because discovery writing should still work.

## Why This Matters

Before this change:

- planning helped review after the fact
- continuity could catch drift later

After this change:

- planning can shape the draft before drift happens
- adaptation outputs can better preserve the unit's purpose

This is a much better Writing OS pattern:

- plan
- write
- review
- adapt

all using the same underlying project spine.

## Design Constraints

This slice intentionally does **not**:

- force a full outline before writing
- block continuation when planning is sparse
- rewrite drafts to obey planning mechanically
- create new planning UI

It only makes existing planning data operational during generation.

## Next Logical Steps

1. Feed planning guidance into selected craft tools
- especially brainstorm and rewrite

2. Surface the planning guidance used for generation in the UI
- likely through `Context` or a small generation summary

3. Add newsletter-native planning depth
- so newsletter mode gets project memory and planning guidance that feels native
