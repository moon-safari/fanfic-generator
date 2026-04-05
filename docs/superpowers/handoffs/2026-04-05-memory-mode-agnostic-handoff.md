# Handoff: Memory Mode-Agnostic Implementation

**Date:** 2026-04-05
**Status:** Complete — all 8 tasks done, TypeScript and ESLint clean, no stale references.

---

## What was done

Executed the full 8-task plan at `docs/superpowers/plans/2026-04-05-memory-mode-agnostic.md`. The plan implements two major changes:

1. **Codex → Memory rename** across the entire codebase (~59 files touched)
2. **ModeConfig registry** — a mode-agnostic engine so project memory works across all writing modes

### Commits (oldest → newest)

| Hash | Description |
|------|-------------|
| `afd16bb` | docs: add Memory mode-agnostic design spec |
| `71a5423` | docs: add Memory mode-agnostic implementation plan |
| `27e4317` | feat: add ModeConfig registry with fiction and newsletter configs |
| `cc2869d` | refactor: move NOTE comments into functions, rename chapterNumber to contentUnitNumber |
| `1bf20d4` | refactor: rename Codex to Memory across entire codebase |
| `f23d16d` | fix: suppress unused _context ESLint warning in newsletter mode |
| `0f89143` | feat: wire mode config into memory generation route |
| `c320a92` | feat: wire mode config into suggestion generation route |
| `694b0d9` | feat: make formatMemoryForPrompt mode-aware via ModeConfig |
| `664eff6` | feat: make Memory UI components mode-aware via ModeConfig |
| `3197100` | feat: replace hardcoded 'chapter' strings with mode-aware content unit naming |
| `2adab6f` | docs: update CLAUDE.md and README.md for Codex→Memory rename and mode-agnostic engine |

### Verification results

- `npx tsc --noEmit` → zero errors
- `npm run lint` → zero errors
- Stale codex grep (excluding DB table names and Tiptap plugin key) → zero results

---

## Architecture overview

### ModeConfig registry

```
src/app/lib/modes/
  types.ts       — ModeConfig interface
  registry.ts    — MODE_REGISTRY lookup + getModeConfig(mode)
  fiction.ts     — fiction mode (chapters, characters, locations, lore, etc.)
  newsletter.ts  — newsletter mode (issues, topics, sources, audiences, etc.)
```

**Key function:** `getModeConfig(mode: ProjectMode): ModeConfig`

Each `ModeConfig` provides:
- `coreTypes`, `typeLabels`, `typeIcons`, `fieldSuggestions` — entry type definitions
- `contentUnitSingular` / `contentUnitPlural` — "chapter"/"issue"/"scene"/etc.
- `buildMemoryGenerationPrompt()` — prompt for auto-generating memory entries from content
- `buildSuggestionPrompt()` — prompt for suggesting memory updates
- `buildContextPreamble()` — header for memory context blocks in generation prompts
- `supportsAutoGeneration` / `supportsSuggestions` — feature flags per mode

### Rename mapping

| Before | After |
|--------|-------|
| `src/app/types/codex.ts` | `src/app/types/memory.ts` |
| `src/app/hooks/useCodex*.ts` | `src/app/hooks/useMemory*.ts` |
| `src/app/lib/supabase/codex*.ts` | `src/app/lib/supabase/memory*.ts` |
| `src/app/lib/prompts/codex*.ts` | `src/app/lib/prompts/memory*.ts` |
| `src/app/lib/codex/` | `src/app/lib/memory/` |
| `src/app/components/codex/` | `src/app/components/memory/` |
| `src/app/api/codex/` | `src/app/api/memory/` |
| All `Codex*` types/interfaces | All `Memory*` types/interfaces |
| SidePanel tab `"codex"` | SidePanel tab `"memory"` |
| `data-codex-entry-id` attribute | `data-memory-entry-id` attribute |

**Intentionally unchanged:**
- Database table names (`codex_entries`, `codex_relationships`, etc.) — no migration needed
- Tiptap plugin key string `"codexMentions"` — changing would break existing documents

### How mode config flows through the system

1. **API routes** (`api/memory/generate/`, `api/memory/suggestions/generate/`) call `getModeConfig()` with the story's `project_mode`, use the config's prompt builders and feature flags
2. **Shared prompts** (`lib/prompts/memory.ts`) accept optional `ModeConfig` for type labels and field ordering in `formatMemoryForPrompt()`
3. **UI components** (`MemoryPanel` → `EntryList`, `EntryForm`, `EntryDetail`, `ProgressionEditor`, `ContextConsole`) receive `projectMode` and/or `contentUnitLabel` as props, derive display from `getModeConfig()`

---

## What to work on next

Per `CLAUDE.md` and the project roadmap, the natural next steps are:

### 1. Simplification reset (in progress)
- The rename is done. Next: reduce visible surfaces, progressive disclosure, plain language throughout remaining UI
- Candidate areas: side panel tab labels, onboarding copy, empty states

### 2. Add new mode packs
Adding a new writing mode is now straightforward:
1. Create `src/app/lib/modes/<mode>.ts` implementing `ModeConfig`
2. Add it to `MODE_REGISTRY` in `registry.ts`
3. Add the mode to `ProjectMode` union in `src/app/types/story.ts`
4. Everything else (routes, prompts, UI) picks it up automatically

Planned modes: screenplay, comics/graphic narrative, game writing, non-fiction

### 3. Deeper planning-aware generation
- The memory system now knows about modes. Next step is making the planning/outline layer mode-aware too
- Connect planning artifacts to mode-specific structures (beat sheets for screenplay, issue calendars for newsletters)

### 4. ContextConsole helper functions
- `formatPriorityLabel()` and `describeNextChapterBehavior()` at the bottom of `ContextConsole.tsx` still have hardcoded "chapter" strings
- These are standalone helper functions without access to the `contentUnitLabel` prop — threading the label to them is a small follow-up

---

## Key files to know

| Purpose | Path |
|---------|------|
| Mode config interface | `src/app/lib/modes/types.ts` |
| Mode registry + lookup | `src/app/lib/modes/registry.ts` |
| Fiction mode config | `src/app/lib/modes/fiction.ts` |
| Newsletter mode config | `src/app/lib/modes/newsletter.ts` |
| Memory types | `src/app/types/memory.ts` |
| Memory prompt builder | `src/app/lib/prompts/memory.ts` |
| Memory generation route | `src/app/api/memory/generate/route.ts` |
| Suggestion generation route | `src/app/api/memory/suggestions/generate/route.ts` |
| Memory panel (main UI) | `src/app/components/memory/MemoryPanel.tsx` |
| Design spec | `docs/superpowers/specs/2026-04-04-memory-mode-agnostic-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-04-05-memory-mode-agnostic.md` |
| Product roadmap | `CLAUDE.md` (authoritative), `docs/PRODUCT_ROADMAP.md` |

---

## Conventions to follow

- All new props are optional with fiction defaults — existing callers don't break
- Database tables keep `codex_*` names (TypeScript abstracts over them)
- Prompt builders use `"type"` (not `"entryType"`) in JSON schemas to match `parseGeneratedEntries()` parser
- Mode config prompt builders use narrow inline parameter shapes — callers map from full `MemoryEntry`
- Content unit labels are threaded as props, not derived from `getModeConfig()` in every child component
- `CLAUDE.md` is the authoritative source for product rules and strategic direction
