# Game Writing Mode

**Date:** 2026-04-06
**Status:** Proposed
**Scope:** Phase C3 foundation pass

---

## Goal

Add **Game Writing / narrative design** as a real project mode, not just a future adaptation target.

This pass should let a writer:

- create a game-writing project
- draft quest-based narrative work in the main editor
- use game-writing-native memory and planning semantics
- generate a production-facing quest handoff output
- export quest work in a usable structured text format

The product goal is to prove that the shared Writing OS engine can support a more systems-aware narrative mode, not only prose, newsletters, screenplays, and comics.

---

## Current State

The product currently supports four real modes:

- `fiction`
- `newsletter`
- `screenplay`
- `comics`

The shared architecture is now ready for another mode pack:

- `ModeConfig` owns memory and planning semantics
- shared prompt-context assembly is mode-aware
- planning phrasing is mode-aware
- outputs are filtered by `supportedModes`
- export behavior can branch by mode and durable `modeConfig`

But game writing does not exist yet as a first-class project workflow.

The roadmap already defines its intended shape:

- content unit: `quest`
- core types: `character`, `location`, `quest`, `item`, `faction`, `lore`, `dialogue_branch`
- planning: quest dependency and branch-aware narrative planning
- outputs: quest handoff docs, dialogue extraction, lore support docs
- special considerations: player choice pressure, progression structure, unresolved consequences

So the architecture is ready, but the mode pack itself has not been built.

One implementation constraint should stay explicit:

- `stories.project_mode` is enforced by a Supabase check constraint
- `adaptation_outputs.output_type` is enforced by a Supabase check constraint

So C3 must update the migration source of truth along with the application code.

---

## Chosen Approach

Add **one `game_writing` mode** focused on a **hybrid quest brief with embedded dialogue choices**.

The canonical editor draft should use:

- `hybrid_quest_brief`

meaning each content unit is a quest-oriented narrative design brief that contains player-facing structure, NPC beats, and embedded dialogue choices in prose.

The first supporting output should be:

- `quest_handoff_sheet`

which turns the canonical quest draft into a cleaner, production-facing handoff for writers and narrative designers.

### Why this approach

This is the right first slice because:

- it fits the current project-mode architecture cleanly
- it gives game writing a distinct identity instead of feeling like fiction with renamed chapters
- it supports a more systems-aware writing workflow without requiring executable scripting infrastructure
- it keeps v1 centered on a real collaborator outcome: a quest handoff document

### Explicit scope rule

This first pass is **systems-aware, but not systems-executable**.

V1 should describe:

- player options
- intended outcomes
- blockers
- rewards
- follow-up hooks

in human-readable form.

V1 should **not** attempt to model:

- flags
- conditional scripting
- variable tables
- node graph editing
- implementation-ready branching logic

Those remain explicit follow-up work after the mode proves its core workflow.

---

## Product Shape

### Content unit

For game-writing mode, the content unit is:

- `quest`

Shared surfaces should naturally read as:

- Quest 1
- Continue Quest
- current quest
- quest summary

This keeps game writing aligned with the current shared editor shell.

### Canonical editor text

The main editor remains the canonical project draft surface.

For game-writing mode, the canonical draft should be a **hybrid quest brief with embedded dialogue choices**, not prose chapters and not a fully scripted conversation tree.

Each quest draft should preserve:

- quest premise
- player objective
- quest stages or beats
- key NPC interactions
- player choices in dialogue or encounter moments
- intended outcomes and follow-up hooks
- rewards or progression consequences in prose

The goal is not to create a quest editor with rigid fields.
The goal is to make the editor hold usable quest-design text that is readable, continuity-safe, and easy to adapt into downstream production artifacts.

### Suggested quest-brief convention

Prompts and exports should reinforce a stable plain-text structure such as:

- `QUEST 1`
- `Premise:`
- `Player Goal:`
- `Key Stages:`
- `Dialogue Choices:`
- `Outcomes / Follow-up Hooks:`

This structure should stay flexible and writer-friendly, not locked to a proprietary authoring format.

---

## Game Writing Mode Config

