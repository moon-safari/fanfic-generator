export type CoreEntryType =
  | "character"
  | "location"
  | "lore"
  | "object"
  | "faction"
  | "event";

export interface MemoryCustomField {
  key: string;
  value: string;
}

export interface MemorySuggestedField {
  key: string;
  placeholder: string;
}

export interface MemoryProgression {
  id: string;
  entryId: string;
  chapterNumber: number;
  fieldOverrides: Record<string, string>;
  descriptionOverride?: string;
  notes?: string;
  createdAt: string;
}

export interface MemoryEntry {
  id: string;
  storyId: string;
  name: string;
  entryType: CoreEntryType | string;
  description: string;
  tags: string[];
  aliases: string[];
  imageUrl?: string;
  color?: string;
  customFields: MemoryCustomField[];
  sortOrder: number;
  progressions: MemoryProgression[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryRelationship {
  id: string;
  storyId: string;
  sourceEntryId: string;
  targetEntryId: string;
  forwardLabel: string;
  reverseLabel: string;
  createdAt: string;
}

export interface MemoryCustomType {
  id: string;
  storyId: string;
  name: string;
  color: string;
  icon: string;
  suggestedFields: MemorySuggestedField[];
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  entries: MemoryEntry[];
  relationships: MemoryRelationship[];
  customTypes: MemoryCustomType[];
}

export interface MemoryMention {
  id: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  entryId: string;
  matchedText: string;
  matchedAlias?: string;
  startIndex: number;
  endIndex: number;
  createdAt: string;
}

export type MemoryContextRuleMode = "pin" | "exclude";

export type MemoryContextMode = MemoryContextRuleMode | "default";

export interface MemoryContextRule {
  id: string;
  storyId: string;
  entryId: string;
  mode: MemoryContextRuleMode;
  createdAt: string;
  updatedAt: string;
}

export type MemorySuggestionConfidence = "low" | "medium" | "high";

export type MemorySuggestionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "applied";

export type MemoryChangeType =
  | "create_entry"
  | "update_entry_aliases"
  | "create_relationship"
  | "create_progression"
  | "flag_stale_entry";

export type CreateEntrySuggestionPayload = CreateMemoryEntryInput;

export interface UpdateEntryAliasesSuggestionPayload {
  entryId: string;
  entryName: string;
  aliases: string[];
}

export interface CreateRelationshipSuggestionPayload {
  sourceEntryName: string;
  sourceEntryId?: string;
  targetEntryName: string;
  targetEntryId?: string;
  forwardLabel?: string;
  reverseLabel?: string;
}

export interface CreateProgressionSuggestionPayload
  extends CreateMemoryProgressionInput {
  entryId: string;
  entryName: string;
}

export interface FlagStaleEntrySuggestionPayload {
  entryId: string;
  entryName: string;
  reason: string;
  suspectedFields?: string[];
}

export type MemoryChangeSuggestionPayload =
  | CreateEntrySuggestionPayload
  | UpdateEntryAliasesSuggestionPayload
  | CreateRelationshipSuggestionPayload
  | CreateProgressionSuggestionPayload
  | FlagStaleEntrySuggestionPayload;

export interface MemoryChangeSuggestion {
  id: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  targetEntryId?: string;
  changeType: MemoryChangeType;
  payload: MemoryChangeSuggestionPayload;
  evidenceText?: string;
  rationale?: string;
  confidence: MemorySuggestionConfidence;
  status: MemorySuggestionStatus;
  createdAt: string;
  reviewedAt?: string;
  appliedAt?: string;
}

export interface GeneratedCreateEntrySuggestion {
  name: string;
  entryType: CoreEntryType | string;
  description: string;
  aliases?: string[];
  tags?: string[];
  customFields?: MemoryCustomField[];
  evidenceText?: string;
  rationale?: string;
  confidence?: MemorySuggestionConfidence;
}

export interface GeneratedAliasSuggestion {
  entryName: string;
  aliases: string[];
  evidenceText?: string;
  rationale?: string;
  confidence?: MemorySuggestionConfidence;
}

export interface GeneratedRelationshipSuggestion {
  sourceName: string;
  targetName: string;
  forwardLabel?: string;
  reverseLabel?: string;
  evidenceText?: string;
  rationale?: string;
  confidence?: MemorySuggestionConfidence;
}

export interface GeneratedProgressionSuggestion {
  entryName: string;
  descriptionOverride?: string | null;
  fieldOverrides?: Record<string, string>;
  notes?: string | null;
  evidenceText?: string;
  rationale?: string;
  confidence?: MemorySuggestionConfidence;
}

export interface GeneratedStaleEntrySuggestion {
  entryName: string;
  reason: string;
  suspectedFields?: string[];
  evidenceText?: string;
  rationale?: string;
  confidence?: MemorySuggestionConfidence;
}

export interface MemorySuggestionGenerationResponse {
  createEntries?: GeneratedCreateEntrySuggestion[];
  updateAliases?: GeneratedAliasSuggestion[];
  createRelationships?: GeneratedRelationshipSuggestion[];
  createProgressions?: GeneratedProgressionSuggestion[];
  flagStaleEntries?: GeneratedStaleEntrySuggestion[];
}

export interface ResolvedMemoryEntry {
  id: string;
  storyId: string;
  name: string;
  entryType: CoreEntryType | string;
  description: string;
  tags: string[];
  aliases: string[];
  imageUrl?: string;
  color?: string;
  customFields: MemoryCustomField[];
  customFieldMap: Record<string, string>;
  changedFields: Record<string, number>;
  sortOrder: number;
}

export type StoryContextSource = "memory" | "story_bible" | "none";

export type StoryContextReasonKey =
  | "pinned_by_writer"
  | "excluded_by_writer"
  | "changed_this_chapter"
  | "mentioned_this_chapter"
  | "linked_to_pinned_entry"
  | "included_by_default";

export type StoryContextPriority = "priority" | "supporting" | "excluded";

export interface StoryContextReason {
  key: StoryContextReasonKey;
  label: string;
}

export interface StoryContextEntrySummary {
  id: string;
  name: string;
  entryType: CoreEntryType | string;
  description: string;
  role?: string;
  aliasCount: number;
  mentionCount: number;
  relationshipCount: number;
  changedThisChapter: boolean;
  contextMode: MemoryContextMode;
  includedInPrompt: boolean;
  nextChapterPriority: StoryContextPriority;
  reasons: StoryContextReason[];
}

export interface StoryContextGroup {
  key: string;
  label: string;
  count: number;
  entries: StoryContextEntrySummary[];
}

export interface StoryContextSnapshot {
  source: StoryContextSource;
  resolvedThroughChapter: number;
  generationChapter: number;
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

export interface MemoryGenerateEntryInput {
  name: string;
  type: CoreEntryType;
  description: string;
  aliases?: string[];
  tags?: string[];
  fields?: Record<string, string>;
}

export interface MemoryGenerateRelationshipInput {
  source: string;
  target: string;
  forwardLabel: string;
  reverseLabel: string;
}

export interface CreateMemoryEntryInput {
  name: string;
  entryType: CoreEntryType | string;
  description?: string;
  tags?: string[];
  aliases?: string[];
  imageUrl?: string | null;
  color?: string | null;
  customFields?: MemoryCustomField[];
  sortOrder?: number;
}

export interface UpdateMemoryEntryInput {
  name?: string;
  entryType?: CoreEntryType | string;
  description?: string;
  tags?: string[];
  aliases?: string[];
  imageUrl?: string | null;
  color?: string | null;
  customFields?: MemoryCustomField[];
  sortOrder?: number;
}

export interface CreateMemoryRelationshipInput {
  sourceEntryId: string;
  targetEntryId: string;
  forwardLabel?: string;
  reverseLabel?: string;
}

export interface CreateMemoryProgressionInput {
  chapterNumber: number;
  fieldOverrides?: Record<string, string>;
  descriptionOverride?: string | null;
  notes?: string | null;
}

export interface UpdateMemoryProgressionInput {
  chapterNumber?: number;
  fieldOverrides?: Record<string, string>;
  descriptionOverride?: string | null;
  notes?: string | null;
}

export interface CreateMemoryCustomTypeInput {
  name: string;
  color?: string;
  icon?: string;
  suggestedFields?: MemorySuggestedField[];
}
