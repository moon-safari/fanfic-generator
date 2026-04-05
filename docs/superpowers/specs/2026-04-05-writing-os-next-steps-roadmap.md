# Writing OS — Next Steps Roadmap

**Date:** 2026-04-05
**Status:** Approved
**Depends on:** Memory mode-agnostic engine (completed 2026-04-05), simplification reset (in progress)

---

## Context

The Writing OS has shipped its core foundation: a rich editor with streaming generation, living project memory (now mode-agnostic via ModeConfig registry), craft tools, continuity copilot, adaptation pipeline, artifact library, and newsletter mode v1. The codebase is clean (zero TypeScript errors, zero ESLint warnings) and architecturally ready for expansion.

This roadmap defines what to build next, in what order, and why. Every item passes the project value bar: it either makes writing faster, makes project truth clearer, makes later outputs better via reused state, removes a context switch, or completes a core workflow end-to-end.

---

## Phasing

```
Phase A: Simplification & Polish        ← immediate priority
Phase B: Planning-Aware Generation       ← depth (makes the engine smarter)
Phase C: Mode Pack Expansion             ← breadth (proves the engine generalizes)
Phase D: Adaptation Studio & Publishing  ← platform (one project, many outputs)
```

Phases are sequential in priority but can overlap. Phase A should be substantially complete before heavy Phase C work begins. Phase B work can start alongside Phase A.

---

## Phase A: Simplification & Polish

**Goal:** Make the default experience feel obvious and confident. Reduce visible surfaces. Plain language everywhere.

### A1. Progressive disclosure audit

The default visible workflow is: Write → Remember → Review → Package → Export. Everything else is support structure.

**What to do:**
- Audit every panel and tab for controls that should be behind "Advanced" toggles
- Memory panel: custom types, relationship editing, progression editing, context rules, mention mechanics are already partially behind Advanced — verify consistency
- Project (Artifacts) tab: move low-frequency controls behind Advanced
- Outputs (Adapt) tab: chain configuration and per-output-type settings behind Advanced
- One primary action per view; secondary actions behind reveals
- Verify each panel has a clear "what do I do here?" default state

**Value:** Removes confusion, completes the simplification reset started in earlier work.

### A2. Microcopy & naming cleanup

**What to do:**
- Rename UI-facing labels: "Artifacts" tab → "Project", "Adapt" tab → "Outputs" (CLAUDE.md already describes this intent, SidePanel.tsx TABS array already uses "Project" and "Outputs" labels)
- Audit all user-facing strings for fiction-specific language in shared surfaces — replace with mode-neutral equivalents
- Thread `contentUnitLabel` to `formatPriorityLabel()` and `describeNextChapterBehavior()` helper functions in `ContextConsole.tsx` (known follow-up from mode-agnostic work)
- Consistent action vocabulary: "Save", "Generate", "Insert", "Delete" across all panels

**Value:** Makes project truth clearer, removes confusion.

### A3. Empty states & first-run experience

**What to do:**
- Design meaningful empty states for Memory, Project, and Outputs tabs that explain what each does and how to get started
- First chapter creation should feel guided: show what the system can do (memory extraction, continuity, craft tools) without overwhelming
- New project wizard should set mode-appropriate defaults (fiction gets character/location types, newsletter gets topic/source types — this is now automatic via ModeConfig)
- Consider a "quick tour" overlay for first-time users on the editor page

**Value:** Completes a core workflow end-to-end (first-run to first draft).

### A4. Mobile & narrow-width pass

**What to do:**
- Verify all Memory components (EntryList, EntryForm, EntryDetail, ProgressionEditor, ContextConsole) work at 375px
- Side panel tab overflow: ensure tabs don't break layout on small screens (current flex-wrap should handle, but verify)
- Touch target audit: all interactive elements must be 44px minimum
- Bottom sheet behavior on mobile: verify side panel opens as full-screen overlay correctly

**Value:** Completes a core workflow (mobile writing) end-to-end.