Add a narrow first-pass `GameWritingModeConfig`.

Recommended fields:

- `draftingPreference: "hybrid_quest_brief"`
- `formatStyle: "quest_brief"`
- `questEngine?: "main_quest" | "side_quest" | "questline"`

### Design principle

Store only durable setup that materially changes generation, planning, or export behavior.

Do not turn game-writing setup into a large RPG systems questionnaire in v1.

### Why `questEngine`

This gives the planner and generator a useful scope signal:

- `main_quest`: higher stakes, more durable consequences, stronger payoff pressure
- `side_quest`: tighter scope, cleaner optionality, more contained consequence chains
- `questline`: mid-length arc pressure with recurring follow-up and faction continuity

That is enough value for v1 without introducing full quest taxonomies, variable presets, or implementation schema metadata.

---

## Game Writing Memory Semantics

Game-writing mode should use the shared Memory engine with game-writing-native defaults.

Recommended core types:

- `character`
- `location`
- `quest`
- `item`
- `faction`
- `lore`
- `dialogue_branch`

### How this differs from fiction

Fiction memory is centered on story-world truth:

- what exists
- what happened
- what matters in the narrative

Game-writing memory should stay compatible with that foundation, but become more systems-aware by centering:

- what the player is trying to do
- what structures progression
- where choice pressure appears
- what follow-up consequences a quest introduces

### Interpretation

- `character`: quest givers, companions, antagonists, and recurring NPCs
- `location`: hubs, encounter spaces, traversal spaces, and quest-relevant settings
- `quest`: objectives, stages, blockers, outcomes, follow-up hooks, and reward framing
- `item`: rewards, gating objects, collectibles, evidence, or quest-critical tools
- `faction`: groups whose alignment, conflict, or leverage affects quest flow
- `lore`: setting truth, history, rules, and world-state context relevant to quest design
- `dialogue_branch`: recurring or important player choice moments with intended conversational outcomes

### Systems-aware field expectations

The mode should remain flexible, but field suggestions should bias each type toward game-writing concerns:

- `quest`: giver, player_goal, stages, blockers, rewards, follow_up
- `item`: function, acquisition_path, gating_role, reward_role
- `dialogue_branch`: player_option, npc_response, intended_outcome, quest_impact
- `location`: encounter_role, traversal_pressure, quest_relevance
- `faction`: alignment, leverage, conflict_role, quest_ties

This keeps the mode more systems-aware than fiction without forcing rigid executable schemas.

### Suggestion rule

Memory suggestions should continue to treat planning as context, not truth.

If a quest was planned to introduce a faction split or a major branch consequence but the draft did not actually establish it, the system should not suggest it as canonical memory yet.

---

## Game Writing Planning Semantics

Game-writing mode should use the existing shared planning surfaces:

- `outline`
- `notes`

with game-writing-specific interpretation supplied by the mode pack.

### Outline meaning

`outline` represents a **quest-by-quest plan and status map**.

Each stored unit still uses the shared outline structure, but game-writing mode interprets it as:

- quest title or identifier
- quest summary
- player-facing objective
- branch pressure or key choice point
- intended payoff or follow-up dependency

### Notes meaning

`notes` represents **design notes** for quest pressure and consequences, such as:

- active dependencies between quests
- unresolved outcomes that later quests should honor
- faction or NPC pressure that should shape choices
- reward and escalation notes
- blockers that should appear in future quest drafts

### Planning phrasing

The planning unit label should be:

- `quest beat`

Mode phrasing should read naturally in shared planning prompts, for example:

- target quest plan
- active quest pressure
- unresolved dependencies
- outcomes due by Quest N

### Important v1 rule

Planning remains **human-readable design guidance**, not executable branching logic.

The system should support prose descriptions like:

- "If the player sides with the guild here, the magistrate should become hostile later."

It should not attempt to convert that into variables, conditions, or implementation-ready state tracking yet.

---

## Generation Behavior

### First unit generation

In game-writing mode:

- "Chapter 1" becomes `Quest 1`

Generation prompts should produce a hybrid quest brief that includes:

- quest premise
- player objective
- key stages
- key NPC or faction beats
- embedded dialogue choices
- outcomes, rewards, and follow-up hooks in prose

### Continuation behavior

Continuation prompts should:

- continue from the prior quest's pressure
- preserve quest continuity and open consequences
- honor planning context for quest intent and unresolved dependencies
- keep choices readable and narratively meaningful

The continuation should still generate **Quest N**, not a detached design note or a pure dialogue dump.

### Voice and structure

The draft should read like serious narrative-design writing:

- structured
- readable
- collaborator-friendly
- specific about player intent and consequence

It should not collapse into:

- fiction prose
- screenplay formatting
- implementation pseudo-code

---

## First Derived Output

The first game-writing-specific derived output should be:

- `quest_handoff_sheet`

### Purpose

This output turns the canonical quest brief into a cleaner handoff artifact for:

- narrative designers
- writers
- quest designers
- collaborators reviewing implementation intent

It should make the quest easier to review, hand off, and adapt without replacing the canonical draft.

### Output shape

The handoff sheet should emphasize:

- premise
- player objective
- core stages
- important branch highlights
- key NPCs, factions, and items
- rewards and likely consequences
- unresolved implementation notes or follow-up hooks

### Output principle

This should be a **production-facing summary artifact**, not a second canonical writing format.

The canonical draft stays the hybrid quest brief in the editor.
The handoff sheet is the first downstream artifact.

### Deferred outputs

These should stay explicitly out of C3 v1:

- `dialogue_only_script`
- `lore_item_brief`

They remain good follow-up outputs once the core game-writing workflow is proven.

---

## Export Behavior

Game-writing mode should export in a usable structured plain-text format, similar in spirit to the current comics export strategy.

Export should preserve:

- project title
- mode label
- mode config
- tone
- quest numbering
- quest content in readable order

This keeps the project portable and inspectable without needing a specialized export format in v1.

---

## Setup and UI Expectations

### Project creation

Game-writing mode should appear in the new-project flow as a real mode option.

The first-pass setup should stay lightweight:

- project title
- tone
- quest engine

This should feel closer to screenplay/comics setup than to a large design questionnaire.

### Project setup panel

The Project tab should expose a small mode-specific setup panel for future-default behavior, following the same pattern as screenplay and comics.

V1 setup should let the writer adjust:

- quest engine

without rewriting existing quest drafts.

### Shared surfaces

Mode-aware shared labels should update naturally:

- unit labels become `quest` / `quests`
- action labels become `Continue Quest`
- loading labels should reference quests rather than chapters or scenes

---

## Review and Continuity Expectations

Game-writing mode should reuse the existing memory, planning-aware generation, and continuity infrastructure rather than introducing a game-specific review subsystem in v1.

The value comes from:

- mode-native memory types
- mode-native planning phrasing
- quest-aware prompt guidance
- quest-aware outputs

This is enough for the first pass.

More specialized review later can add:

- branch consistency checks
- outcome drift checks
- reward chain gaps
- player-choice follow-through validation

but those should not be part of the C3 foundation slice.

---

## Explicit Deferrals

The following are intentionally out of scope for this first pass:

- executable state variables
- condition and flag logic
- node graph or visual branching editor
- dialogue-only script output
- lore/item brief output
- quest dependency graph UI
- implementation-ready export to an external quest tool format

These are good follow-up opportunities once the mode proves its core workflow and the writer-facing hybrid brief is stable.

---

## Success Criteria

C3 is successful when a writer can:

- create a game-writing project
- draft Quest 1 in a hybrid quest-brief format
- continue later quests with planning and memory context
- use game-writing-native memory defaults
- use quest-native planning language
- generate a `quest_handoff_sheet`
- export the project as readable structured text

without the mode feeling like fiction with renamed labels.

---

## Recommendation

Ship **game-writing mode v1** as a **quest-first, systems-aware narrative design workspace**.

Do not overreach into executable logic yet.

The right proof point for this phase is:

- one real game-writing mode
- one clear canonical draft format
- one useful production-facing output

That is enough to validate the next mode-pack expansion without diluting the workflow.
