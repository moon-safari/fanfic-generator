# Structured Planning Layer V1

> First step from freeform planning docs toward a real planning system inside the Writing OS.

## Goal

Make planning feel operational, not decorative.

The first structured slice should:

- stay inside `Artifacts`
- reuse existing story-bible-backed planning storage
- work for both fiction and newsletter projects
- avoid schema churn unless we truly need it

## What Changed

### 1. Newsletter voice options are now mode-appropriate

Newsletter creation no longer reuses fanfic-specific tone options.

Instead it now uses voice-oriented options like:

- analytical
- conversational
- opinionated
- reflective
- tactical
- essayistic

This keeps the mode pack from feeling fiction-shaped at the point of project creation.

### 2. Outline planning is now structured

Each outline unit can now store more than title and summary.

Structured fields:

- `title`
- `summary`
- `intent`
- `keyReveal`
- `openLoops`
- `status`

This works for both:

- chapter-based fiction
- issue-based newsletters

### 3. Planning notes now carry arcs and thread tracking

The planning layer no longer stops at freeform notes.

`notes` now supports:

- `text`
- `arcs`
- `threads`

Arc fields:

- `title`
- `intent`
- `status`
- `horizon`
- `notes`

Thread fields:

- `title`
- `owner`
- `introducedIn`
- `targetUnit`
- `status`
- `notes`

This keeps the planning system inside the existing secure `story_bibles` model
while making it meaningfully more operational for long-form work.

## Why This Matters

The old outline model was mostly a flat list.

The new model starts to support actual planning questions:

- what is this unit trying to do?
- what turn or reveal should land here?
- what threads stay open afterward?
- what larger arcs are still in motion?
- which promises still need payoff, and when?

That makes the planning layer more useful to:

- drafting
- adaptation
- continuity
- future review passes

## Design Choice

This slice intentionally stays inside existing `story_bibles` JSON sections.

Why:

- no new migration needed
- no new ownership surface needed
- existing RLS and save routes already apply
- easier for Claude and future agents to extend safely

## Current Boundary

This is still not the final planning system.

Not shipped yet:

- timeline views
- scene-beat boards
- issue/chapter dependency graph
- planned reveal dashboard

## Next Logical Planning Steps

1. Add `unit intent` visibility to generation/adaptation
- surface intent from the latest outline item in prompts

2. Add planning-aware continuity
- compare what happened vs what was planned

3. Split planning into richer first-class objects only if we truly need it
- dedicated arc docs
- dedicated thread dashboards
- timeline views

## Product Meaning

This slice moves the product from:

- "editable notes"

to:

- "lightly structured planning memory"

It is a small but important step toward the Writing OS vision.
