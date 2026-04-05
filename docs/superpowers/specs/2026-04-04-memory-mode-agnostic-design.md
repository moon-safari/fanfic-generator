# Memory Mode-Agnostic Design Spec

## Goal

Rename Codex → Memory and make the project memory system mode-aware, so it works naturally across fiction, newsletters, screenplays, game writing, comics, and any future writing mode. This is the foundation for the "OS for Writing" vision — one knowledge layer that adapts to every kind of writing.

## Non-Goals

- Building new mode packs (screenplay, comics, etc.) — this spec makes the engine ready for them
- Renaming database tables (high-risk, low-value — the TypeScript layer abstracts table names)
- Building an i18n system — content unit strings are simple prop-based replacements
- Changing the Memory data model (entries, relationships, progressions, mentions, context rules are already generic)

## Scope

Two work streams executed together:

1. **Rename Codex → Memory** — mechanical find-replace across types, hooks, components, API routes, data helpers, prompts, and UI labels
2. **Mode config registry** — a central configuration per project mode that defines entry types, field suggestions, prompt builders, content unit naming, and feature flags

---

## Architecture

### ModeConfig interface

```typescript
// src/app/lib/modes/types.ts

export interface ModeConfig {
  id: ProjectMode;
  label: string;                         // "Fiction", "Newsletter", "Screenplay"
  memoryLabel: string;                   // "Memory" for all modes (could vary later)

  // Default entry types for new projects in this mode
  coreTypes: string[];                   // e.g. fiction: ["character","location","lore","event","faction","object"]
  typeLabels: Record<string, string>;    // e.g. { character: "Character", location: "Location" }
  typeIcons: Record<string, string>;     // lucide icon name per type

  // Field suggestions when creating entries of each type
  fieldSuggestions: Record<string, string[]>;

  // Content unit naming
  contentUnitSingular: string;           // "chapter" | "issue" | "scene" | "page"
  contentUnitPlural: string;             // "chapters" | "issues" | "scenes" | "pages"

  // Prompt builders
  buildMemoryGenerationPrompt: (
    content: string,
    existingEntries: MemoryEntry[],
    context?: { fandom?: string }
  ) => string;

  buildSuggestionPrompt: (
    content: string,
    existingEntries: MemoryEntry[],
    chapterNumber: number
  ) => string;

  buildContextPreamble: (storyTitle: string) => string;

  // Feature flags
  supportsAutoGeneration: boolean;
  supportsSuggestions: boolean;
}
```

### Registry

```typescript
// src/app/lib/modes/registry.ts

import { fictionMode } from "./fiction";
import { newsletterMode } from "./newsletter";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
};

export function getModeConfig(mode: ProjectMode): ModeConfig {
  return MODE_REGISTRY[mode] ?? MODE_REGISTRY.fiction;
}
```

Each mode config is a standalone file: `src/app/lib/modes/fiction.ts`, `src/app/lib/modes/newsletter.ts`.

### Adding a new mode

1. Create `src/app/lib/modes/<mode>.ts` implementing `ModeConfig`
2. Add `"<mode>"` to the `ProjectMode` union in `types/story.ts`
3. Register it in `registry.ts`
4. Done — all existing UI, API routes, and prompts automatically adapt

---

## Rename: Codex → Memory

### Global rename rule

**Every `Codex`-prefixed or `codex`-prefixed identifier in `src/` becomes `Memory`/`memory` respectively.** This applies to:
- Type/interface names (`CodexEntry` → `MemoryEntry`, `Codex` → `Memory`, etc.)
- Function names (`fetchCodexData` → `fetchMemoryData`, `mapCodexEntryRow` → `mapMemoryEntryRow`, etc.)
- Hook names (`useCodex` → `useMemory`, etc.)
- Variable and property names (`codexFocusRequest` → `memoryFocusRequest`, `focusCodexEntry` → `focusMemoryEntry`, etc.)
- Import paths, file paths, and API route paths
- Prompt header strings (`=== CODEX ===` → `=== MEMORY ===`)
- Data attribute names (`data-codex-entry-id` → `data-memory-entry-id`)

