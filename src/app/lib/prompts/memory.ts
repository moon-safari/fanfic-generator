import {
  MemoryCustomField,
  MemoryEntry,
  MemoryRelationship,
  MemoryProgression,
  CoreEntryType,
  ResolvedMemoryEntry,
} from "../../types/memory";
import type { ModeConfig } from "../modes/types";

const CORE_TYPE_LABELS: Record<CoreEntryType, string> = {
  character: "Characters",
  location: "Locations",
  lore: "Lore",
  object: "Objects",
  faction: "Factions",
  event: "Events",
};

const CORE_FIELD_ORDER: Record<CoreEntryType, string[]> = {
  character: ["role", "personality", "appearance", "voice", "age", "occupation"],
  location: ["climate", "significance", "era", "inhabitants"],
  lore: ["category", "scope"],
  object: ["owner", "origin", "significance", "status"],
  faction: ["type", "leader", "goals", "size"],
  event: ["date", "chapter", "participants", "outcome", "significance"],
};

export interface MemoryPromptOptions {
  includeEntryIds?: string[];
  pinnedEntryIds?: string[];
  priorityEntryIds?: string[];
  modeConfig?: ModeConfig;
}

export function resolveMemoryEntryAtChapter(
  entry: MemoryEntry,
  chapterNumber: number
): ResolvedMemoryEntry {
  const customFieldMap = toFieldMap(entry.customFields);
  const changedFields: Record<string, number> = {};

  const applicableProgressions = [...entry.progressions]
    .filter((progression) => progression.chapterNumber <= chapterNumber)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  let name = entry.name;
  let entryType = entry.entryType;
  let description = entry.description;
  let imageUrl = entry.imageUrl;
  let color = entry.color;

  for (const progression of applicableProgressions) {
    applyProgression(
      progression,
      {
        setName: (value) => {
          name = value;
          changedFields.name = progression.chapterNumber;
        },
        setEntryType: (value) => {
          entryType = value;
          changedFields.entryType = progression.chapterNumber;
        },
        setImageUrl: (value) => {
          imageUrl = value;
          changedFields.imageUrl = progression.chapterNumber;
        },
        setColor: (value) => {
          color = value;
          changedFields.color = progression.chapterNumber;
        },
        setDescription: (value) => {
          description = value;
          changedFields.description = progression.chapterNumber;
        },
        setCustomField: (key, value) => {
          customFieldMap[key] = value;
          changedFields[key] = progression.chapterNumber;
        },
      }
    );
  }

  return {
    id: entry.id,
    storyId: entry.storyId,
    name,
    entryType,
    description,
    tags: entry.tags,
    aliases: entry.aliases,
    imageUrl,
    color,
    customFields: fromFieldMap(customFieldMap),
    customFieldMap,
    changedFields,
    sortOrder: entry.sortOrder,
  };
}

export function formatMemoryForPrompt(
  entries: MemoryEntry[],
  relationships: MemoryRelationship[],
  chapterNumber: number,
  options: MemoryPromptOptions = {}
): string {
  const includeEntryIdSet = options.includeEntryIds
    ? new Set(options.includeEntryIds)
    : null;
  const pinnedEntryIdSet = new Set(options.pinnedEntryIds ?? []);
  const priorityEntryIdSet = new Set(options.priorityEntryIds ?? []);
  const visibleEntries = includeEntryIdSet
    ? entries.filter((entry) => includeEntryIdSet.has(entry.id))
    : entries;

  if (visibleEntries.length === 0) {
    return "";
  }

  const visibleEntryIds = new Set(visibleEntries.map((entry) => entry.id));
  const visibleRelationships = relationships.filter(
    (relationship) =>
      visibleEntryIds.has(relationship.sourceEntryId)
      && visibleEntryIds.has(relationship.targetEntryId)
  );
  const entryMap = new Map(visibleEntries.map((entry) => [entry.id, entry]));
  const resolvedEntries = visibleEntries
    .map((entry) => resolveMemoryEntryAtChapter(entry, chapterNumber))
    .sort(compareResolvedEntries);

  const resolvedById = new Map(resolvedEntries.map((entry) => [entry.id, entry]));
  const pinnedEntries = resolvedEntries.filter((entry) => pinnedEntryIdSet.has(entry.id));
  const priorityEntries = resolvedEntries.filter(
    (entry) => !pinnedEntryIdSet.has(entry.id) && priorityEntryIdSet.has(entry.id)
  );
  const groups = new Map<string, ResolvedMemoryEntry[]>();

  for (const entry of resolvedEntries) {
    if (pinnedEntryIdSet.has(entry.id) || priorityEntryIdSet.has(entry.id)) {
      continue;
    }

    const group = groups.get(entry.entryType) ?? [];
    group.push(entry);
    groups.set(entry.entryType, group);
  }

  const modeConfig = options.modeConfig;
  const sections: string[] = ["=== MEMORY ==="];

  if (pinnedEntries.length > 0) {
    sections.push("\n## Pinned For Current Writing");

    for (const entry of pinnedEntries) {
      sections.push(
        ...formatEntryBlock(entry, visibleRelationships, entryMap, resolvedById, modeConfig)
      );
    }
  }

  if (priorityEntries.length > 0) {
    sections.push("\n## Priority For Next Chapter");

    for (const entry of priorityEntries) {
      sections.push(
        ...formatEntryBlock(entry, visibleRelationships, entryMap, resolvedById, modeConfig)
      );
    }
  }

  groups.forEach((groupEntries, entryType) => {
    sections.push(`\n## ${formatTypeHeading(entryType, modeConfig)}`);

    for (const entry of groupEntries) {
      sections.push(
        ...formatEntryBlock(entry, visibleRelationships, entryMap, resolvedById, modeConfig)
      );
    }
  });

  return sections.join("\n");
}

