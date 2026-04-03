import type { SupabaseClient } from "@supabase/supabase-js";
import { buildNewsletterMemorySnapshot, formatNewsletterMemoryForPrompt } from "./newsletterMemory";
import { getNewsletterModeConfig } from "./projectMode";
import { formatBibleForPrompt } from "./prompts/bible";
import { formatCodexForPrompt, resolveCodexEntryAtChapter } from "./prompts/codex";
import { fetchCodexContextRules, fetchCodexData } from "./supabase/codex";
import { fetchCodexMentions } from "./supabase/codexMentions";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleSection,
  BibleSectionContent,
  BibleSectionType,
  BibleStyleGuideContent,
  BibleSynopsisContent,
  StoryBible,
} from "../types/bible";
import type {
  CodexRelationship,
  CoreEntryType,
  ResolvedCodexEntry,
  StoryContextEntrySummary,
  StoryContextGroup,
  StoryContextPriority,
  StoryContextReason,
  StoryContextSnapshot,
  StoryContextSource,
} from "../types/codex";
import type { ProjectMode, StoryModeConfig } from "../types/story";

const ALL_SECTION_TYPES: BibleSectionType[] = [
  "characters",
  "world",
  "synopsis",
  "genre",
  "style_guide",
  "outline",
  "notes",
];

export interface PromptStoryContextResult {
  text: string;
  source: StoryContextSource;
}

interface ResolvedCodexStoryContext {
  text: string;
  entryCount: number;
  includedEntryCount: number;
  priorityEntryCount: number;
  pinnedEntryCount: number;
  excludedEntryCount: number;
  relationshipCount: number;
  focusEntries: StoryContextEntrySummary[];
  groups: StoryContextGroup[];
}

const EMPTY_ACTIVE_CODEX_CONTEXT =
  "=== CODEX ===\nNo Codex entries are currently included in the active context.";

export async function resolvePromptStoryContext(
  supabase: SupabaseClient,
  storyId: string,
  chapterNumber: number
): Promise<PromptStoryContextResult> {
  const resolvedChapterNumber = Math.max(1, chapterNumber);
  const storyMeta = await fetchStoryPromptMeta(supabase, storyId);

  if (storyMeta?.projectMode !== "newsletter") {
    try {
      const codexContext = await resolveCodexStoryContext(
        supabase,
        storyId,
        resolvedChapterNumber
      );
      if (codexContext) {
        return {
          text: codexContext.text,
          source: "codex",
        };
      }
    } catch (error) {
      console.error("Failed to resolve Codex prompt context:", error);
    }
  }

  const bibleContext = await fetchStoryBiblePromptContext(
    supabase,
    storyId,
    storyMeta,
    resolvedChapterNumber + 1
  );
  if (bibleContext) {
    return {
      text: bibleContext,
      source: "story_bible",
    };
  }

  return {
    text: "",
    source: "none",
  };
}

export async function buildStoryContextSnapshot(
  supabase: SupabaseClient,
  storyId: string,
  chapterNumber: number
): Promise<StoryContextSnapshot> {
  const resolvedThroughChapter = Math.max(1, chapterNumber);
  const generationChapter = resolvedThroughChapter + 1;
  const storyMeta = await fetchStoryPromptMeta(supabase, storyId);

  if (storyMeta?.projectMode !== "newsletter") {
    try {
      const codexContext = await resolveCodexStoryContext(
        supabase,
        storyId,
        resolvedThroughChapter
      );
      if (codexContext) {
        return {
          source: "codex",
          resolvedThroughChapter,
          generationChapter,
          text: codexContext.text,
          entryCount: codexContext.entryCount,
          includedEntryCount: codexContext.includedEntryCount,
          priorityEntryCount: codexContext.priorityEntryCount,
          pinnedEntryCount: codexContext.pinnedEntryCount,
          excludedEntryCount: codexContext.excludedEntryCount,
          relationshipCount: codexContext.relationshipCount,
          focusEntries: codexContext.focusEntries,
          groups: codexContext.groups,
        };
      }
    } catch (error) {
      console.error("Failed to build Codex story context snapshot:", error);
    }
  }

  const bibleContext = await fetchStoryBiblePromptContext(
    supabase,
    storyId,
    storyMeta,
    generationChapter
  );
  if (bibleContext) {
    return {
      source: "story_bible",
      resolvedThroughChapter,
      generationChapter,
      text: bibleContext,
      entryCount: 0,
      includedEntryCount: 0,
      priorityEntryCount: 0,
      pinnedEntryCount: 0,
      excludedEntryCount: 0,
      relationshipCount: 0,
      focusEntries: [],
      groups: [],
    };
  }

  return {
    source: "none",
    resolvedThroughChapter,
    generationChapter,
    text: "",
    entryCount: 0,
    includedEntryCount: 0,
    priorityEntryCount: 0,
    pinnedEntryCount: 0,
    excludedEntryCount: 0,
    relationshipCount: 0,
    focusEntries: [],
    groups: [],
  };
}