**Exceptions (do NOT rename):**
- Database table names (`codex_entries`, `codex_relationships`, etc.) — the data layer abstracts these
- Tiptap plugin key string `"codexMentions"` — changing this could break existing editor state; leave as-is internally

### File renames

| Old path | New path |
|----------|----------|
| `src/app/types/codex.ts` | `src/app/types/memory.ts` |
| `src/app/hooks/useCodex.ts` | `src/app/hooks/useMemory.ts` |
| `src/app/hooks/useCodexMentions.ts` | `src/app/hooks/useMemoryMentions.ts` |
| `src/app/hooks/useCodexSuggestions.ts` | `src/app/hooks/useMemorySuggestions.ts` |
| `src/app/hooks/useCodexFocus.ts` | `src/app/hooks/useMemoryFocus.ts` |
| `src/app/lib/supabase/codex.ts` | `src/app/lib/supabase/memory.ts` |
| `src/app/lib/supabase/codexMentions.ts` | `src/app/lib/supabase/memoryMentions.ts` |
| `src/app/lib/supabase/codexSuggestions.ts` | `src/app/lib/supabase/memorySuggestions.ts` |
| `src/app/lib/prompts/codex.ts` | `src/app/lib/prompts/memory.ts` |
| `src/app/lib/prompts/codexSuggestions.ts` | `src/app/lib/prompts/memorySuggestions.ts` |
| `src/app/lib/codex/` | `src/app/lib/memory/` |
| `src/app/components/codex/` | `src/app/components/memory/` |
| `src/app/api/codex/` | `src/app/api/memory/` |
| `src/app/components/editor/codexMentionExtension.ts` | `src/app/components/editor/memoryMentionExtension.ts` |
| `src/app/api/demo/codex-showcase/` | `src/app/api/demo/memory-showcase/` |
| `src/app/lib/demo/codexShowcase.ts` | `src/app/lib/demo/memoryShowcase.ts` |

### Consumer files (import path updates only)

These files import from codex paths and need updated imports after the renames:

- `src/app/lib/storyContext.ts`
- `src/app/types/adaptation.ts`
- `src/app/types/artifact.ts`
- `src/app/lib/supabase/adaptations.ts`
- `src/app/hooks/useStoryContext.ts`
- `src/app/hooks/useStoryStreaming.ts` (also has hardcoded `/api/codex/` URL)
- `src/app/components/editor/StoryEditor.tsx`
- `src/app/components/editor/SidePanel.tsx`
- `src/app/components/editor/ArtifactsTab.tsx`
- Any other file importing from `types/codex`, `supabase/codex*`, `hooks/useCodex*`, or `components/codex/`
| `src/app/lib/codex/` | `src/app/lib/memory/` |
| `src/app/components/codex/` | `src/app/components/memory/` |
| `src/app/api/codex/` | `src/app/api/memory/` |

### Type renames

Per the global rename rule, **all** `Codex`-prefixed types become `Memory`-prefixed. Key examples:

| Old name | New name |
|----------|----------|
| `Codex` (top-level interface) | `Memory` |
| `CodexEntry` | `MemoryEntry` |
| `CodexRelationship` | `MemoryRelationship` |
| `CodexProgression` | `MemoryProgression` |
| `CodexCustomType` | `MemoryCustomType` |
| `CodexCustomField` | `MemoryCustomField` |
| `CodexSuggestedField` | `MemorySuggestedField` |
| `CodexMention` | `MemoryMention` |
| `CodexContextRule` | `MemoryContextRule` |
| `CodexContextRuleMode` | `MemoryContextRuleMode` |
| `CodexChangeSuggestion` | `MemoryChangeSuggestion` |
| `CodexFocusRequest` | `MemoryFocusRequest` |
| `ResolvedCodexEntry` | `ResolvedMemoryEntry` |
| `CodexGenerateEntryInput` | `MemoryGenerateEntryInput` |
| `CreateCodexEntryInput` | `CreateMemoryEntryInput` |
| `UpdateCodexEntryInput` | `UpdateMemoryEntryInput` |
| `CreateCodexRelationshipInput` | `CreateMemoryRelationshipInput` |
| `CreateCodexProgressionInput` | `CreateMemoryProgressionInput` |
| `UpdateCodexProgressionInput` | `UpdateMemoryProgressionInput` |
| `CreateCodexCustomTypeInput` | `CreateMemoryCustomTypeInput` |
| `ArtifactFocusRequest` | (unchanged — not codex-specific) |

