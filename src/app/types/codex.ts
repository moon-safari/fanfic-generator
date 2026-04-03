export type CoreEntryType =
  | "character"
  | "location"
  | "lore"
  | "object"
  | "faction"
  | "event";

export interface CodexCustomField {
  key: string;
  value: string;
}

export interface CodexSuggestedField {
  key: string;
  placeholder: string;
}

export interface CodexProgression {
  id: string;
  entryId: string;
  chapterNumber: number;
  fieldOverrides: Record<string, string>;
  descriptionOverride?: string;
  notes?: string;
  createdAt: string;
}

export interface CodexEntry {
  id: string;
  storyId: string;
  name: string;
  entryType: CoreEntryType | string;
  description: string;
  tags: string[];
  aliases: string[];
  imageUrl?: string;
  color?: string;
  customFields: CodexCustomField[];
  sortOrder: number;
  progressions: CodexProgression[];
  createdAt: string;
  updatedAt: string;
}

export interface CodexRelationship {
  id: string;
  storyId: string;
  sourceEntryId: string;
  targetEntryId: string;
  forwardLabel: string;
  reverseLabel: string;
  createdAt: string;
}

export interface CodexCustomType {
  id: string;
  storyId: string;
  name: string;
  color: string;
  icon: string;
  suggestedFields: CodexSuggestedField[];
  createdAt: string;
  updatedAt: string;
}

export interface Codex {
  entries: CodexEntry[];
  relationships: CodexRelationship[];
  customTypes: CodexCustomType[];
}

export interface CodexMention {
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

export type CodexContextRuleMode = "pin" | "exclude";

export type CodexContextMode = CodexContextRuleMode | "default";

export interface CodexContextRule {
  id: string;
  storyId: string;
  entryId: string;
  mode: CodexContextRuleMode;
  createdAt: string;
  updatedAt: string;
}

export type CodexSuggestionConfidence = "low" | "medium" | "high";

export type CodexSuggestionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "applied";

export type CodexChangeType =
  | "create_entry"
  | "update_entry_aliases"
  | "create_relationship"
  | "create_progression"
  | "flag_stale_entry";

export type CreateEntrySuggestionPayload = CreateCodexEntryInput;

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
  extends CreateCodexProgressionInput {
  entryId: string;
  entryName: string;
}

export interface FlagStaleEntrySuggestionPayload {
  entryId: string;
  entryName: string;
  reason: string;
  suspectedFields?: string[];
}

export type CodexChangeSuggestionPayload =
  | CreateEntrySuggestionPayload
  | UpdateEntryAliasesSuggestionPayload
  | CreateRelationshipSuggestionPayload
  | CreateProgressionSuggestionPayload
  | FlagStaleEntrySuggestionPayload;

export interface CodexChangeSuggestion {
  id: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  targetEntryId?: string;
  changeType: CodexChangeType;
  payload: CodexChangeSuggestionPayload;
  evidenceText?: string;
  rationale?: string;
  confidence: CodexSuggestionConfidence;
  status: CodexSuggestionStatus;
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
  customFields?: CodexCustomField[];
  evidenceText?: string;
  rationale?: string;
  confidence?: CodexSuggestionConfidence;
}

export interface GeneratedAliasSuggestion {
  entryName: string;
  aliases: string[];
  evidenceText?: string;
  rationale?: string;
  confidence?: CodexSuggestionConfidence;
}

export interface GeneratedRelationshipSuggestion {
  sourceName: string;
  targetName: string;
  forwardLabel?: string;
  reverseLabel?: string;
  evidenceText?: string;
  rationale?: string;
  confidence?: CodexSuggestionConfidence;
}

export interface GeneratedProgressionSuggestion {
  entryName: string;
  descriptionOverride?: string | null;
  fieldOverrides?: Record<string, string>;
  notes?: string | null;
  evidenceText?: string;
  rationale?: string;
  confidence?: CodexSuggestionConfidence;
}

export interface GeneratedStaleEntrySuggestion {
  entryName: string;
  reason: string;
  suspectedFields?: string[];
  evidenceText?: string;
  rationale?: string;
  confidence?: CodexSuggestionConfidence;
}

export interface CodexSuggestionGenerationResponse {
  createEntries?: GeneratedCreateEntrySuggestion[];
  updateAliases?: GeneratedAliasSuggestion[];
  createRelationships?: GeneratedRelationshipSuggestion[];
  createProgressions?: GeneratedProgressionSuggestion[];
  flagStaleEntries?: GeneratedStaleEntrySuggestion[];
}

export interface ResolvedCodexEntry {
  id: string;
  storyId: string;
  name: string;
  entryType: CoreEntryType | string;
  description: string;
  tags: string[];
  aliases: string[];
  imageUrl?: string;
  color?: string;
  customFields: CodexCustomField[];
  customFieldMap: Record<string, string>;
  changedFields: Record<string, number>;
  sortOrder: number;
}

export type StoryContextSource = "codex" | "story_bible" | "none";

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
  contextMode: CodexContextMode;
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

export interface CodexGenerateEntryInput {
  name: string;
  type: CoreEntryType;
  description: string;
  aliases?: string[];
  tags?: string[];
  fields?: Record<string, string>;
}

export interface CodexGenerateRelationshipInput {
  source: string;
  target: string;
  forwardLabel: string;
  reverseLabel: string;
}

export interface CreateCodexEntryInput {
  name: string;
  entryType: CoreEntryType | string;
  description?: string;
  tags?: string[];
  aliases?: string[];
  imageUrl?: string | null;
  color?: string | null;
  customFields?: CodexCustomField[];
  sortOrder?: number;
}

export interface UpdateCodexEntryInput {
  name?: string;
  entryType?: CoreEntryType | string;
  description?: string;
  tags?: string[];
  aliases?: string[];
  imageUrl?: string | null;
  color?: string | null;
  customFields?: CodexCustomField[];
  sortOrder?: number;
}

export interface CreateCodexRelationshipInput {
  sourceEntryId: string;
  targetEntryId: string;
  forwardLabel?: string;
  reverseLabel?: string;
}

export interface CreateCodexProgressionInput {
  chapterNumber: number;
  fieldOverrides?: Record<string, string>;
  descriptionOverride?: string | null;
  notes?: string | null;
}

export interface UpdateCodexProgressionInput {
  chapterNumber?: number;
  fieldOverrides?: Record<string, string>;
  descriptionOverride?: string | null;
  notes?: string | null;
}

export interface CreateCodexCustomTypeInput {
  name: string;
  color?: string;
  icon?: string;
  suggestedFields?: CodexSuggestedField[];
}
