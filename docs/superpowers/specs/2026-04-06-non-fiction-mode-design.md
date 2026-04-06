# Non-Fiction Mode

**Date:** 2026-04-06
**Status:** Proposed
**Scope:** Phase C4 foundation pass

---

## Goal

Add **Non-fiction / articles / essays** as a real project mode, not just a future adaptation target.

This pass should let a writer:

- create a non-fiction project
- draft section-based article or essay work in the main editor
- use non-fiction-native memory and planning semantics
- treat citations and references as first-class structured project memory
- generate a production-facing `argument_evidence_brief` output
- export non-fiction work in a usable structured text format

The product goal is to prove that the shared Writing OS engine can support evidence-aware, source-backed writing workflows, not only fiction, newsletters, screenplays, comics, and game writing.

---

## Current State

The product currently supports five real modes:

- `fiction`
- `newsletter`
- `screenplay`
- `comics`
- `game_writing`

The shared architecture is now ready for another mode pack:

- `ModeConfig` owns memory and planning semantics
- shared prompt-context assembly is mode-aware
- planning phrasing is mode-aware
- outputs are filtered by `supportedModes`
- export behavior can branch by mode and durable `modeConfig`

But non-fiction does not exist yet as a first-class project workflow.

The roadmap already defines its intended shape:

- content unit: `section`
- core types: `source`, `argument`, `evidence`, `counterpoint`, `topic`
- planning: thesis outline, argument structure, evidence mapping
- outputs: article draft, bibliography/references, executive summary
- special considerations: citation management, fact-checking workflow, source credibility tracking

So the architecture is ready, but the mode pack itself has not been built.

One implementation constraint should stay explicit:

- `stories.project_mode` is enforced by a Supabase check constraint
- `adaptation_outputs.output_type` is enforced by a Supabase check constraint

So C4 must update the migration source of truth along with the application code.

---

## Chosen Approach

Add **one `non_fiction` mode** focused on an **article/essay-first hybrid section draft with inline claim/evidence cues**.

The canonical editor draft should use:

- `hybrid_section_draft`

meaning each content unit is a readable section draft that preserves article prose while keeping claim and evidence cues visible enough for the system to reason about support, structure, and proof gaps.

The first supporting output should be:

- `argument_evidence_brief`

which turns the canonical section draft into a cleaner, production-facing breakdown of argument structure, supporting evidence, cited sources, and unresolved proof gaps.

### Why this approach

This is the right first slice because:

- it fits the current project-mode architecture cleanly
- it gives non-fiction a distinct identity instead of feeling like fiction with renamed chapters
- it makes structured source memory useful immediately
- it keeps v1 centered on a real collaborator outcome: a section-by-section argument and evidence brief

### Explicit scope rule

This first pass is **evidence-aware and citation-aware, but not a full research or academic-citation system**.

V1 should support:

- structured source memory
- claim and evidence tracking
- argument flow and counterpoint planning
- manual or model-suggested source/citation entries
- production-facing evidence briefs

V1 should **not** attempt to provide:

- browser-based source discovery
- automatic source fetching or ingestion from URLs
- formal citation-style formatting engines (`APA`, `MLA`, `Chicago`)
- academic footnote management
- automated fact verification against the open web

Those remain explicit follow-up work after the mode proves its core workflow.

---

## Product Shape

### Content unit

For non-fiction mode, the content unit is:

- `section`

Shared surfaces should naturally read as:

- Section 1
- Continue Section
- current section
- section summary

This keeps non-fiction aligned with the current shared editor shell.

### Canonical editor text

The main editor remains the canonical project draft surface.

For non-fiction mode, the canonical draft should be a **hybrid section draft with inline claim/evidence cues**, not a pure outline and not a fully polished final article by default.

Each section draft should preserve:

- section purpose
- main claim or argument move
- supporting evidence cues
- cited or referenced source cues
- caveats or counterpoints when relevant
- transition pressure into the next section

The goal is not to create a rigid article form-builder.
The goal is to make the editor hold usable section-level non-fiction writing that is readable, continuity-safe, and easy to adapt into downstream production artifacts.

### Suggested section-draft convention

Prompts and exports should reinforce a stable plain-text structure such as:

- `SECTION 1`
- `Purpose:`
- `Claim cue:`
- `Evidence cue:`
- `Draft:`
- `Counterpoint / caveat:`
- `Transition:`

This structure should stay flexible and writer-friendly, not locked to a proprietary authoring format.

The important product rule is that the draft still reads like real article or essay writing, not like a research database dump.

---

## Non-Fiction Mode Config

Add a narrow first-pass `NonFictionModeConfig`.