This is not exhaustive — apply the global rename rule to every `Codex*` type in `types/codex.ts`.

**`CoreEntryType` handling:** The `CoreEntryType = "character" | "location" | ...` union currently hardcodes fiction types. It stays in `types/memory.ts` as a convenience type for fiction mode, but mode configs use `string[]` for `coreTypes` so other modes are not constrained by this union. Components should accept `string` for entry type, not `CoreEntryType`, when they need to be mode-agnostic.

**`StoryContextSource` value:** The literal `"codex"` in `StoryContextSource = "codex" | "story_bible" | "none"` becomes `"memory"`. This is a string literal change in the type, not a database migration — the value is used at runtime for context attribution, not persisted.

### Hook renames

| Old name | New name |
|----------|----------|
| `useCodex` | `useMemory` |
| `useCodexMentions` | `useMemoryMentions` |
| `useCodexSuggestions` | `useMemorySuggestions` |
| `useCodexFocus` | `useMemoryFocus` |

### Component renames

| Old name | New name |
|----------|----------|
| `CodexPanel` | `MemoryPanel` |
| `EntryList` | `EntryList` (unchanged — already generic) |
| `EntryDetail` | `EntryDetail` (unchanged) |
| `EntryForm` | `EntryForm` (unchanged) |
| `ContextConsole` | `ContextConsole` (unchanged) |
| `SuggestionList` | `SuggestionList` (unchanged) |
| `ProgressionEditor` | `ProgressionEditor` (unchanged) |
| `RelationshipEditor` | `RelationshipEditor` (unchanged) |
| `CustomFieldEditor` | `CustomFieldEditor` (unchanged) |

### Data helper renames

| Old name | New name |
|----------|----------|
| `fetchCodexData` | `fetchMemoryData` |
| `insertCodexEntry` | `insertMemoryEntry` |
| `updateCodexEntry` | `updateMemoryEntry` |
| `deleteCodexEntry` | `deleteMemoryEntry` |
| `createCodexRelationship` | `createMemoryRelationship` |
| `deleteCodexRelationship` | `deleteMemoryRelationship` |
| `createCodexProgression` | `createMemoryProgression` |
| `updateCodexProgression` | `updateMemoryProgression` |
| `deleteCodexProgression` | `deleteMemoryProgression` |
| `createCodexCustomType` | `createMemoryCustomType` |
| `upsertCodexContextRule` | `upsertMemoryContextRule` |
| `deleteCodexContextRule` | `deleteMemoryContextRule` |

### Prompt function renames and deliberate API changes

**Shared functions (mechanical rename):**

| Old name | New name |
|----------|----------|
| `formatCodexForPrompt` | `formatMemoryForPrompt` |
| `resolveCodexEntryAtChapter` | `resolveMemoryEntryAtChapter` |
| `CORE_TYPE_LABELS` | Removed — replaced by `ModeConfig.typeLabels` |
| `CORE_FIELD_ORDER` | Removed — replaced by `ModeConfig.fieldSuggestions` |
| `CodexPromptOptions` | `MemoryPromptOptions` |
| `=== CODEX ===` prompt header | `=== MEMORY ===` |

**Functions replaced by mode config (deliberate signature changes):**

These are NOT mechanical renames — they are intentional API redesigns to support mode-specific prompt building:

| Old function | Replacement | Signature change |
|-------------|-------------|------------------|
| `buildCodexGenerationPrompt(chapter1, fandomContext)` | `ModeConfig.buildMemoryGenerationPrompt(content, existingEntries, context?)` | Added `existingEntries` so prompt can reference what's already known. `context` is an optional bag for mode-specific data (fiction passes `fandom`, others ignore). |
| `buildCodexSuggestionPrompt(content, summary, chapterNum, codex)` | `ModeConfig.buildSuggestionPrompt(content, existingEntries, chapterNumber)` | Dropped `summary` (can be derived from content if needed). Changed `codex: Codex` to `existingEntries: MemoryEntry[]` for a simpler interface. |

The fiction mode's implementations of these functions preserve the existing prompt logic — they just receive arguments in the new shape and format them the same way.

### UI label changes

All user-facing strings:
- "Codex" → "Memory"
- Tab label in SidePanel
- Empty states, tooltips, button labels
- Mention extension labels

### Database tables

**No renames.** Tables keep `codex_*` names. The data helper layer abstracts this — the TypeScript functions use `Memory*` names while querying `codex_*` tables internally.

### API route paths

- `/api/codex/[storyId]/...` → `/api/memory/[storyId]/...`
- All client-side fetch URLs updated to match

---

## Mode-specific prompt builders

### What moves into mode configs

**Memory generation prompt** (`buildMemoryGenerationPrompt`):
- Fiction: references story analysis, fandom context, character/location/lore extraction
- Newsletter: references publication voice, audience segments, recurring topics
- Each mode produces a prompt tailored to what kind of memory entries are useful for that writing type

**Suggestion prompt** (`buildSuggestionPrompt`):
- Fiction: looks for character developments, new locations, relationship changes, lore reveals
- Newsletter: looks for new topics, audience shifts, source references, voice drift
- Each mode frames the analysis for its content type

**Context preamble** (`buildContextPreamble`):
- Fiction: "Here is the project memory for this story:"
- Newsletter: "Here is the project memory for this publication:"
- Short string, sets the right framing when memory is injected into generation prompts

### What stays shared

- `formatMemoryForPrompt()` — mechanical formatting of entries into prompt text (groups by type, shows relationships, resolves progressions). Called by mode-specific builders.
- `resolveMemoryEntryAtChapter()` — progression resolution by chapter number. Works for any chapter-based mode.
- Mention matching logic — purely text-based, mode-agnostic.

### How API routes use mode configs

**`/api/memory/generate`** (initial memory generation):
```typescript
const config = getModeConfig(story.projectMode);
if (!config.supportsAutoGeneration) {
  return NextResponse.json({ skipped: true });
}
const prompt = config.buildMemoryGenerationPrompt(chapterContent, existingEntries, {
  fandom: story.fandom, // fiction-only, ignored by other modes
});
// ... call Claude with prompt
```

**`/api/memory/suggestions/generate`**:
```typescript
const config = getModeConfig(story.projectMode);
if (!config.supportsSuggestions) {
  return NextResponse.json({ suggestions: [] });
}
const prompt = config.buildSuggestionPrompt(chapterContent, existingEntries, chapterNumber);
// ... call Claude with prompt
```

**All other routes** are already generic — no mode-specific logic needed.

---

## UI mode-awareness

### Entry type presentation

`MemoryPanel` (renamed from `CodexPanel`) reads type ordering and labels from the mode config:

```typescript
const config = getModeConfig(story.projectMode);
// EntryList receives config.coreTypes for ordering, config.typeLabels for display
```

- Fiction: Characters, Locations, Lore, Events, Factions, Objects
- Newsletter: Topics, Sources, Audience Segments, Recurring Themes
- Custom types always append after core types (unchanged)

### Content unit language

Components that currently hardcode "chapter" use the mode config's `contentUnitSingular` / `contentUnitPlural`:

- ProgressionEditor: "At chapter N" → "At {contentUnit} N"
- EditorToolbar: chapter navigation labels
- Mention display: "Found in chapter 3" → "Found in {contentUnit} 3"
- Continuity check labels

