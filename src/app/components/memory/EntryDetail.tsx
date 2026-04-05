"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Link2, Sparkles } from "lucide-react";
import { useMemoryMentions } from "../../hooks/useMemoryMentions";
import { resolveMemoryEntryAtChapter } from "../../lib/prompts/memory";
import type {
  MemoryCustomType,
  MemoryEntry,
  MemoryMention,
  MemoryRelationship,
  CreateMemoryEntryInput,
  UpdateMemoryEntryInput,
} from "../../types/memory";
import EntryForm from "./EntryForm";
import ProgressionEditor from "./ProgressionEditor";
import RelationshipEditor from "./RelationshipEditor";

interface EntryDetailProps {
  storyId: string;
  entry: MemoryEntry;
  entries: MemoryEntry[];
  relationships: MemoryRelationship[];
  customTypes: MemoryCustomType[];
  currentChapter: number;
  currentChapterMentions: MemoryMention[];
  saving?: boolean;
  onSelectEntry: (entryId: string) => void;
  onSave: (updates: CreateMemoryEntryInput | UpdateMemoryEntryInput) => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateRelationship: (input: {
    sourceEntryId: string;
    targetEntryId: string;
    forwardLabel?: string;
    reverseLabel?: string;
  }) => Promise<void>;
  onDeleteRelationship: (relationshipId: string) => Promise<void>;
  onCreateProgression: (input: {
    chapterNumber: number;
    fieldOverrides?: Record<string, string>;
    descriptionOverride?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onUpdateProgression: (
    progressionId: string,
    input: {
      chapterNumber?: number;
      fieldOverrides?: Record<string, string>;
      descriptionOverride?: string | null;
      notes?: string | null;
    }
  ) => Promise<void>;
  onDeleteProgression: (progressionId: string) => Promise<void>;
}

export default function EntryDetail({
  storyId,
  entry,
  entries,
  relationships,
  customTypes,
  currentChapter,
  currentChapterMentions,
  saving = false,
  onSelectEntry,
  onSave,
  onDelete,
  onCreateRelationship,
  onDeleteRelationship,
  onCreateProgression,
  onUpdateProgression,
  onDeleteProgression,
}: EntryDetailProps) {
  const [showFactDetails, setShowFactDetails] = useState(false);
  const [showMentionTrail, setShowMentionTrail] = useState(false);
  const [showAdvancedSections, setShowAdvancedSections] = useState(false);
  const { mentions: storyMentions, loading: mentionLoading, error: mentionError } =
    useMemoryMentions({
      storyId,
      entryId: entry.id,
    });

  const resolved = useMemo(
    () => resolveMemoryEntryAtChapter(entry, currentChapter),
    [currentChapter, entry]
  );

  const changedLabels = useMemo(
    () =>
      Object.entries(resolved.changedFields)
        .sort((a, b) => a[1] - b[1])
        .map(([field, chapterNumber]) => ({
          field,
          chapterNumber,
        })),
    [resolved.changedFields]
  );

  const currentChapterMatches = useMemo(
    () => currentChapterMentions.filter((mention) => mention.entryId === entry.id),
    [currentChapterMentions, entry.id]
  );

  const mentionSummary = useMemo(() => {
    const chapterCounts = new Map<number, number>();

    for (const mention of storyMentions) {
      chapterCounts.set(
        mention.chapterNumber,
        (chapterCounts.get(mention.chapterNumber) ?? 0) + 1
      );
    }

    return {
      totalMentions: storyMentions.length,
      chapterCounts: Array.from(chapterCounts.entries()).sort((a, b) => a[0] - b[0]),
      totalChapters: chapterCounts.size,
    };
  }, [storyMentions]);

  const linkedEntries = useMemo(() => {
    const links: Array<{
      relationshipId: string;
      entryId: string;
      label: string;
      name: string;
    }> = [];

    for (const relationship of relationships) {
      if (relationship.sourceEntryId === entry.id) {
        const linked = entries.find(
          (candidate) => candidate.id === relationship.targetEntryId
        );
        if (linked) {
          links.push({
            relationshipId: relationship.id,
            entryId: linked.id,
            label: relationship.forwardLabel || "related to",
            name: linked.name,
          });
        }
      } else if (relationship.targetEntryId === entry.id) {
        const linked = entries.find(
          (candidate) => candidate.id === relationship.sourceEntryId
        );
        if (linked) {
          links.push({
            relationshipId: relationship.id,
            entryId: linked.id,
            label: relationship.reverseLabel || "related to",
            name: linked.name,
          });
        }
      }
    }

    return links;
  }, [entries, entry.id, relationships]);

  const hasFactDetails =
    resolved.aliases.length > 0
    || resolved.customFields.length > 0
    || changedLabels.length > 0
    || linkedEntries.length > 0;

  return (
    <div className="space-y-5 px-4 py-4">
      <div className="rounded-3xl border border-purple-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.16),_rgba(24,24,27,0.9)_55%)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300/80">
              Chapter {currentChapter} truth
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">{resolved.name}</h3>
            <p className="mt-1 text-sm text-zinc-300">{resolved.entryType}</p>
          </div>
          <Sparkles className="h-5 w-5 text-purple-300" />
        </div>

        {resolved.description && (
          <p className="mt-3 break-words text-sm leading-6 text-zinc-200">
            {resolved.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-zinc-200">
            {currentChapterMatches.length} mentions in Ch. {currentChapter}
          </span>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-zinc-200">
            {mentionSummary.totalMentions} across {mentionSummary.totalChapters} chapter
            {mentionSummary.totalChapters === 1 ? "" : "s"}
          </span>
        </div>

        {hasFactDetails && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowFactDetails((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
            >
              {showFactDetails ? "Hide fact details" : "More fact details"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showFactDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showFactDetails && (
              <div className="mt-3 space-y-3">
            {resolved.aliases.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resolved.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-zinc-200"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            )}

            {linkedEntries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {linkedEntries.map((linkedEntry) => (
                  <button
                    key={`${linkedEntry.relationshipId}-${linkedEntry.entryId}`}
                    type="button"
                    onClick={() => onSelectEntry(linkedEntry.entryId)}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-left text-xs text-zinc-100 transition-colors hover:border-purple-400/50 hover:text-white"
                  >
                    <Link2 className="h-3 w-3" />
                    <span className="truncate">
                      {linkedEntry.label} {linkedEntry.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {resolved.customFields.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {resolved.customFields.map((field) => (
                  <div
                    key={field.key}
                    className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                      {labelize(field.key)}
                    </p>
                    <p className="mt-1 break-words text-sm text-white">
                      {field.value}
                    </p>
                    {resolved.changedFields[field.key] && (
                      <p className="mt-1 text-[11px] text-emerald-300">
                        Changed in Ch. {resolved.changedFields[field.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {changedLabels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {changedLabels.map((item) => (
                  <span
                    key={`${item.field}-${item.chapterNumber}`}
                    className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300"
                  >
                    {labelize(item.field)} updated in Ch. {item.chapterNumber}
                  </span>
                ))}
              </div>
            )}
              </div>
            )}
          </div>
        )}
      </div>

      <section className="space-y-3 rounded-3xl border border-zinc-900 bg-zinc-950/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Mentions</h4>
            <p className="text-xs text-zinc-500">
              Where this fact shows up in the manuscript.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMentionTrail((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {showMentionTrail ? "Hide trail" : "Open trail"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showMentionTrail ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            {currentChapterMatches.length} in this chapter
          </span>
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            {mentionSummary.totalMentions} total mentions
          </span>
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            {mentionSummary.totalChapters} chapter
            {mentionSummary.totalChapters === 1 ? "" : "s"}
          </span>
        </div>

        {showMentionTrail && (
          <>
            {mentionError && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                {mentionError}
              </div>
            )}

            {mentionLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-zinc-900/80"
                  />
                ))}
              </div>
            ) : (
              <>
                {currentChapterMatches.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      This chapter
                    </p>
                    {currentChapterMatches.map((mention) => (
                      <div
                        key={mention.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2.5"
                      >
                        <p className="break-words text-sm text-white">
                          {mention.matchedText}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {mention.matchedAlias
                            ? `Matched alias: ${mention.matchedAlias}`
                            : "Matched canonical name"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-800 px-3 py-3 text-xs text-zinc-500">
                    No tracked mentions for this fact in Chapter {currentChapter} yet.
                  </div>
                )}

                {mentionSummary.chapterCounts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Chapter trail
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {mentionSummary.chapterCounts.map(([chapterNumber, count]) => (
                        <span
                          key={chapterNumber}
                          className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
                        >
                          Ch. {chapterNumber} x{count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-white">Edit fact</h4>
          <p className="text-xs text-zinc-500">
            This is the main saved version of the fact.
          </p>
        </div>
        <EntryForm
          entry={entry}
          customTypes={customTypes}
          saving={saving}
          submitLabel="Save entry"
          onSubmit={onSave}
          onDelete={onDelete}
        />
      </section>

      <section className="space-y-3 border-t border-zinc-900 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Advanced</h4>
            <p className="text-xs text-zinc-500">
              Links, chapter-by-chapter changes, and deeper memory controls.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedSections((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {showAdvancedSections ? "Hide advanced" : "Open advanced"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showAdvancedSections ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {showAdvancedSections && (
          <div className="space-y-5">
            <section className="space-y-3">
              <RelationshipEditor
                entry={entry}
                entries={entries}
                relationships={relationships}
                saving={saving}
                onSelectEntry={onSelectEntry}
                onCreate={onCreateRelationship}
                onDelete={onDeleteRelationship}
              />
            </section>

            <section className="space-y-3">
              <ProgressionEditor
                entry={entry}
                currentChapter={currentChapter}
                saving={saving}
                onCreate={onCreateProgression}
                onUpdate={onUpdateProgression}
                onDelete={onDeleteProgression}
              />
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function labelize(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
