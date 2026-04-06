"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { resolveMemoryEntryAtChapter } from "../../lib/prompts/memory";
import { getModeConfig } from "../../lib/modes/registry";
import type {
  MemoryCustomType,
  MemoryEntry,
  MemoryMention,
} from "../../types/memory";
import type { ProjectMode } from "../../types/story";

interface EntryListProps {
  entries: MemoryEntry[];
  customTypes: MemoryCustomType[];
  currentChapter: number;
  currentChapterMentions: MemoryMention[];
  selectedEntryId: string | null;
  projectMode?: ProjectMode;
  contentUnitLabel?: string;
  compact?: boolean;
  scrollMode?: "internal" | "natural";
  showSummaryBadges?: boolean;
  onSelect: (entryId: string) => void;
  onCreate: () => void;
}

export default function EntryList({
  entries,
  customTypes,
  currentChapter,
  currentChapterMentions,
  selectedEntryId,
  projectMode = "fiction",
  contentUnitLabel = "Chapter",
  compact = false,
  scrollMode = "internal",
  showSummaryBadges = true,
  onSelect,
  onCreate,
}: EntryListProps) {
  const modeConfig = getModeConfig(projectMode);
  const contentUnitLabelLower = contentUnitLabel.toLowerCase();
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");
  const [showTypeFilters, setShowTypeFilters] = useState(false);

  const mentionCountByEntryId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const mention of currentChapterMentions) {
      counts.set(mention.entryId, (counts.get(mention.entryId) ?? 0) + 1);
    }

    return counts;
  }, [currentChapterMentions]);

  const availableFilters = useMemo(
    () => getTypeFilters(entries, customTypes, modeConfig.coreTypes, modeConfig.typeLabels),
    [entries, customTypes, modeConfig.coreTypes, modeConfig.typeLabels]
  );
  const groups = useMemo(
    () =>
      groupEntries(
        entries,
        customTypes,
        query,
        activeTypeFilter === "all" ? null : activeTypeFilter,
        modeConfig.coreTypes,
        modeConfig.typeLabels
      ),
    [entries, customTypes, query, activeTypeFilter, modeConfig.coreTypes, modeConfig.typeLabels]
  );

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  const totalMatches = groups.reduce((sum, group) => sum + group.entries.length, 0);
  const activeFilterLabel =
    activeTypeFilter === "all"
      ? "All fact types"
      : availableFilters.find((filter) => filter.key === activeTypeFilter)?.label
        ?? "Filtered type";

  return (
    <div
      className={
        scrollMode === "natural"
          ? "flex flex-col"
          : "flex h-full min-h-0 flex-1 flex-col"
      }
    >
      <div className="shrink-0 space-y-3 border-b border-zinc-800 px-4 py-3">
        {!compact && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Saved facts</h3>
              <p className="text-xs text-zinc-500">
                {entries.length} saved in memory
              </p>
            </div>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
        )}

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search facts..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-10 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTypeFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
              showTypeFilters || activeTypeFilter !== "all"
                ? "border-zinc-600 bg-zinc-900 text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {activeFilterLabel}
          </button>
          {activeTypeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveTypeFilter("all")}
              className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Clear filter
            </button>
          )}
        </div>

        {showTypeFilters && (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-black/20 p-2">
            <button
              type="button"
              onClick={() => setActiveTypeFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                activeTypeFilter === "all"
                  ? "border-purple-500 bg-purple-500/15 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              All
            </button>
            {availableFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveTypeFilter(filter.key)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  activeTypeFilter === filter.key
                    ? "text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
                style={{
                  borderColor:
                    activeTypeFilter === filter.key
                      ? `${filter.color}aa`
                      : `${filter.color}55`,
                  backgroundColor:
                    activeTypeFilter === filter.key
                      ? `${filter.color}22`
                      : "rgba(9, 9, 11, 0.9)",
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{filter.label}</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] text-current/80">
                    {filter.count}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {showSummaryBadges && (
          <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
            <span className="rounded-full bg-zinc-950 px-2.5 py-1">
              {totalMatches} visible
            </span>
            <span className="rounded-full bg-zinc-950 px-2.5 py-1">
              {currentChapterMentions.length} mentions in {contentUnitLabel} {currentChapter}
            </span>
          </div>
        )}
      </div>

      <div
        className={
          scrollMode === "natural"
            ? "px-2 py-2"
            : "min-h-0 flex-1 overflow-y-auto px-2 py-2"
        }
      >
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-zinc-500">
            <BookOpen className="mb-2 h-5 w-5" />
            <p className="text-sm text-zinc-300">
              {query ? "No matching facts" : "No facts yet"}
            </p>
            <p className="mt-1 text-xs">
              {query
                ? "Try a different search term."
                : `Start writing your first ${contentUnitLabelLower} and facts will appear here, or add one manually.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const isCollapsed = !query && collapsedGroups.includes(group.key);

              return (
                <div key={group.key} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-1 text-left transition-colors hover:bg-zinc-950/70"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {group.label}
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
                      {group.entries.length}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-1">
                      {group.entries.map((entry) => {
                        const resolved = resolveMemoryEntryAtChapter(entry, currentChapter);
                        const changedThisChapter = Object.values(
                          resolved.changedFields
                        ).some(
                          (chapterNumber) => chapterNumber === currentChapter
                        );
                        const role = resolved.customFieldMap.role;
                        const mentionCount = mentionCountByEntryId.get(entry.id) ?? 0;
                        const subtitle =
                          role ||
                          resolved.description ||
                          (resolved.aliases.length > 0
                            ? `Also known as ${resolved.aliases.slice(0, 2).join(", ")}`
                            : "No description yet");
                        const entryMeta = [
                          mentionCount > 0
                            ? `${mentionCount} mention${mentionCount === 1 ? "" : "s"} this ${contentUnitLabelLower}`
                            : null,
                          changedThisChapter
                            ? `Updated in ${contentUnitLabel} ${currentChapter}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" | ");

                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => onSelect(entry.id)}
                            className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                              selectedEntryId === entry.id
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-zinc-900 bg-zinc-950 hover:border-zinc-700"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      resolved.color ?? getTypeColor(entry.entryType, customTypes),
                                  }}
                                />
                                <p className="truncate text-sm font-medium text-white">
                                  {resolved.name}
                                </p>
                              </div>
                              <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-500">
                                {subtitle}
                              </p>
                              {entryMeta && (
                                <p className="mt-2 text-[11px] text-zinc-400">
                                  {entryMeta}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function groupEntries(
  entries: MemoryEntry[],
  customTypes: MemoryCustomType[],
  query: string,
  typeFilter: string | null,
  coreTypes: string[],
  typeLabels: Record<string, string>
) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEntries =
    normalizedQuery.length === 0
      ? entries
      : entries.filter((entry) => matchesEntry(entry, normalizedQuery));
  const typeFilteredEntries =
    typeFilter === null
      ? filteredEntries
      : filteredEntries.filter((entry) => entry.entryType === typeFilter);

  const groups = new Map<string, MemoryEntry[]>();

  for (const entry of typeFilteredEntries) {
    const current = groups.get(entry.entryType) ?? [];
    current.push(entry);
    groups.set(entry.entryType, current);
  }

  const coreTypeSet = new Set(coreTypes);
  const orderedKeys = [
    ...coreTypes.filter((type) => groups.has(type)),
    ...customTypes
      .map((customType) => customType.name)
      .filter((type) => groups.has(type)),
    ...Array.from(groups.keys())
      .filter(
        (type) =>
          !coreTypeSet.has(type) &&
          !customTypes.some((customType) => customType.name === type)
      )
      .sort((a, b) => a.localeCompare(b)),
  ];

  return orderedKeys.map((key) => ({
    key,
    label: typeLabels[key] ?? `${labelize(key)}s`,
    entries: (groups.get(key) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    ),
  }));
}

function getTypeFilters(
  entries: MemoryEntry[],
  customTypes: MemoryCustomType[],
  coreTypes: string[],
  typeLabels: Record<string, string>
) {
  const entryTypeSet = new Set(entries.map((entry) => entry.entryType));
  const countsByType = new Map<string, number>();

  for (const entry of entries) {
    countsByType.set(entry.entryType, (countsByType.get(entry.entryType) ?? 0) + 1);
  }

  const coreTypeSet = new Set(coreTypes);
  return [
    ...coreTypes.filter((type) => entryTypeSet.has(type)).map((type) => ({
      key: type,
      label: typeLabels[type] ?? labelize(type),
      color: getTypeColor(type, customTypes),
      count: countsByType.get(type) ?? 0,
    })),
    ...customTypes
      .filter((customType) => entryTypeSet.has(customType.name))
      .map((customType) => ({
        key: customType.name,
        label: labelize(customType.name),
        color: customType.color,
        count: countsByType.get(customType.name) ?? 0,
      })),
    ...Array.from(entryTypeSet)
      .filter(
        (entryType) =>
          !coreTypeSet.has(entryType) &&
          !customTypes.some((customType) => customType.name === entryType)
      )
      .sort((a, b) => a.localeCompare(b))
      .map((entryType) => ({
        key: entryType,
        label: labelize(entryType),
        color: getTypeColor(entryType, customTypes),
        count: countsByType.get(entryType) ?? 0,
      })),
  ];
}

function matchesEntry(entry: MemoryEntry, query: string): boolean {
  const searchableValues = [
    entry.name,
    entry.entryType,
    entry.description,
    ...entry.aliases,
    ...entry.tags,
    ...entry.customFields.flatMap((field) => [field.key, field.value]),
  ];

  return searchableValues.some((value) => value.toLowerCase().includes(query));
}

function labelize(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTypeColor(entryType: string, customTypes: MemoryCustomType[]): string {
  const customType = customTypes.find((type) => type.name === entryType);
  if (customType) {
    return customType.color;
  }

  switch (entryType) {
    case "character":
      return "#f97316";
    case "location":
      return "#06b6d4";
    case "lore":
      return "#8b5cf6";
    case "object":
      return "#eab308";
    case "faction":
      return "#ef4444";
    case "event":
      return "#10b981";
    default:
      return "#a855f7";
  }
}