Recommended fields:

- `draftingPreference: "hybrid_section_draft"`
- `formatStyle: "article_draft"`
- `pieceEngine?: "article" | "essay"`

### Design principle

Store only durable setup that materially changes generation, planning, or export behavior.

Do not turn non-fiction setup into a large editorial questionnaire in v1.

### Why `pieceEngine`

This gives the planner and generator a useful shape signal:

- `article`: clearer structural framing, faster setup, stronger service/explainer readability
- `essay`: more reflective argument flow, more room for voice and synthesis

That is enough value for v1 without introducing publication templates, academic formats, or newsroom workflow complexity.

---

## Non-Fiction Memory Semantics

Non-fiction mode should use the shared Memory engine with non-fiction-native defaults.

Recommended core types:

- `source`
- `claim`
- `topic`
- `argument`
- `evidence`
- `counterpoint`
- `quote`

### How this differs from fiction

Fiction memory is centered on story-world truth:

- what exists
- what happened
- what matters in the narrative

Non-fiction memory should stay compatible with that foundation, but become more evidence-aware by centering:

- what the piece is trying to argue
- what evidence supports which claim
- which sources carry the proof burden
- what counterpoints or caveats still need to be addressed

### Interpretation

- `source`: the durable reference record for a cited article, paper, report, interview, book, or other reference
- `claim`: a substantive assertion the draft makes or plans to make
- `topic`: recurring subject areas or conceptual buckets the piece works inside
- `argument`: the higher-level reasoning spine connecting claims across sections
- `evidence`: the support attached to a claim, such as a statistic, example, finding, or cited observation
- `counterpoint`: an objection, limitation, or alternate interpretation the piece should address
- `quote`: reusable attributed language that should stay tied to a source

### First-class citation and reference rule

Citations and references should be treated as **structured project memory**, not just plain text footnotes pasted into the draft.

That means:

- source entries are canonical reference records
- quote entries and evidence entries should point back to source truth
- memory suggestions can propose new sources, claims, quotes, and evidence when the section draft truly establishes them
- outputs can rely on structured source memory instead of trying to reconstruct citations from prose alone

V1 can still be manual or model-assisted in how sources get entered.
What matters is that references are durable structured project state once accepted.

### Systems-aware field expectations

The mode should remain flexible, but field suggestions should bias each type toward non-fiction concerns:

- `source`: author, publication, published_at, source_type, credibility_notes, relevance
- `claim`: section_role, support_status, linked_sources, caveat
- `argument`: thesis_role, section_span, intended_effect, dependencies
- `evidence`: evidence_type, supports_claim, source_link, confidence, notes
- `counterpoint`: target_claim, response_strategy, severity
- `topic`: scope, framing, audience_relevance, related_claims
- `quote`: speaker, source, usage_context, attribution

### Suggestion rule

Memory suggestions should continue to treat planning as context, not truth.

If a section was planned to land a strong claim or cite a specific report but the written draft does not actually establish that support, the system should not suggest it as canonical memory yet.

---

## Non-Fiction Planning Semantics

Non-fiction mode should use the existing shared planning surfaces:

- `outline`
- `notes`

with non-fiction-specific interpretation supplied by the mode pack.

### Outline meaning

`outline` represents a **section-by-section argument structure and status map**.

Each stored unit still uses the shared outline structure, but non-fiction mode interprets it as:

- section title or role
- section summary
- key claim or argument move
- evidence due in that section
- open counterpoint or transition obligation

### Notes meaning

`notes` represents **proof and editorial notes**, such as:

- active proof gaps
- unresolved counterarguments
- source follow-ups
- sections that currently overclaim the evidence
- editorial priorities about framing, tone, or evidence balance

### Planning phrasing

The planning unit label should be:

- `section beat`

Mode phrasing should read naturally in shared planning prompts, for example:

- target section plan
- claims to land
- evidence due by Section N
- open proof gaps

### Important v1 rule

Planning remains **human-readable writing guidance**, not a formal citation or editorial workflow system.

The system should support prose notes like:

- "This section should claim that the trend is structural, but only if the labor-stat source still supports the scale."

It should not attempt to convert that into a formal fact database, newsroom CMS workflow, or automatic source validation system yet.

---

## Generation Behavior

### First unit generation

In non-fiction mode:

- "Chapter 1" becomes `Section 1`

Generation prompts should produce a hybrid section draft that includes:

- section purpose
- main claim
- evidence cues
- cited source cues
- caveats or counterpoints where useful
- transition pressure into the next section

### Continuation behavior

Continuation prompts should:

- continue from the prior section's argument flow
- preserve source continuity and citation truth
- honor planning context for section intent and evidence obligations
- keep claims proportional to the evidence already established

The continuation should still generate **Section N**, not a detached outline note or bibliography fragment.

### Voice and structure

The draft should read like serious article or essay writing:

- structured
- readable
- collaborator-friendly
- explicit about the argument move and support burden

It should not collapse into:

- fiction-style scene writing
- newsletter packaging language
- academic formatting boilerplate
- pseudo-database citation listings

---

## Review and Continuity Expectations

Non-fiction mode should reuse the existing memory, planning-aware generation, and continuity infrastructure rather than introducing a completely separate review subsystem in v1.

The most useful non-fiction-native review signals are:

- unsupported claim drift
- source mismatch
- argument drift from plan
- unresolved counterpoint or evidence gap

The value comes from:

- mode-native source and claim memory
- mode-native planning phrasing
- section-aware prompt guidance
- an evidence-aware downstream output

This is enough for the first pass.

More specialized review later can add:

- claim-to-source coverage checks
- quote attribution validation
- citation-style formatting review
- overclaim severity heuristics

but those should not be part of the C4 foundation slice.

---

## First Derived Output

The first non-fiction-specific derived output should be:

- `argument_evidence_brief`

### Purpose

This output turns the canonical section draft into a cleaner handoff artifact for:

- writers
- editors
- collaborators
- reviewers checking whether the argument is sufficiently supported

It should make the piece easier to review, revise, and strengthen without replacing the canonical draft.

### Output shape

The argument and evidence brief should emphasize:

- main argument
- section-by-section claims
- evidence used
- cited sources
- counterpoints or caveats
- proof gaps or follow-up needs

### Output principle

This should be a **production-facing analysis artifact**, not a second canonical writing format.

The canonical draft stays the hybrid section draft in the editor.
The argument and evidence brief is the first downstream artifact.

### Deferred outputs

These should stay explicitly out of C4 v1:

- `reference_appendix`
- `fact_check_sheet`
- `executive_summary`

They remain good follow-up outputs once the core non-fiction workflow is proven.

---

## Export Behavior

Non-fiction mode should export in a usable structured plain-text format, similar in spirit to the current comics and game-writing export strategy.

Export should preserve:

- project title
- mode label
- mode config
- tone
- section numbering
- section content in readable order

This keeps the project portable and inspectable without needing formal bibliography export in v1.

---

## Setup and UI Expectations

### Project creation

Non-fiction mode should appear in the new-project flow as a real mode option.

The first-pass setup should stay lightweight:

- project title
- tone or voice
- piece engine (`article` or `essay`)

This should feel closer to screenplay/comics/game-writing setup than to a large editorial intake form.

### Project setup panel

The Project tab should expose a small mode-specific setup panel for future-default behavior, following the same pattern as screenplay, comics, and game writing.

V1 setup should let the writer adjust:

- piece engine

without rewriting existing sections.

### Shared surfaces

Mode-aware shared labels should update naturally:

- unit labels become `section` / `sections`
- action labels become `Continue Section`
- loading labels should reference sections rather than chapters, scenes, pages, or quests

---

## Mode Boundary: Non-Fiction vs Newsletter

This distinction should stay explicit.

Newsletter mode is:

- series-driven
- audience-relationship-driven
- packaging-heavy
- issue-based

Non-fiction mode should be:

- article or essay-driven
- source and evidence-aware
- section-based
- argument-structure-driven

This prevents non-fiction from collapsing into "newsletter without email packaging" and keeps both modes legible.

---

## Explicit Deferrals

The following are intentionally out of scope for this first pass:

- automatic web research
- URL ingestion pipelines
- browser-based source discovery
- formal bibliography and citation-style export
- academic footnote systems
- external fact-check integrations
- publication CMS integrations

These are good follow-up opportunities once the writer-facing source-aware section workflow is stable.

---

## Success Criteria

C4 is successful when a writer can:

- create a non-fiction project
- draft Section 1 in a hybrid article/essay format with inline claim and evidence cues
- continue later sections with planning and memory context
- use first-class source and citation memory defaults
- use section-native planning language
- generate an `argument_evidence_brief`
- export the project as readable structured text

without the mode feeling like fiction with renamed labels or newsletters without packaging.

---

## Recommendation

Ship **non-fiction mode v1** as an **article-first, source-aware writing workspace**.

Do not overreach into browser research, formal citation formatting, or automated fact checking yet.

The right proof point for this phase is:

- one real non-fiction mode
- one clear canonical section-draft format
- first-class structured source memory
- one useful production-facing output

That is enough to validate the next mode-pack expansion without diluting the workflow.
