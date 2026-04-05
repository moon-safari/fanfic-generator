# Memory Mode-Agnostic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename Codex → Memory and add a ModeConfig registry so project memory works across all writing modes (fiction, newsletters, screenplays, etc.).

**Architecture:** Phase 1 creates the ModeConfig registry (non-breaking). Phase 2 does the full Codex→Memory rename (one atomic commit across ~44 files). Phase 3 wires mode configs into routes, prompts, and UI.

**Tech Stack:** React 19, TypeScript 5 (strict), Next.js 16, Supabase

**Spec:** `docs/superpowers/specs/2026-04-04-memory-mode-agnostic-design.md`

---

## File Structure

### New files
```
src/app/lib/modes/types.ts         — ModeConfig interface
src/app/lib/modes/registry.ts      — MODE_REGISTRY + getModeConfig()
src/app/lib/modes/fiction.ts       — fiction mode config + prompt builders
src/app/lib/modes/newsletter.ts    — newsletter mode config + prompt builders
```

### Renamed files (Codex → Memory)
```
src/app/types/codex.ts                    → src/app/types/memory.ts
src/app/hooks/useCodex.ts                 → src/app/hooks/useMemory.ts
src/app/hooks/useCodexMentions.ts         → src/app/hooks/useMemoryMentions.ts
src/app/hooks/useCodexSuggestions.ts      → src/app/hooks/useMemorySuggestions.ts
src/app/hooks/useCodexFocus.ts            → src/app/hooks/useMemoryFocus.ts
src/app/lib/supabase/codex.ts             → src/app/lib/supabase/memory.ts
src/app/lib/supabase/codexMentions.ts     → src/app/lib/supabase/memoryMentions.ts
src/app/lib/supabase/codexSuggestions.ts  → src/app/lib/supabase/memorySuggestions.ts
src/app/lib/prompts/codex.ts              → src/app/lib/prompts/memory.ts
src/app/lib/prompts/codexSuggestions.ts   → src/app/lib/prompts/memorySuggestions.ts
src/app/lib/codex/mentions.ts             → src/app/lib/memory/mentions.ts
src/app/components/codex/*                → src/app/components/memory/*
src/app/api/codex/*                       → src/app/api/memory/*
src/app/components/editor/codexMentionExtension.ts → src/app/components/editor/memoryMentionExtension.ts
src/app/lib/demo/codexShowcase.ts         → src/app/lib/demo/memoryShowcase.ts
src/app/api/demo/codex-showcase/          → src/app/api/demo/memory-showcase/
```

### Modified files (import path updates + mode-awareness)
```
src/app/components/editor/StoryEditor.tsx   — update imports, variable names
src/app/components/editor/SidePanel.tsx     — update imports, tab key "codex" → "memory"
src/app/components/editor/ArtifactsTab.tsx  — update imports
src/app/lib/storyContext.ts                 — update imports
src/app/types/adaptation.ts                — update imports
src/app/types/artifact.ts                  — update imports
src/app/lib/supabase/adaptations.ts        — update imports
src/app/hooks/useStoryContext.ts           — update imports
src/app/hooks/useStoryStreaming.ts         — update fetch URL /api/codex → /api/memory
src/app/components/editor/AdaptTab.tsx     — update case "codex" → "memory"
src/app/types/story.ts                    — expand ProjectMode type
```

---

## Task 1: Create ModeConfig registry

**Files:**
- Create: `src/app/lib/modes/types.ts`
- Create: `src/app/lib/modes/fiction.ts`
- Create: `src/app/lib/modes/newsletter.ts`
- Create: `src/app/lib/modes/registry.ts`

This is non-breaking — new files only, no existing code changes.

- [ ] **Step 1: Create types.ts**

```typescript
// src/app/lib/modes/types.ts
import type { ProjectMode } from "../../types/story";

export interface ModeConfig {
  id: ProjectMode;
  label: string;
  memoryLabel: string;

  // Default entry types for new projects in this mode
  coreTypes: string[];
  typeLabels: Record<string, string>;
  typeIcons: Record<string, string>;

  // Field suggestions when creating entries of each type
  fieldSuggestions: Record<string, string[]>;

  // Content unit naming
  contentUnitSingular: string;
  contentUnitPlural: string;

  // Prompt builders — use narrow inline shapes (callers map from full MemoryEntry)
  // Routes pass: existingEntries.map(e => ({ name: e.name, entryType: e.entryType }))
  buildMemoryGenerationPrompt: (
    content: string,
    existingEntries: { name: string; entryType: string }[],
    context?: { fandom?: string }
  ) => string;

  buildSuggestionPrompt: (
    content: string,
    existingEntries: { name: string; entryType: string; description?: string }[],
    chapterNumber: number
  ) => string;

  buildContextPreamble: (storyTitle: string) => string;

  // Feature flags
  supportsAutoGeneration: boolean;
  supportsSuggestions: boolean;
}
```