function applyProgression(
  progression: MemoryProgression,
  handlers: {
    setName: (value: string) => void;
    setEntryType: (value: string) => void;
    setImageUrl: (value: string) => void;
    setColor: (value: string) => void;
    setDescription: (value: string) => void;
    setCustomField: (key: string, value: string) => void;
  }
) {
  for (const [key, value] of Object.entries(progression.fieldOverrides ?? {})) {
    switch (key) {
      case "name":
        handlers.setName(value);
        break;
      case "entryType":
      case "entry_type":
        handlers.setEntryType(value);
        break;
      case "imageUrl":
      case "image_url":
        handlers.setImageUrl(value);
        break;
      case "color":
        handlers.setColor(value);
        break;
      default:
        handlers.setCustomField(key, value);
        break;
    }
  }

  if (progression.descriptionOverride) {
    handlers.setDescription(progression.descriptionOverride);
  }
}

function formatEntryBlock(
  entry: ResolvedMemoryEntry,
  relationships: MemoryRelationship[],
  entryMap: Map<string, MemoryEntry>,
  resolvedById: Map<string, ResolvedMemoryEntry>,
  modeConfig?: ModeConfig
): string[] {
  const lines: string[] = [];
  const role = entry.customFieldMap.role;
  lines.push(`\n**${entry.name}**${role ? ` [${role}]` : ""}`);

  if (entry.aliases.length > 0) {
    lines.push(`- Aliases: ${entry.aliases.join(", ")}`);
  }

  if (entry.description.trim()) {
    lines.push(`- Description: ${entry.description}${formatChanged(entry.changedFields.description)}`);
  }

  const fieldKeys = orderFieldKeys(entry.entryType, Object.keys(entry.customFieldMap), modeConfig);
  for (const key of fieldKeys) {
    const value = entry.customFieldMap[key];
    if (!value || key === "role") continue;
    lines.push(`- ${labelize(key)}: ${value}${formatChanged(entry.changedFields[key])}`);
  }

  const relationshipText = formatRelationships(
    entry,
    relationships,
    entryMap,
    resolvedById
  );
  if (relationshipText.length > 0) {
    lines.push(`- Relationships: ${relationshipText.join(", ")}`);
  }

  return lines;
}

function formatRelationships(
  entry: ResolvedMemoryEntry,
  relationships: MemoryRelationship[],
  entryMap: Map<string, MemoryEntry>,
  resolvedById: Map<string, ResolvedMemoryEntry>
): string[] {
  const formatted: string[] = [];

  for (const relationship of relationships) {
    if (relationship.sourceEntryId === entry.id) {
      const target = resolvedById.get(relationship.targetEntryId)
        ?? resolveFallbackEntry(relationship.targetEntryId, entryMap);
      if (target) {
        formatted.push(
          relationship.forwardLabel.trim()
            ? `${capitalize(relationship.forwardLabel)} ${target.name}`
            : target.name
        );
      }
    } else if (relationship.targetEntryId === entry.id) {
      const source = resolvedById.get(relationship.sourceEntryId)
        ?? resolveFallbackEntry(relationship.sourceEntryId, entryMap);
      if (source) {
        formatted.push(
          relationship.reverseLabel.trim()
            ? `${capitalize(relationship.reverseLabel)} ${source.name}`
            : source.name
        );
      }
    }
  }

  return formatted;
}

function resolveFallbackEntry(
  entryId: string,
  entryMap: Map<string, MemoryEntry>
): ResolvedMemoryEntry | null {
  const entry = entryMap.get(entryId);
  return entry ? resolveMemoryEntryAtChapter(entry, Number.MAX_SAFE_INTEGER) : null;
}

function toFieldMap(fields: MemoryCustomField[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fields) {
    if (!field.key) continue;
    map[field.key] = field.value;
  }
  return map;
}

function fromFieldMap(fieldMap: Record<string, string>): MemoryCustomField[] {
  return Object.entries(fieldMap)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({ key, value }));
}

function compareResolvedEntries(a: ResolvedMemoryEntry, b: ResolvedMemoryEntry): number {
  if (a.entryType !== b.entryType) {
    return a.entryType.localeCompare(b.entryType);
  }

  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }

  return a.name.localeCompare(b.name);
}

function orderFieldKeys(entryType: string, keys: string[], modeConfig?: ModeConfig): string[] {
  const preferred = modeConfig?.fieldSuggestions[entryType] ?? CORE_FIELD_ORDER[entryType as CoreEntryType] ?? [];
  const remaining = keys.filter((key) => !preferred.includes(key)).sort();
  return [...preferred.filter((key) => keys.includes(key)), ...remaining];
}

function formatTypeHeading(entryType: string, modeConfig?: ModeConfig): string {
  if (modeConfig?.typeLabels[entryType]) {
    return modeConfig.typeLabels[entryType];
  }
  return CORE_TYPE_LABELS[entryType as CoreEntryType] ?? `${labelize(entryType)}s`;
}

function labelize(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join(" ");
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatChanged(chapterNumber?: number): string {
  return chapterNumber ? ` [changed Ch.${chapterNumber}]` : "";
}