async function resolveCodexStoryContext(
  supabase: SupabaseClient,
  storyId: string,
  chapterNumber: number
): Promise<ResolvedCodexStoryContext | null> {
  const codex = await fetchCodexData(supabase, storyId);
  if (codex.entries.length === 0) {
    return null;
  }

  const rules = await fetchCodexContextRules(supabase, storyId);
  const contextModeByEntryId = new Map(
    rules.map((rule) => [rule.entryId, rule.mode] as const)
  );
  const resolvedEntries = codex.entries
    .map((entry) => resolveCodexEntryAtChapter(entry, chapterNumber))
    .sort(compareResolvedEntries);
  const includedEntryIds = resolvedEntries
    .filter((entry) => contextModeByEntryId.get(entry.id) !== "exclude")
    .map((entry) => entry.id);
  const pinnedEntryIds = resolvedEntries
    .filter((entry) => contextModeByEntryId.get(entry.id) === "pin")
    .map((entry) => entry.id);
  const includedEntryIdSet = new Set(includedEntryIds);
  const includedRelationships = codex.relationships.filter(
    (relationship) =>
      includedEntryIdSet.has(relationship.sourceEntryId)
      && includedEntryIdSet.has(relationship.targetEntryId)
  );
  const mentionCountByEntryId = await fetchCurrentChapterMentionCounts(
    supabase,
    storyId,
    chapterNumber
  );
  const linkedToPinnedEntryIds = getLinkedToPinnedEntryIds(
    includedRelationships,
    new Set(pinnedEntryIds)
  );
  const relationshipCounts = countRelationshipsByEntryId(
    resolvedEntries.map((entry) => entry.id),
    includedRelationships
  );
  const groups = buildContextGroups(
    resolvedEntries,
    relationshipCounts,
    chapterNumber,
    contextModeByEntryId,
    mentionCountByEntryId,
    linkedToPinnedEntryIds
  );
  const focusEntries = groups
    .flatMap((group) => group.entries)
    .filter((entry) => entry.nextChapterPriority === "priority")
    .sort(compareContextEntries);
  const priorityEntryIds = focusEntries
    .filter((entry) => entry.contextMode !== "pin")
    .map((entry) => entry.id);

  return {
    text:
      includedEntryIds.length > 0
        ? formatCodexForPrompt(
            codex.entries,
            codex.relationships,
            chapterNumber,
            {
              includeEntryIds: includedEntryIds,
              pinnedEntryIds,
              priorityEntryIds,
            }
          )
        : EMPTY_ACTIVE_CODEX_CONTEXT,
    entryCount: codex.entries.length,
    includedEntryCount: includedEntryIds.length,
    priorityEntryCount: focusEntries.length,
    pinnedEntryCount: pinnedEntryIds.length,
    excludedEntryCount: codex.entries.length - includedEntryIds.length,
    relationshipCount: includedRelationships.length,
    focusEntries,
    groups,
  };
}