- [ ] **Step 2: Create fiction.ts**

```typescript
// src/app/lib/modes/fiction.ts
import type { ModeConfig } from "./types";

function buildFictionMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((e) => e.name).join(", ");
  const fandomLine = context?.fandom
    ? `\nFandom/setting context: ${context.fandom}`
    : "";

  return `You are a story analyst. Read the following chapter text and extract structured project memory entries.${fandomLine}

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW characters, locations, lore, etc. not already listed.\n` : ""}
For each entry, output JSON with: name, type (one of: character, location, lore, event, faction, object), description, and optionally aliases and customFields.

Chapter text:
${content}`;

// NOTE: Prompt uses "type" (not "entryType") to match the existing parseGeneratedEntries()
// parser in the generation route, which reads item.type.
}

function buildFictionSuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  chapterNumber: number
): string {
  const entrySummary = existingEntries
    .map((e) => `- ${e.name} (${e.entryType})${e.description ? ": " + e.description.slice(0, 100) : ""}`)
    .join("\n");

  return `You are a story analyst reviewing chapter ${chapterNumber}. Based on this chapter, suggest updates to the project memory.

Current memory entries:
${entrySummary || "(none)"}

Suggest: new entries to create, alias updates, new relationships, progressions (how entries change at this chapter), and stale entries to flag.

Chapter text:
${content}`;
}

export const fictionMode: ModeConfig = {
  id: "fiction",
  label: "Fiction",
  memoryLabel: "Memory",
  coreTypes: ["character", "location", "lore", "event", "faction", "object"],
  typeLabels: {
    character: "Character",
    location: "Location",
    lore: "Lore",
    event: "Event",
    faction: "Faction",
    object: "Object",
  },
  typeIcons: {
    character: "User",
    location: "MapPin",
    lore: "BookOpen",
    event: "Calendar",
    faction: "Users",
    object: "Package",
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

- [ ] **Step 3: Create newsletter.ts**

```typescript
// src/app/lib/modes/newsletter.ts
import type { ModeConfig } from "./types";

function buildNewsletterMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  _context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((e) => e.name).join(", ");

  return `You are a publication analyst. Read the following newsletter issue and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW topics, sources, audience segments, etc. not already listed.\n` : ""}
For each entry, output JSON with: name, type (one of: topic, source, audience, theme, format), description, and optionally aliases and customFields.

Issue text:
${content}`;

// NOTE: Prompt uses "type" (not "entryType") to match parseGeneratedEntries() parser.
}

function buildNewsletterSuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  chapterNumber: number
): string {
  const entrySummary = existingEntries
    .map((e) => `- ${e.name} (${e.entryType})${e.description ? ": " + e.description.slice(0, 100) : ""}`)
    .join("\n");

  return `You are a publication analyst reviewing issue ${chapterNumber}. Based on this issue, suggest updates to the project memory.

Current memory entries:
${entrySummary || "(none)"}

Suggest: new entries to create (topics, sources, audience segments), alias updates, new relationships between entries, and stale entries to flag.

Issue text:
${content}`;
}