---

## Phase B: Planning-Aware Generation

**Goal:** Make the planning layer actively drive generation and continuity. This is where the product becomes materially better than "AI + prompt box."

**Depends on:** Existing planning layer (outlines, arc/thread tracking) already shipped.

### B1. Planning context in continuation

When generating or continuing a chapter, the system should inject relevant planning context into the generation prompt.

**What to do:**
- Read the outline/beat for the current chapter (if it exists) and include it in the continuation prompt
- Include active arc guidance and thread notes that apply to this chapter
- Add a `buildPlanningContext()` function to ModeConfig (or as a shared utility) that assembles planning signals for a given content unit
- Wire into `src/app/lib/storyContext.ts` so the generation prompt sees planning alongside memory

**Architecture:**
```
Outline beats + Arc guidance + Thread notes
        ↓
  buildPlanningContext(chapterNumber)
        ↓
  storyContext.ts assembles full prompt
        ↓
  Generation sees: memory + planning + manuscript history
```

**Value:** Makes writing materially faster — "what should happen next" comes from the plan, not just from what's been written.

### B2. Planning context in continuity review

**What to do:**
- Extend the continuity copilot to check drift against the plan, not just against prior chapters
- "You planned X but wrote Y" is a more actionable signal than "this contradicts chapter 3"
- Add plan-drift as a distinct annotation type alongside fact-contradiction and stale-reference
- Surface plan-drift annotations with a distinct visual treatment (e.g., different color than continuity annotations)

**Value:** Makes project truth clearer and safer.

### B3. Planning-to-memory bridge

**What to do:**
- When a planned beat is written, auto-suggest memory updates: new characters introduced, relationships changed, facts established
- Planning becomes the upstream driver; memory becomes the downstream record
- Extend the suggestion generation route to cross-reference planning data when building suggestions
- Consider a "beat completed" action that triggers memory suggestions for that beat

**Value:** Makes later outputs better because saved state is reused — plan → draft → memory → future drafts.

### B4. Mode-aware planning schemas

**What to do:**
- Extend `ModeConfig` with optional planning-related fields:
  - `planningUnitLabel` — "beat" / "topic slot" / "scene" / "quest step"
  - `planningSchema` — what fields a planning unit has per mode
  - `buildPlanningPrompt()` — mode-specific prompt for generating/suggesting plan updates
- Fiction: chapter outline with beats, arc tracker, thread tracker (already exists — formalize in config)
- Newsletter: issue calendar, topic pipeline, audience segment focus
- Future modes get their own planning shape automatically

**Value:** Proves the mode-agnostic engine generalizes to planning, not just memory.

---

## Phase C: Mode Pack Expansion

**Goal:** Prove the engine works across writing types. Each mode defines: knowledge schema, planning schema, output schema, review schema, creator workflow.

**Depends on:** ModeConfig registry (done), Phase A simplification (should be substantially complete).

**Adding a new mode is now straightforward:**
1. Create `src/app/lib/modes/<mode>.ts` implementing `ModeConfig`
2. Add to `MODE_REGISTRY` in `registry.ts`
3. Add to `ProjectMode` union in `src/app/types/story.ts`
4. Define mode-specific prompt builders, entry types, content units
5. Everything else (routes, prompts, UI) picks it up automatically

**Priority order:** Screenplay → Comics → Game Writing → Non-fiction

### C1. Screenplay mode

