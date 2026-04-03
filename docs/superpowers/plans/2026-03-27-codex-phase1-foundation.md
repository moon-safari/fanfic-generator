# Codex Phase 1 Foundation Implementation Plan

> For future agentic work: use this plan together with `docs/superpowers/specs/2026-03-25-codex-design.md` and `docs/superpowers/specs/2026-03-27-codex-product-strategy.md`.

**Goal:** Replace the current Story Bible as the primary story-context system with a Phase 1 Codex foundation that supports structured entries, relationships, progressions, custom types, and Codex-backed continuation prompts.

**Architecture:** This phase adds a new Codex data model alongside the existing Story Bible, keeping backward compatibility while the editor and generation flows transition from `story_bibles` to Codex data.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Postgres, Anthropic SDK, existing Tiptap editor and side panel

---

## Phase Boundary

This plan covers only Codex foundation.

Included:
- Codex tables and RLS
- shared TypeScript types
- prompt formatter and Chapter 1 extraction prompt
- Supabase helpers
- CRUD API routes
- side panel Codex tab
- Chapter 1 Codex generation
- `continue-chapter` switched to Codex context

Not included:
- mention detection
- aliases-based editor highlighting
- relationship graph
- series Codex
- fandom pre-seeding
- automatic post-chapter suggestion workflows

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/003_codex_foundation.sql` | Create | Codex tables, indexes, RLS policies |
| `src/app/types/codex.ts` | Create | Shared Codex domain types |
| `src/app/lib/prompts/codex.ts` | Create | Chapter-aware prompt formatter and generation prompt |
| `src/app/lib/supabase/codex.ts` | Create | Client-side Codex CRUD helpers |
| `src/app/api/codex/[storyId]/route.ts` | Create | Fetch story Codex |
| `src/app/api/codex/[storyId]/entries/route.ts` | Create | Create entries |
| `src/app/api/codex/[storyId]/entries/[entryId]/route.ts` | Create | Update/delete entries |
| `src/app/api/codex/[storyId]/relationships/route.ts` | Create | Create relationships |
| `src/app/api/codex/[storyId]/relationships/[relationshipId]/route.ts` | Create | Delete relationships |
| `src/app/api/codex/[storyId]/entries/[entryId]/progressions/route.ts` | Create | Create progressions |
| `src/app/api/codex/[storyId]/entries/[entryId]/progressions/[progressionId]/route.ts` | Create | Update/delete progressions |
| `src/app/api/codex/[storyId]/custom-types/route.ts` | Create | Create custom types |
| `src/app/api/codex/generate/route.ts` | Create | Generate initial Codex from Chapter 1 |
| `src/app/hooks/useCodex.ts` | Create | Frontend state and CRUD orchestration |
| `src/app/components/codex/CodexPanel.tsx` | Create | Main Codex tab body |
| `src/app/components/codex/EntryList.tsx` | Create | Grouped entry list |
| `src/app/components/codex/EntryDetail.tsx` | Create | Entry editor |
| `src/app/components/codex/EntryForm.tsx` | Create | New entry creation |
| `src/app/components/codex/RelationshipEditor.tsx` | Create | Relationship editing |
| `src/app/components/codex/ProgressionEditor.tsx` | Create | Progression editing |
| `src/app/components/codex/CustomFieldEditor.tsx` | Create | Key-value field editing |
| `src/app/components/editor/SidePanel.tsx` | Modify | Swap Bible tab content to Codex |
| `src/app/components/editor/StoryEditor.tsx` | Modify | Trigger Codex generation after Chapter 1 |
| `src/app/api/continue-chapter/route.ts` | Modify | Use `formatCodexForPrompt` instead of Bible |
| `src/app/api/craft/shared.ts` | Later modify | Keep Bible for now, then migrate craft tools |
| `src/app/lib/prompts/index.ts` | Modify | Accept Codex context in continuation builder |

---

## Task 1: Schema Foundation

**Files:**
- Create: `supabase/migrations/003_codex_foundation.sql`

- [ ] Add `codex_entries`
  - include `aliases` now to avoid a follow-up schema break for mention tracking
  - include `color` now to support future highlighting and entry-level differentiation
- [ ] Add `codex_relationships`
- [ ] Add `codex_progressions`
- [ ] Add `codex_custom_types`
- [ ] Add indexes for story/type/name lookup and progression resolution
- [ ] Add RLS for all new tables through `stories.user_id`
- [ ] Verify migration is additive only and does not remove `story_bibles`

Checkpoint:
- Existing stories still work unchanged
- Codex schema exists for new work

---

## Task 2: Shared Domain Model

**Files:**
- Create: `src/app/types/codex.ts`

- [ ] Define `CoreEntryType`
- [ ] Define `CodexCustomField`
- [ ] Define `CodexEntry`
- [ ] Define `CodexRelationship`
- [ ] Define `CodexProgression`
- [ ] Define `CodexCustomType`
- [ ] Define a resolved entry type for chapter-aware prompt formatting

Checkpoint:
- All future API/UI work can share one Codex shape

---

## Task 3: Prompt Utilities

**Files:**
- Create: `src/app/lib/prompts/codex.ts`

- [ ] Add `buildCodexGenerationPrompt(chapter1, fandomContext)`
- [ ] Add `resolveCodexEntryAtChapter(entry, chapterNumber)`
- [ ] Add `formatCodexForPrompt(entries, relationships, chapterNumber)`
- [ ] Ensure output includes progression markers like `[changed Ch.N]`
- [ ] Ensure relationships are rendered inline per entry

Checkpoint:
- Codex can be used as AI context before any UI exists

---

## Task 4: Supabase Helpers

**Files:**
- Create: `src/app/lib/supabase/codex.ts`

- [ ] Add fetch helper for full story Codex
- [ ] Add entry create/update/delete helpers
- [ ] Add relationship create/delete helpers
- [ ] Add progression create/update/delete helpers
- [ ] Add custom type create helper
- [ ] Add mapper helpers from DB rows to TypeScript types

Checkpoint:
- Frontend can use helpers without duplicating mapping logic

---

## Task 5: API Routes

**Files:**
- Create all `src/app/api/codex/...` routes listed above

- [ ] Implement ownership checks with server Supabase
- [ ] Keep request/response shapes minimal and explicit
- [ ] Make `/api/codex/[storyId]` return entries, relationships, customTypes
- [ ] Make `/api/codex/generate` idempotent by skipping duplicate names
- [ ] Return clear JSON errors for all failure cases

Checkpoint:
- Codex can be managed entirely through API routes

---

## Task 6: Codex Panel UI

**Files:**
- Create `src/app/components/codex/*`
- Modify `src/app/components/editor/SidePanel.tsx`

- [ ] Build grouped list view by entry type
- [ ] Build entry detail/edit view
- [ ] Add inline custom field editing
- [ ] Add relationship editing
- [ ] Add progression editing
- [ ] Add empty state for stories that have no Codex yet
- [ ] Add "Generate from Chapter 1" action to empty state
- [ ] Preserve current SidePanel structure so editor layout stays stable

Checkpoint:
- Users can manage a real Codex inside the current editor shell

---

## Task 7: Story Flow Integration

**Files:**
- Modify `src/app/components/editor/StoryEditor.tsx`
- Modify `src/app/api/continue-chapter/route.ts`
- Modify `src/app/lib/prompts/index.ts`

- [ ] Replace post-Chapter-1 Story Bible generation with Codex generation
- [ ] Change continuation prompt building to use resolved Codex context
- [ ] Keep Story Bible intact as fallback during transition
- [ ] Avoid breaking current craft-tool flows until Codex foundation is stable

Checkpoint:
- Continuing a story reads from Codex instead of Bible

---

## Task 8: Transitional Compatibility

**Files:**
- Modify only where needed

- [ ] Keep `story_bibles` table and routes working
- [ ] Do not remove Bible code in this phase
- [ ] Allow stories with no Codex to continue working
- [ ] Show empty-state guidance instead of hard failure when Codex is absent

Checkpoint:
- Rollout is reversible and safe

---

## Recommended Build Order

1. Migration
2. Types
3. Prompt utilities
4. Supabase helpers
5. API routes
6. Codex panel UI
7. Story flow integration
8. Craft flow migration later

This order keeps the architecture ahead of the UI.

---

## Manual Verification

- [ ] Existing stories still open in the editor
- [ ] New migration applies cleanly
- [ ] Codex entries can be created, edited, and deleted
- [ ] Relationships render correctly in both directions
- [ ] Progressions resolve correctly when Chapter N changes
- [ ] `/api/codex/generate` creates initial entries from Chapter 1
- [ ] `continue-chapter` uses Codex context once integrated
- [ ] Stories without Codex still behave safely

---

## Claude Handoff Notes

If Claude picks this up later, the safest next sequence is:

1. read `docs/superpowers/specs/2026-03-25-codex-design.md`
2. read `docs/superpowers/specs/2026-03-27-codex-product-strategy.md`
3. implement the migration and types first
4. wire prompt formatting before UI
5. only swap the editor tab after the API surface exists

The main thing to avoid is partially replacing the Bible UI before Codex CRUD and prompt formatting are ready.