This is ~5-10 components with string replacements, not a wholesale i18n system. Components receive the strings via props or read from story.projectMode → getModeConfig.

### What doesn't change in UI

- Entry form (name, type, description, aliases, tags, custom fields) — already generic
- Relationship editor — already generic
- Context console — already generic
- Mention display layout — already generic
- Memory panel structure/layout — same across all modes

---

## Initial mode configs

### Fiction mode

```typescript
// src/app/lib/modes/fiction.ts
export const fictionMode: ModeConfig = {
  id: "fiction",
  label: "Fiction",
  memoryLabel: "Memory",
  coreTypes: ["character", "location", "lore", "event", "faction", "object"],
  typeLabels: {
    character: "Character", location: "Location", lore: "Lore",
    event: "Event", faction: "Faction", object: "Object",
  },
  typeIcons: {
    character: "User", location: "MapPin", lore: "BookOpen",
    event: "Calendar", faction: "Users", object: "Package",
  },
  fieldSuggestions: {
    character: ["role", "personality", "appearance", "voice", "age", "occupation"],
    location: ["description", "atmosphere", "significance"],
    lore: ["description", "origin", "rules"],
    event: ["description", "when", "impact"],
    faction: ["description", "goals", "members"],
    object: ["description", "significance", "owner"],
  },
  contentUnitSingular: "chapter",
  contentUnitPlural: "chapters",
  buildMemoryGenerationPrompt: buildFictionMemoryPrompt,
  buildSuggestionPrompt: buildFictionSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for "${title}":`,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
```

### Newsletter mode

```typescript
// src/app/lib/modes/newsletter.ts
export const newsletterMode: ModeConfig = {
  id: "newsletter",
  label: "Newsletter",
  memoryLabel: "Memory",
  coreTypes: ["topic", "source", "audience", "theme", "format"],
  typeLabels: {
    topic: "Topic", source: "Source", audience: "Audience Segment",
    theme: "Recurring Theme", format: "Format Element",
  },
  typeIcons: {
    topic: "Hash", source: "Link", audience: "Users",
    theme: "Repeat", format: "Layout",
  },
  fieldSuggestions: {
    topic: ["description", "related topics", "last covered"],
    source: ["description", "url", "credibility", "contact"],
    audience: ["description", "interests", "pain points"],
    theme: ["description", "frequency", "examples"],
    format: ["description", "placement", "tone"],
  },
  contentUnitSingular: "issue",
  contentUnitPlural: "issues",
  buildMemoryGenerationPrompt: buildNewsletterMemoryPrompt,
  buildSuggestionPrompt: buildNewsletterSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for "${title}":`,
  supportsAutoGeneration: false,
  supportsSuggestions: true,
};
```

---

## File structure (new files)

```
src/app/lib/modes/
  types.ts              — ModeConfig interface
  registry.ts           — MODE_REGISTRY + getModeConfig()
  fiction.ts            — fiction mode config + prompt builders
  newsletter.ts         — newsletter mode config + prompt builders
```

All other files are renames of existing files, not new.

---

## Migration safety

- **Database:** No table renames. TypeScript abstracts `codex_*` table names behind `Memory*` function names.
- **API routes:** Path change from `/api/codex/` to `/api/memory/`. All consumers are internal (no external API contract). Client-side fetches are updated in the same commit as the route rename.
- **Imports:** All import paths change in one pass. No backwards-compatibility re-exports — clean break since all consumers are internal.

---

## Verification

After implementation:
- `npx tsc --noEmit` — zero errors
- `npm run lint` — zero errors/warnings
- grep for "codex" (case-insensitive) in `src/` should return only:
  - Database table names in data helpers (`codex_entries`, `codex_relationships`, etc.)
  - The Tiptap mention extension's `data-codex-entry-id` attribute (rename to `data-memory-entry-id`)
- grep for "Codex" in UI-facing strings should return zero results