export const newsletterMode: ModeConfig = {
  id: "newsletter",
  label: "Newsletter",
  memoryLabel: "Memory",
  coreTypes: ["topic", "source", "audience", "theme", "format"],
  typeLabels: {
    topic: "Topic",
    source: "Source",
    audience: "Audience Segment",
    theme: "Recurring Theme",
    format: "Format Element",
  },
  typeIcons: {
    topic: "Hash",
    source: "Link",
    audience: "Users",
    theme: "Repeat",
    format: "Layout",
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

- [ ] **Step 4: Create registry.ts**

```typescript
// src/app/lib/modes/registry.ts
import type { ProjectMode } from "../../types/story";
import type { ModeConfig } from "./types";
import { fictionMode } from "./fiction";
import { newsletterMode } from "./newsletter";

const MODE_REGISTRY: Record<ProjectMode, ModeConfig> = {
  fiction: fictionMode,
  newsletter: newsletterMode,
};

export function getModeConfig(mode: ProjectMode): ModeConfig {
  return MODE_REGISTRY[mode] ?? MODE_REGISTRY.fiction;
}

export type { ModeConfig } from "./types";
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors (new files only, no breaking changes)

- [ ] **Step 6: Commit**

```bash
git add src/app/lib/modes/
git commit -m "feat: add ModeConfig registry with fiction and newsletter configs"
```

---

## Task 2: Rename Codex → Memory (atomic rename)

**This is the largest task — a mechanical find-replace across ~44 files.** It must be done atomically (one commit) because intermediate states won't compile.

**Files:** All files listed in the "Renamed files" and "Modified files" sections above.

The rename has 3 phases within this task:

### Phase A: Move files/directories

- [ ] **Step 1: Move type file**

```bash
git mv src/app/types/codex.ts src/app/types/memory.ts
```

- [ ] **Step 2: Move data layer files**

```bash
git mv src/app/lib/supabase/codex.ts src/app/lib/supabase/memory.ts
git mv src/app/lib/supabase/codexMentions.ts src/app/lib/supabase/memoryMentions.ts
git mv src/app/lib/supabase/codexSuggestions.ts src/app/lib/supabase/memorySuggestions.ts
```

- [ ] **Step 3: Move prompt files**

```bash
git mv src/app/lib/prompts/codex.ts src/app/lib/prompts/memory.ts
git mv src/app/lib/prompts/codexSuggestions.ts src/app/lib/prompts/memorySuggestions.ts
```

- [ ] **Step 4: Move lib/codex directory**

```bash
mkdir -p src/app/lib/memory
git mv src/app/lib/codex/mentions.ts src/app/lib/memory/mentions.ts
rmdir src/app/lib/codex
```

- [ ] **Step 5: Move hook files**

```bash
git mv src/app/hooks/useCodex.ts src/app/hooks/useMemory.ts
git mv src/app/hooks/useCodexMentions.ts src/app/hooks/useMemoryMentions.ts
git mv src/app/hooks/useCodexSuggestions.ts src/app/hooks/useMemorySuggestions.ts
git mv src/app/hooks/useCodexFocus.ts src/app/hooks/useMemoryFocus.ts
```

- [ ] **Step 6: Move component directory**

```bash
git mv src/app/components/codex src/app/components/memory
```

- [ ] **Step 7: Move API route directory**

```bash
git mv src/app/api/codex src/app/api/memory
```

- [ ] **Step 8: Move editor extension**

```bash
git mv src/app/components/editor/codexMentionExtension.ts src/app/components/editor/memoryMentionExtension.ts
```

- [ ] **Step 9: Move demo files**

```bash
git mv src/app/lib/demo/codexShowcase.ts src/app/lib/demo/memoryShowcase.ts
git mv src/app/api/demo/codex-showcase src/app/api/demo/memory-showcase
```

### Phase B: Rename all identifiers within moved files

For every file that was moved, apply the global rename rule:
- All `Codex` prefixed type/interface/variable names → `Memory`
- All `codex` prefixed variable/function names → `memory`
- `=== CODEX ===` → `=== MEMORY ===` in prompt strings
- `data-codex-entry-id` → `data-memory-entry-id` in the mention extension
- `StoryContextSource` value `"codex"` → `"memory"` in types/memory.ts

Key renames within files:

**types/memory.ts:** All 44 exported types (see spec for full list). `Codex` interface → `Memory`. `CodexEntry` → `MemoryEntry`. Every `Codex*` prefix → `Memory*`.

**supabase/memory.ts:** `mapCodexEntryRow` → `mapMemoryEntryRow`, `mapCodexRelationshipRow` → `mapMemoryRelationshipRow`, etc. All `Codex*` type references → `Memory*`.

**supabase/memoryMentions.ts:** All `Codex*` type refs → `Memory*`.

**supabase/memorySuggestions.ts:** `mapCodexChangeSuggestionRow` → `mapMemoryChangeSuggestionRow`. All type refs.

**prompts/memory.ts:** `CodexPromptOptions` → `MemoryPromptOptions`. `formatCodexForPrompt` → `formatMemoryForPrompt`. `resolveCodexEntryAtChapter` → `resolveMemoryEntryAtChapter`. `buildCodexGenerationPrompt` → `buildMemoryGenerationPrompt`. Remove `CORE_TYPE_LABELS` and `CORE_FIELD_ORDER` (will be replaced by ModeConfig in Task 5).

**prompts/memorySuggestions.ts:** `buildCodexSuggestionPrompt` → `buildMemorySuggestionPrompt`. All type refs.

**lib/memory/mentions.ts:** All `Codex*` type refs → `Memory*`.

**hooks/useMemory.ts:** `useCodex` → `useMemory`. All type refs.

**hooks/useMemoryFocus.ts:** `CodexFocusRequest` → `MemoryFocusRequest`. `useCodexFocus` → `useMemoryFocus`. `focusCodexEntry` → `focusMemoryEntry`. `codexFocusRequest` → `memoryFocusRequest`. `data-codex-entry-id` → `data-memory-entry-id`.

**hooks/useMemoryMentions.ts:** `useCodexMentions` → `useMemoryMentions`. All type refs.

**hooks/useMemorySuggestions.ts:** `useCodexSuggestions` → `useMemorySuggestions`. All type refs.

**components/memory/CodexPanel.tsx → MemoryPanel.tsx:** Rename file to `MemoryPanel.tsx`. Rename component function `CodexPanel` → `MemoryPanel`. All internal `codex*` variables → `memory*`. All `Codex*` type refs → `Memory*`.

**components/memory/*.tsx (other 8 files):** Update import paths from `../../types/codex` → `../../types/memory`, from `../../hooks/useCodex` → `../../hooks/useMemory`, etc. Update all `Codex*` type references → `Memory*`.

**api/memory/**/*.ts (all 18 routes):** Update import paths. Update all `Codex*` type references → `Memory*`. Update internal variable names.

**editor/memoryMentionExtension.ts:** `CodexMentionItem` → `MemoryMentionItem`. `CodexMentionExtension` → `MemoryMentionExtension`. `codexMentionPluginKey` → `memoryMentionPluginKey`. Attribute `data-codex-entry-id` → `data-memory-entry-id`. Keep Tiptap plugin key string `"codexMentions"` unchanged (per spec).

### Phase C: Update all consumer imports

Update every file that imported from old paths:

**StoryEditor.tsx:** Update imports from `useCodexFocus` → `useMemoryFocus`, `useCodexMentions` → `useMemoryMentions`, `codexMentionExtension` → `memoryMentionExtension`. Update variable names: `codexFocus` → `memoryFocus`, `focusCodexEntry` → `focusMemoryEntry`.

**SidePanel.tsx:** Update imports from `components/codex/CodexPanel` → `components/memory/MemoryPanel`. Update tab key `"codex"` → `"memory"`. Update component reference `<CodexPanel` → `<MemoryPanel`. Update type imports.

**ArtifactsTab.tsx:** Update type imports from `hooks/useCodexFocus` → `hooks/useMemoryFocus`.

**storyContext.ts:** Update imports from `prompts/codex` → `prompts/memory`, `supabase/codex` → `supabase/memory`, etc.

**types/adaptation.ts:** Update `StoryContextSource` import from `types/codex` → `types/memory`.

**types/artifact.ts:** Same.

**lib/supabase/adaptations.ts:** Update imports.

**hooks/useStoryContext.ts:** Update imports.

**hooks/useStoryStreaming.ts:** Update fetch URL from `/api/codex/` to `/api/memory/`.

**AdaptTab.tsx:** Update `case "codex":` to `case "memory":` in the `StoryContextSource` switch statement.

**demo files:** Update internal imports.

> **Note:** `lib/prompts/index.ts` is NOT a codex re-export barrel — it's the main generation prompts file. Do not modify it in this task.

- [ ] **Step 10: Apply all identifier renames across all moved files**

Use search-and-replace across all files in the moved directories. The key patterns:
- `Codex` → `Memory` (capitalized, for types/components)
- `codex` → `memory` (lowercase, for variables/imports/paths)
- Be careful NOT to rename database table references (`from("codex_entries")` etc.)

- [ ] **Step 11: Update all consumer file imports**

Update every file listed in Phase C above.

- [ ] **Step 12: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 13: Verify no stale codex references**

Run: `grep -ri "codex" src/ --include="*.ts" --include="*.tsx" | grep -v "codex_" | grep -v '"codexMentions"'`

Expected: zero results. If any lines appear, they are stale references that need renaming.

The only acceptable remaining `codex` strings are database table names (`codex_entries`, `codex_relationships`, etc.) and the Tiptap plugin key `"codexMentions"` — both are filtered out by the grep above.

- [ ] **Step 14: Run ESLint**

Run: `npm run lint`
Expected: zero errors

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "refactor: rename Codex to Memory across entire codebase"
```

---

## Task 3: Wire mode config into memory generation route

**Files:**
- Modify: `src/app/api/memory/generate/route.ts`

- [ ] **Step 1: Read current route**

Read `src/app/api/memory/generate/route.ts` to understand the current fiction-specific logic: fandom lookup, hardcoded prompt, newsletter skip.

- [ ] **Step 2: Replace hardcoded logic with mode config**

Import `getModeConfig` from `../../../lib/modes/registry`. Replace the fiction-specific prompt building:

```typescript
import { getModeConfig } from "../../../lib/modes/registry";

// Replace the newsletter skip + fiction-specific prompt with:
const config = getModeConfig(story.projectMode);
if (!config.supportsAutoGeneration) {
  return NextResponse.json({ skipped: true, reason: "not_supported" });
}

const prompt = config.buildMemoryGenerationPrompt(
  chapterContent,
  existingEntries.map((e) => ({ name: e.name, entryType: e.entryType })),
  { fandom: story.fandom }
);
```

Keep the Claude API call and response parsing unchanged — only the prompt construction changes.

> **Important:** The existing `parseGeneratedEntries()` reads `item.type`, not `item.entryType`. The mode config prompt builders already use `type` in their JSON schema instructions to match this parser. Do not change the parser or the prompt JSON key.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/memory/generate/route.ts
git commit -m "feat: wire mode config into memory generation route"
```

---

## Task 4: Wire mode config into suggestion generation route

**Files:**
- Modify: `src/app/api/memory/suggestions/generate/route.ts`

- [ ] **Step 1: Read current route**

Read `src/app/api/memory/suggestions/generate/route.ts` to find the hardcoded suggestion prompt.

- [ ] **Step 2: Replace with mode config**

```typescript
import { getModeConfig } from "../../../../lib/modes/registry";

const config = getModeConfig(story.projectMode);
if (!config.supportsSuggestions) {
  return NextResponse.json({ suggestions: [] });
}

const prompt = config.buildSuggestionPrompt(
  chapterContent,
  existingEntries.map((e) => ({
    name: e.name,
    entryType: e.entryType,
    description: e.description,
  })),
  chapterNumber
);
```

> **Cleanup:** The old route passed `chapter.summary` to the prompt builder. The new mode config builders don't use `summary`. Remove the `chapter.summary` reference from the chapter SELECT query and any destructuring to avoid an unused variable TypeScript error.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/memory/suggestions/generate/route.ts
git commit -m "feat: wire mode config into suggestion generation route"
```

---

## Task 5: Wire mode config into shared prompt functions

**Files:**
- Modify: `src/app/lib/prompts/memory.ts`

- [ ] **Step 1: Read current file**

Read `src/app/lib/prompts/memory.ts` to find `CORE_TYPE_LABELS`, `CORE_FIELD_ORDER`, and `formatMemoryForPrompt`.

- [ ] **Step 2: Make formatMemoryForPrompt mode-aware**

Add optional `modeConfig` parameter to `MemoryPromptOptions`:

```typescript
import type { ModeConfig } from "../modes/types";

interface MemoryPromptOptions {
  // ... existing options
  modeConfig?: ModeConfig;
}
```

In `formatMemoryForPrompt`, use `modeConfig.typeLabels` instead of `CORE_TYPE_LABELS` when available. Use `modeConfig.buildContextPreamble(storyTitle)` for the header. Replace `=== MEMORY ===` with the preamble when a config is provided.

Remove the hardcoded `CORE_TYPE_LABELS` and `CORE_FIELD_ORDER` constants (they're now in mode configs as `typeLabels` and `fieldSuggestions`).

- [ ] **Step 3: Update callers**

Update any callers of `formatMemoryForPrompt` to pass the mode config when available. The main callers are in `storyContext.ts` and the generation routes.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/prompts/memory.ts src/app/lib/storyContext.ts
git commit -m "feat: make formatMemoryForPrompt mode-aware via ModeConfig"
```

---

## Task 6: Wire mode config into Memory UI components

**Files:**
- Modify: `src/app/components/memory/EntryList.tsx`
- Modify: `src/app/components/memory/EntryForm.tsx`
- Modify: `src/app/components/memory/MemoryPanel.tsx`

- [ ] **Step 1: Read EntryList.tsx**

Find the hardcoded `CORE_TYPE_ORDER` array and type display logic.

- [ ] **Step 2: Make EntryList mode-aware**

Add `projectMode` (or `modeConfig`) prop. Replace `CORE_TYPE_ORDER` with `config.coreTypes`. Replace hardcoded type labels with `config.typeLabels`. Custom types still append after core types. Change any `CoreEntryType` type annotations to `string` so mode-specific types compile.

```typescript
import { getModeConfig } from "../../lib/modes/registry";

// In the component:
const config = getModeConfig(projectMode);
const typeOrder = config.coreTypes;
// Group entries by type, ordered by typeOrder, then custom types
```

- [ ] **Step 3: Read EntryForm.tsx**

Find `CORE_ENTRY_TYPES` and type suggestion logic.

- [ ] **Step 4: Make EntryForm mode-aware**

Replace `CORE_ENTRY_TYPES` with mode config's `coreTypes`. Replace field suggestions with `config.fieldSuggestions`. Change any `CoreEntryType` type annotations for `entryType` props/variables to `string` so newsletter mode types (`"topic"`, `"source"`, etc.) compile without errors.

- [ ] **Step 5: Thread projectMode through MemoryPanel**

`MemoryPanel` receives `story` as a prop (which has `projectMode`). Pass `story.projectMode` to `EntryList` and `EntryForm`.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 7: Commit**

```bash
git add src/app/components/memory/EntryList.tsx src/app/components/memory/EntryForm.tsx src/app/components/memory/MemoryPanel.tsx
git commit -m "feat: make Memory UI components mode-aware via ModeConfig"
```

---

## Task 7: Wire content unit naming into UI

**Files:**
- Modify: `src/app/components/memory/ProgressionEditor.tsx`
- Modify: `src/app/components/memory/EntryDetail.tsx`
- Modify: `src/app/components/memory/ContextConsole.tsx`

- [ ] **Step 1: Read ProgressionEditor.tsx**

Find hardcoded "chapter" strings.

- [ ] **Step 2: Replace with content unit naming**

Add `contentUnitSingular` prop (or derive from projectMode via getModeConfig). Replace hardcoded "chapter" strings:
- "Chapter" → capitalize(contentUnitSingular)
- "chapters" → contentUnitPlural

- [ ] **Step 3: Update EntryDetail.tsx**

Find any "chapter" references in mention display or progression display. Replace with content unit naming.

- [ ] **Step 4: Update ContextConsole.tsx**

Find any "chapter" references. Replace with content unit naming.

- [ ] **Step 5: Thread contentUnit props through MemoryPanel**

Ensure `MemoryPanel` passes the content unit strings from mode config to child components.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 7: Commit**

```bash
git add src/app/components/memory/ProgressionEditor.tsx src/app/components/memory/EntryDetail.tsx src/app/components/memory/ContextConsole.tsx src/app/components/memory/MemoryPanel.tsx
git commit -m "feat: replace hardcoded 'chapter' strings with mode-aware content unit naming"
```

---

## Task 8: Final verification and cleanup

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: ESLint check**

Run: `npm run lint`
Expected: zero errors

- [ ] **Step 3: Verify no stale codex references**

Run: `grep -ri "codex" src/ --include="*.ts" --include="*.tsx" -l`

Expected: only database table references and the Tiptap plugin key string.

Run: `grep -ri "Codex" src/ --include="*.ts" --include="*.tsx" | grep -v "codex_" | grep -v "codexMentions"`

Expected: zero results (no user-facing "Codex" strings remain).

- [ ] **Step 4: Update CLAUDE.md**

In the "What's shipped" section, add:
```
11. Codex → Memory rename + mode-agnostic memory engine (ModeConfig registry)
```

In the "Key product areas" section, update paths:
```
components/memory/              - project memory UI
```

Replace any remaining references to "Codex" with "Memory" in CLAUDE.md (except historical references in changelog-style sections).

- [ ] **Step 5: Update README.md**

Update:
- "Codex" references → "Memory"
- Key paths section: `components/codex/` → `components/memory/`
- Feature descriptions

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md and README.md for Codex → Memory rename"
```