async function fetchStoryBiblePromptContext(
  supabase: SupabaseClient,
  storyId: string,
  storyMeta: StoryPromptMeta | null,
  currentUnitNumber?: number
): Promise<string> {
  const { data, error } = await supabase
    .from("story_bibles")
    .select("*")
    .eq("story_id", storyId);

  if (error || !data || data.length === 0) {
    return "";
  }

  const sections = Object.fromEntries(
    ALL_SECTION_TYPES.map((sectionType) => [sectionType, null])
  ) as Record<BibleSectionType, BibleSection | null>;

  for (const row of data) {
    const section: BibleSection = {
      id: row.id as string,
      storyId: row.story_id as string,
      sectionType: row.section_type as BibleSectionType,
      content: row.content as BibleSectionContent,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
    sections[section.sectionType] = section;
  }

  if (storyMeta?.projectMode === "newsletter") {
    const snapshot = buildNewsletterMemorySnapshot({
      storyTitle: storyMeta.title,
      modeConfig: getNewsletterModeConfig({
        projectMode: storyMeta.projectMode,
        modeConfig: storyMeta.modeConfig,
      }),
      synopsis: sections.synopsis?.content as BibleSynopsisContent | undefined,
      styleGuide: sections.style_guide?.content as
        | BibleStyleGuideContent
        | undefined,
      outline: sections.outline?.content as BibleOutlineContent | undefined,
      notes: sections.notes?.content as BibleNotesContent | undefined,
      currentUnitNumber,
    });

    return formatNewsletterMemoryForPrompt(snapshot, {
      currentUnitNumber,
    });
  }

  const bible: StoryBible = { storyId, sections };
  return formatBibleForPrompt(bible);
}

interface StoryPromptMeta {
  title: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}

async function fetchStoryPromptMeta(
  supabase: SupabaseClient,
  storyId: string
): Promise<StoryPromptMeta | null> {
  const { data, error } = await supabase
    .from("stories")
    .select("title, project_mode, mode_config")
    .eq("id", storyId)
    .single();

  if (error || !data) {
    console.error("Failed to load story prompt meta:", error);
    return null;
  }

  return {
    title: (data.title as string | undefined) ?? "",
    projectMode: (data.project_mode as ProjectMode | undefined) ?? "fiction",
    modeConfig: (data.mode_config as StoryModeConfig | undefined) ?? undefined,
  };
}

function buildContextGroups(
  entries: ResolvedCodexEntry[],
  relationshipCounts: Map<string, number>,
  chapterNumber: number,
  contextModeByEntryId: Map<string, "pin" | "exclude">,
  mentionCountByEntryId: Map<string, number>,
  linkedToPinnedEntryIds: Set<string>
): StoryContextGroup[] {
  const groups = new Map<string, StoryContextEntrySummary[]>();

  for (const entry of entries) {
    const changedThisChapter = Object.values(entry.changedFields).some(
      (changedAtChapter) => changedAtChapter === chapterNumber
    );
    const contextMode = contextModeByEntryId.get(entry.id) ?? "default";
    const mentionCount = mentionCountByEntryId.get(entry.id) ?? 0;
    const reasons = buildContextReasons({
      contextMode,
      changedThisChapter,
      mentionCount,
      linkedToPinnedEntry: linkedToPinnedEntryIds.has(entry.id),
    });
    const nextChapterPriority = determineNextChapterPriority(contextMode, reasons);
    const items = groups.get(entry.entryType) ?? [];
    items.push({
      id: entry.id,
      name: entry.name,
      entryType: entry.entryType,
      description: entry.description,
      role: entry.customFieldMap.role,
      aliasCount: entry.aliases.length,
      mentionCount,
      relationshipCount: relationshipCounts.get(entry.id) ?? 0,
      changedThisChapter,
      contextMode,
      includedInPrompt: contextMode !== "exclude",
      nextChapterPriority,
      reasons,
    });
    groups.set(entry.entryType, items);
  }

  return Array.from(groups.entries()).map(([key, groupEntries]) => ({
    key,
    label: formatTypeHeading(key),
    count: groupEntries.length,
    entries: [...groupEntries].sort(compareContextEntries),
  }));
}

function countRelationshipsByEntryId(
  entryIds: string[],
  relationships: CodexRelationship[]
): Map<string, number> {
  const counts = new Map(entryIds.map((entryId) => [entryId, 0]));

  for (const relationship of relationships) {
    counts.set(
      relationship.sourceEntryId,
      (counts.get(relationship.sourceEntryId) ?? 0) + 1
    );
    counts.set(
      relationship.targetEntryId,
      (counts.get(relationship.targetEntryId) ?? 0) + 1
    );
  }

  return counts;
}

async function fetchCurrentChapterMentionCounts(
  supabase: SupabaseClient,
  storyId: string,
  chapterNumber: number
): Promise<Map<string, number>> {
  try {
    const mentions = await fetchCodexMentions(supabase, storyId, {
      chapterNumber,
    });

    return mentions.reduce((counts, mention) => {
      counts.set(mention.entryId, (counts.get(mention.entryId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  } catch (error) {
    console.error("Failed to load Codex mentions for story context:", error);
    return new Map<string, number>();
  }
}

function getLinkedToPinnedEntryIds(
  relationships: CodexRelationship[],
  pinnedEntryIds: Set<string>
): Set<string> {
  const linkedEntryIds = new Set<string>();

  for (const relationship of relationships) {
    if (pinnedEntryIds.has(relationship.sourceEntryId)) {
      linkedEntryIds.add(relationship.targetEntryId);
    }

    if (pinnedEntryIds.has(relationship.targetEntryId)) {
      linkedEntryIds.add(relationship.sourceEntryId);
    }
  }

  for (const pinnedEntryId of pinnedEntryIds) {
    linkedEntryIds.delete(pinnedEntryId);
  }

  return linkedEntryIds;
}

function buildContextReasons({
  contextMode,
  changedThisChapter,
  mentionCount,
  linkedToPinnedEntry,
}: {
  contextMode: StoryContextEntrySummary["contextMode"];
  changedThisChapter: boolean;
  mentionCount: number;
  linkedToPinnedEntry: boolean;
}): StoryContextReason[] {
  if (contextMode === "exclude") {
    return [
      {
        key: "excluded_by_writer",
        label: "Excluded by writer",
      },
    ];
  }

  const reasons: StoryContextReason[] = [];

  if (contextMode === "pin") {
    reasons.push({
      key: "pinned_by_writer",
      label: "Pinned by writer",
    });
  }

  if (changedThisChapter) {
    reasons.push({
      key: "changed_this_chapter",
      label: "Changed this chapter",
    });
  }

  if (mentionCount > 0) {
    reasons.push({
      key: "mentioned_this_chapter",
      label:
        mentionCount === 1
          ? "Mentioned in current chapter"
          : `${mentionCount} mentions in current chapter`,
    });
  }

  if (linkedToPinnedEntry) {
    reasons.push({
      key: "linked_to_pinned_entry",
      label: "Linked to pinned entry",
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      key: "included_by_default",
      label: "Included by default Codex truth",
    });
  }

  return reasons;
}

function determineNextChapterPriority(
  contextMode: StoryContextEntrySummary["contextMode"],
  reasons: StoryContextReason[]
): StoryContextPriority {
  if (contextMode === "exclude") {
    return "excluded";
  }

  if (
    reasons.some((reason) =>
      reason.key === "pinned_by_writer"
      || reason.key === "changed_this_chapter"
      || reason.key === "mentioned_this_chapter"
      || reason.key === "linked_to_pinned_entry"
    )
  ) {
    return "priority";
  }

  return "supporting";
}

function compareResolvedEntries(a: ResolvedCodexEntry, b: ResolvedCodexEntry): number {
  if (a.entryType !== b.entryType) {
    return a.entryType.localeCompare(b.entryType);
  }

  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }

  return a.name.localeCompare(b.name);
}

function compareContextEntries(
  a: StoryContextEntrySummary,
  b: StoryContextEntrySummary
): number {
  const priorityDifference =
    getStoryContextPriorityRank(a.nextChapterPriority)
    - getStoryContextPriorityRank(b.nextChapterPriority);
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const modeDifference = getContextModeRank(a.contextMode) - getContextModeRank(b.contextMode);
  if (modeDifference !== 0) {
    return modeDifference;
  }

  return a.name.localeCompare(b.name);
}

function getContextModeRank(mode: StoryContextEntrySummary["contextMode"]): number {
  switch (mode) {
    case "pin":
      return 0;
    case "default":
      return 1;
    case "exclude":
      return 2;
    default:
      return 3;
  }
}

function getStoryContextPriorityRank(
  priority: StoryContextPriority
): number {
  switch (priority) {
    case "priority":
      return 0;
    case "supporting":
      return 1;
    case "excluded":
      return 2;
    default:
      return 3;
  }
}

function formatTypeHeading(entryType: string): string {
  return CORE_TYPE_LABELS[entryType as CoreEntryType] ?? `${labelize(entryType)}s`;
}

function labelize(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const CORE_TYPE_LABELS: Record<CoreEntryType, string> = {
  character: "Characters",
  location: "Locations",
  lore: "Lore",
  object: "Objects",
  faction: "Factions",
  event: "Events",
};