- **Content unit:** scene
- **Core types:** character, location, action, dialogue_style, theme
- **Planning:** beat sheet, act structure (3-act or 5-act), scene breakdown
- **Outputs:** formatted screenplay pages, scene cards, character breakdowns
- **Special considerations:** dual-dialogue support, slug line conventions (INT./EXT.), CAPS for character introductions
- **Review:** scene-level continuity (who's in the room, time of day, props)

### C2. Comics / graphic narrative mode

- **Content unit:** page (or panel sequence)
- **Core types:** character, location, visual_motif, panel_layout, narrative_device
- **Planning:** page layout planning, visual pacing, spread design
- **Outputs:** script format (panel descriptions with action/dialogue), character design briefs
- **Special considerations:** panel count per page, visual storytelling conventions, lettering notes

### C3. Game writing / narrative design mode

- **Content unit:** quest (or dialogue tree / narrative beat)
- **Core types:** character, location, quest, item, faction, lore, dialogue_branch
- **Planning:** quest dependency graph, branching narrative map, variable tracking
- **Outputs:** quest design docs, dialogue scripts (with branching), lore codex entries, item descriptions
- **Special considerations:** branching logic, state variables, player choice tracking

### C4. Non-fiction / articles / essays mode

- **Content unit:** section
- **Core types:** source, argument, evidence, counterpoint, topic
- **Planning:** thesis outline, argument structure, evidence mapping
- **Outputs:** article draft, bibliography/references, executive summary
- **Special considerations:** citation management, fact-checking workflow, source credibility tracking

---

## Phase D: Adaptation Studio & Publishing

**Goal:** "One project, many outputs" becomes the primary value proposition.

**Depends on:** At least 2 modes working well (fiction + one other).

### D1. Cross-mode adaptation chains

Extend the existing adaptation pipeline to support richer chains:
- Chapter → screenplay scene → comic page script
- Newsletter issue → social thread → podcast outline
- Story world → game design dossier → wiki pages
- Character memory entry → character sheet → casting brief

The adaptation engine should use memory and planning context to produce higher-quality outputs — not just summarize text, but understand the project truth behind it.

### D2. Export & distribution

Multi-format export from the same project truth:
- PDF, DOCX, EPUB for prose
- Fountain format for screenplay
- Panel script format for comics
- Markdown/HTML for newsletters and articles
- Publishing pipeline: draft → review → finalize → export
- Shareable public project pages (read-only, optional)

### D3. Collaborative review (future)

- Shared project access with roles (author, editor, beta reader)
- Comment and feedback workflows on drafts and adaptations
- Review-gate before adaptation outputs go final
- This is the furthest-out item — only pursue after the solo creator workflow is excellent

---

## Value Matrix

Every item maps to at least one value criterion:

| Item | Faster writing | Clearer truth | Better reuse | Less confusion | Complete workflow |
|------|:-:|:-:|:-:|:-:|:-:|
| A1. Progressive disclosure | | | | x | |
| A2. Microcopy cleanup | | x | | x | |
| A3. Empty states | | | | x | x |
| A4. Mobile pass | | | | | x |
| B1. Planning in continuation | x | | | | |
| B2. Planning in continuity | | x | | | |
| B3. Planning-to-memory bridge | | | x | | |
| B4. Mode-aware planning | | | x | | x |
| C1-C4. Mode packs | x | | | | x |
| D1. Adaptation chains | | | x | | |
| D2. Export & distribution | | | | | x |
| D3. Collaborative review | | | | x | x |

---

## Anti-goals

Things this roadmap explicitly does NOT include:

- **Real-time collaboration** — solo creator workflow must be excellent first
- **Model fine-tuning** — better base models will improve the product; invest in structured context instead
- **Social features** — no feeds, likes, follows; this is a workspace, not a social network
- **Plugin/extension system** — premature; the mode pack system is the right abstraction for now
- **Monetization/billing** — important eventually, but not a product priority right now

---

## How to use this roadmap

This document is the strategic guide. For each phase/item that gets picked up:

1. Write a design spec at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
2. Write an implementation plan at `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`
3. Execute the plan (subagent-driven or sequential)
4. Update `CLAUDE.md` shipped list when complete
5. Write a handoff doc at `docs/superpowers/handoffs/` if handing off to another agent

The recommended first pickup is **Phase A1 + A2** (progressive disclosure audit + microcopy cleanup) — these are the highest-impact simplification items and they set the stage for everything else.
