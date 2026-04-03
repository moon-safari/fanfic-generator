"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock3,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { resolveCodexEntryAtChapter } from "../../lib/prompts/codex";
import type {
  CodexChangeSuggestion,
  CodexEntry,
  CodexRelationship,
  CreateEntrySuggestionPayload,
  CreateProgressionSuggestionPayload,
  CreateRelationshipSuggestionPayload,
  FlagStaleEntrySuggestionPayload,
  ResolvedCodexEntry,
  UpdateEntryAliasesSuggestionPayload,
} from "../../types/codex";

interface SuggestionListProps {
  currentChapter: number;
  currentChapterId?: string;
  suggestions: CodexChangeSuggestion[];
  entries: CodexEntry[];
  relationships: CodexRelationship[];
  loading: boolean;
  detecting: boolean;
  processingId: string | null;
  onGenerate: (chapterId: string) => Promise<void>;
  onAccept: (suggestionId: string) => Promise<CodexChangeSuggestion>;
  onReject: (suggestionId: string) => Promise<CodexChangeSuggestion>;
  onOpenEntry?: (entryId: string) => void;
}

interface BulkActionState {
  mode: "accept" | "reject";
  done: number;
  total: number;
}

interface ActionNotice {
  tone: "success" | "warning";
  message: string;
}

export default function SuggestionList({
  currentChapter,
  currentChapterId,
  suggestions,
  entries,
  relationships,
  loading,
  detecting,
  processingId,
  onGenerate,
  onAccept,
  onReject,
  onOpenEntry,
}: SuggestionListProps) {
  const [bulkAction, setBulkAction] = useState<BulkActionState | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [showHandledSuggestions, setShowHandledSuggestions] = useState(false);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.status === "pending"),
    [suggestions]
  );
  const handledSuggestions = useMemo(
    () =>
      suggestions
        .filter((suggestion) => suggestion.status !== "pending")
        .slice(0, 8),
    [suggestions]
  );
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );
  const entriesByName = useMemo(() => {
    const map = new Map<string, CodexEntry>();

    for (const entry of entries) {
      map.set(entry.name.trim().toLowerCase(), entry);
      for (const alias of entry.aliases) {
        map.set(alias.trim().toLowerCase(), entry);
      }
    }

    return map;
  }, [entries]);
  const bulkBusy = bulkAction !== null;

  const handleBulkAction = async (mode: "accept" | "reject") => {
    if (pendingSuggestions.length === 0) {
      return;
    }

    setActionNotice(null);
    setBulkAction({ mode, done: 0, total: pendingSuggestions.length });

    let completed = 0;

    try {
      for (const suggestion of pendingSuggestions) {
        if (mode === "accept") {
          await onAccept(suggestion.id);
        } else {
          await onReject(suggestion.id);
        }

        completed += 1;
        setBulkAction({
          mode,
          done: completed,
          total: pendingSuggestions.length,
        });
      }

      setActionNotice({
        tone: mode === "accept" ? "success" : "warning",
        message:
          mode === "accept"
            ? `Accepted ${completed} memory update${completed === 1 ? "" : "s"}.`
            : `Rejected ${completed} memory update${completed === 1 ? "" : "s"}.`,
      });
    } finally {
      setBulkAction(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Updates</h3>
            <p className="text-xs text-zinc-500">
              Review suggested memory changes for Chapter {currentChapter}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!currentChapterId) {
                return;
              }

              void onGenerate(currentChapterId);
            }}
            disabled={!currentChapterId || detecting || bulkBusy}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${detecting ? "animate-spin" : ""}`} />
            {detecting ? "Detecting..." : "Detect changes"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-zinc-900/70"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {actionNotice && (
              <div
                className={`rounded-3xl border px-4 py-3 text-sm ${
                  actionNotice.tone === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-100"
                }`}
              >
                {actionNotice.message}
              </div>
            )}

            {pendingSuggestions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 px-5 py-6 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-purple-300" />
                <h4 className="mt-3 text-sm font-semibold text-white">
                  No pending memory updates
                </h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {currentChapterId
                    ? "Run detection to look for new facts, links, and chapter-aware state changes."
                    : "Change detection becomes available after the chapter is saved."}
                </p>
              </div>
            ) : (
              <section className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Pending review
                    </h4>
                    <p className="text-xs text-zinc-500">
                      AI suggests, writer confirms.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                      {pendingSuggestions.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void handleBulkAction("accept");
                      }}
                      disabled={bulkBusy || detecting || pendingSuggestions.length === 0}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {bulkAction?.mode === "accept"
                        ? `Accepting ${bulkAction.done}/${bulkAction.total}`
                        : "Accept all"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleBulkAction("reject");
                      }}
                      disabled={bulkBusy || detecting || pendingSuggestions.length === 0}
                      className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="h-3.5 w-3.5" />
                      {bulkAction?.mode === "reject"
                        ? `Rejecting ${bulkAction.done}/${bulkAction.total}`
                        : "Reject all"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      entriesById={entriesById}
                      entriesByName={entriesByName}
                      relationships={relationships}
                      processing={bulkBusy || processingId === suggestion.id}
                      onAccept={onAccept}
                      onReject={onReject}
                      onOpenEntry={onOpenEntry}
                    />
                  ))}
                </div>
              </section>
            )}

            {handledSuggestions.length > 0 && (
              <section className="space-y-3 border-t border-zinc-900 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-zinc-500" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Recent activity
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Older accepted or rejected suggestions.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHandledSuggestions((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    {showHandledSuggestions ? "Hide" : `Show ${handledSuggestions.length}`}
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        showHandledSuggestions ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>

                {showHandledSuggestions && (
                  <div className="space-y-3">
                    {handledSuggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        entriesById={entriesById}
                        entriesByName={entriesByName}
                        relationships={relationships}
                        processing={false}
                        readonly
                        onAccept={onAccept}
                        onReject={onReject}
                        onOpenEntry={onOpenEntry}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: CodexChangeSuggestion;
  entriesById: Map<string, CodexEntry>;
  entriesByName: Map<string, CodexEntry>;
  relationships: CodexRelationship[];
  processing: boolean;
  readonly?: boolean;
  onAccept: (suggestionId: string) => Promise<CodexChangeSuggestion>;
  onReject: (suggestionId: string) => Promise<CodexChangeSuggestion>;
  onOpenEntry?: (entryId: string) => void;
}

function SuggestionCard({
  suggestion,
  entriesById,
  entriesByName,
  relationships,
  processing,
  readonly = false,
  onAccept,
  onReject,
  onOpenEntry,
}: SuggestionCardProps) {
  const title = getSuggestionTitle(suggestion);
  const summary = getSuggestionSummary(suggestion);
  const openEntryId = getSuggestionOpenEntryId(suggestion);

  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
            suggestion.status
          )}`}
        >
          {labelStatus(suggestion.status)}
        </span>
        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
          {labelChangeType(suggestion.changeType)}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] ${getConfidenceClasses(
            suggestion.confidence
          )}`}
        >
          {suggestion.confidence} confidence
        </span>
        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-400">
          Ch. {suggestion.chapterNumber}
        </span>
      </div>

      <h5 className="mt-3 text-sm font-semibold text-white">{title}</h5>
      <p className="mt-2 break-words text-sm leading-6 text-zinc-300">
        {summary}
      </p>

      <SuggestionPreview
        suggestion={suggestion}
        entriesById={entriesById}
        entriesByName={entriesByName}
        relationships={relationships}
      />

      {suggestion.rationale && (
        <p className="mt-3 text-xs leading-5 text-zinc-400">
          Why: {suggestion.rationale}
        </p>
      )}

      {suggestion.evidenceText && (
        <div className="mt-3 rounded-2xl border border-white/6 bg-white/5 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Evidence
          </p>
          <p className="mt-1 break-words text-sm italic text-zinc-200">
            &quot;{suggestion.evidenceText}&quot;
          </p>
        </div>
      )}

      {!readonly && suggestion.status === "pending" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void onAccept(suggestion.id);
            }}
            disabled={processing}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {processing ? "Applying..." : "Accept"}
          </button>
          {onOpenEntry && (
            <button
              type="button"
              onClick={() => {
                void onAccept(suggestion.id).then((acceptedSuggestion) => {
                  if (acceptedSuggestion.targetEntryId) {
                    onOpenEntry(acceptedSuggestion.targetEntryId);
                  }
                });
              }}
              disabled={processing}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-700 px-3 py-2 text-sm text-emerald-200 transition-colors hover:border-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ChevronRight className="h-4 w-4" />
              Accept & open
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              void onReject(suggestion.id);
            }}
            disabled={processing}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
          {openEntryId && onOpenEntry && (
            <button
              type="button"
              onClick={() => onOpenEntry(openEntryId)}
              disabled={processing}
              className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Review current entry
            </button>
          )}
        </div>
      )}

      {readonly && openEntryId && onOpenEntry && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onOpenEntry(openEntryId)}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Open entry
          </button>
        </div>
      )}
    </article>
  );
}

interface SuggestionPreviewProps {
  suggestion: CodexChangeSuggestion;
  entriesById: Map<string, CodexEntry>;
  entriesByName: Map<string, CodexEntry>;
  relationships: CodexRelationship[];
}

function SuggestionPreview({
  suggestion,
  entriesById,
  entriesByName,
  relationships,
}: SuggestionPreviewProps) {
  switch (suggestion.changeType) {
    case "create_entry":
      return (
        <CreateEntryPreview
          payload={suggestion.payload as CreateEntrySuggestionPayload}
        />
      );
    case "update_entry_aliases":
      return (
        <AliasUpdatePreview
          payload={suggestion.payload as UpdateEntryAliasesSuggestionPayload}
          entry={entriesById.get(
            (suggestion.payload as UpdateEntryAliasesSuggestionPayload).entryId
          )}
        />
      );
    case "create_relationship":
      return (
        <RelationshipPreview
          payload={suggestion.payload as CreateRelationshipSuggestionPayload}
          entriesById={entriesById}
          entriesByName={entriesByName}
          relationships={relationships}
        />
      );
    case "create_progression":
      return (
        <ProgressionPreview
          payload={suggestion.payload as CreateProgressionSuggestionPayload}
          entry={entriesById.get(
            (suggestion.payload as CreateProgressionSuggestionPayload).entryId
          )}
        />
      );
    case "flag_stale_entry":
      return (
        <StaleEntryPreview
          payload={suggestion.payload as FlagStaleEntrySuggestionPayload}
          entry={entriesById.get(
            (suggestion.payload as FlagStaleEntrySuggestionPayload).entryId
          )}
        />
      );
    default:
      return null;
  }
}

function CreateEntryPreview({
  payload,
}: {
  payload: CreateEntrySuggestionPayload;
}) {
  const aliases = payload.aliases ?? [];
  const tags = payload.tags ?? [];
  const customFields = payload.customFields ?? [];

  return (
    <div className="mt-3 rounded-2xl border border-zinc-900 bg-black/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Preview
      </p>
      <div className="mt-2 space-y-2">
        <p className="text-sm font-medium text-white">
          {payload.name} <span className="text-zinc-500">({payload.entryType})</span>
        </p>
        {aliases.length > 0 && (
          <ChipRow label="Aliases" values={aliases} tone="zinc" />
        )}
        {tags.length > 0 && (
          <ChipRow label="Tags" values={tags} tone="blue" />
        )}
        {customFields.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {customFields.map((field) => (
              <div
                key={field.key}
                className="rounded-xl border border-zinc-900 bg-zinc-950/80 px-3 py-2"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  {field.key}
                </p>
                <p className="mt-1 text-sm text-zinc-200">
                  {field.value || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AliasUpdatePreview({
  payload,
  entry,
}: {
  payload: UpdateEntryAliasesSuggestionPayload;
  entry?: CodexEntry;
}) {
  const existingAliases = entry?.aliases ?? [];
  const mergedAliases = Array.from(new Set([...existingAliases, ...payload.aliases]));

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <PreviewColumn
        label="Before"
        body={
          existingAliases.length > 0 ? (
            <ChipList values={existingAliases} tone="zinc" />
          ) : (
            <p className="text-sm text-zinc-500">No aliases recorded yet.</p>
          )
        }
      />
      <PreviewColumn
        label="After"
        body={
          <div className="space-y-2">
            <ChipList values={mergedAliases} tone="purple" />
            <p className="text-xs text-zinc-500">
              Adds: {payload.aliases.join(", ")}
            </p>
          </div>
        }
      />
    </div>
  );
}

function RelationshipPreview({
  payload,
  entriesById,
  entriesByName,
  relationships,
}: {
  payload: CreateRelationshipSuggestionPayload;
  entriesById: Map<string, CodexEntry>;
  entriesByName: Map<string, CodexEntry>;
  relationships: CodexRelationship[];
}) {
  const sourceEntry =
    (payload.sourceEntryId ? entriesById.get(payload.sourceEntryId) : undefined)
    ?? entriesByName.get(payload.sourceEntryName.trim().toLowerCase());
  const targetEntry =
    (payload.targetEntryId ? entriesById.get(payload.targetEntryId) : undefined)
    ?? entriesByName.get(payload.targetEntryName.trim().toLowerCase());
  const existingRelationship = relationships.find((relationship) => {
    if (!sourceEntry || !targetEntry) {
      return false;
    }

    return (
      relationship.sourceEntryId === sourceEntry.id
      && relationship.targetEntryId === targetEntry.id
    );
  });

  return (
    <div className="mt-3 rounded-2xl border border-zinc-900 bg-black/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Preview
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <PreviewColumn
          label="Source"
          body={
            <PreviewEntrySummary
              title={payload.sourceEntryName}
              subtitle={getRoleLabel(sourceEntry)}
            />
          }
        />
        <PreviewColumn
          label="Target"
          body={
            <PreviewEntrySummary
              title={payload.targetEntryName}
              subtitle={getRoleLabel(targetEntry)}
            />
          }
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {payload.forwardLabel?.trim() && (
          <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs text-blue-200">
            {payload.sourceEntryName} {payload.forwardLabel.trim()} {payload.targetEntryName}
          </span>
        )}
        {payload.reverseLabel?.trim() && (
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
            {payload.targetEntryName} {payload.reverseLabel.trim()} {payload.sourceEntryName}
          </span>
        )}
        {existingRelationship && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-200">
            Similar relationship already exists
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressionPreview({
  payload,
  entry,
}: {
  payload: CreateProgressionSuggestionPayload;
  entry?: CodexEntry;
}) {
  if (!entry) {
    return (
      <div className="mt-3 rounded-2xl border border-zinc-900 bg-black/20 px-3 py-3 text-sm text-zinc-400">
        The target entry is no longer available. Review the payload before applying.
      </div>
    );
  }

  const before = resolveCodexEntryAtChapter(
    entry,
    Math.max(1, payload.chapterNumber - 1)
  );
  const after = previewProgression(before, payload);
  const changedFields = getProgressionChangedFields(payload);

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PreviewColumn
          label={`Before Ch. ${Math.max(1, payload.chapterNumber - 1)}`}
          body={<ResolvedEntryPreview entry={before} />}
        />
        <PreviewColumn
          label={`After Ch. ${payload.chapterNumber}`}
          body={<ResolvedEntryPreview entry={after} />}
        />
      </div>
      {changedFields.length > 0 && (
        <div className="rounded-2xl border border-zinc-900 bg-black/20 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Changed fields
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {changedFields.map((field) => (
              <span
                key={field}
                className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-200"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StaleEntryPreview({
  payload,
  entry,
}: {
  payload: FlagStaleEntrySuggestionPayload;
  entry?: CodexEntry;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-zinc-900 bg-black/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Manual review
      </p>
      <div className="mt-2 space-y-2">
        <p className="text-sm text-zinc-300">
          {entry?.description || payload.reason}
        </p>
        {payload.suspectedFields && payload.suspectedFields.length > 0 && (
          <ChipRow
            label="Suspected fields"
            values={payload.suspectedFields}
            tone="amber"
          />
        )}
      </div>
    </div>
  );
}

function PreviewColumn({
  label,
  body,
}: {
  label: string;
  body: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-900 bg-black/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <div className="mt-2">{body}</div>
    </div>
  );
}

function PreviewEntrySummary({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-white">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}

function ResolvedEntryPreview({ entry }: { entry: ResolvedCodexEntry }) {
  const fieldEntries = Object.entries(entry.customFieldMap).filter(
    ([key, value]) => key !== "role" && Boolean(value)
  );

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-white">
          {entry.name}{" "}
          <span className="text-zinc-500">({labelize(entry.entryType)})</span>
        </p>
        {entry.customFieldMap.role && (
          <p className="mt-1 text-xs text-zinc-500">{entry.customFieldMap.role}</p>
        )}
      </div>

      {entry.description && (
        <p className="text-sm leading-6 text-zinc-300">{entry.description}</p>
      )}

      {fieldEntries.length > 0 && (
        <div className="grid gap-2">
          {fieldEntries.map(([key, value]) => (
            <div key={key} className="flex items-start justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                {labelize(key)}
              </span>
              <span className="text-sm text-zinc-200">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipRow({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: ChipTone;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <ChipList values={values} tone={tone} />
    </div>
  );
}

type ChipTone = "zinc" | "purple" | "blue" | "amber" | "emerald";

function ChipList({
  values,
  tone,
}: {
  values: string[];
  tone: ChipTone;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className={`rounded-full px-2.5 py-1 text-xs ${getChipClasses(tone)}`}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function getSuggestionTitle(suggestion: CodexChangeSuggestion): string {
  switch (suggestion.changeType) {
    case "create_entry": {
      const payload = suggestion.payload as CreateEntrySuggestionPayload;
      return `Add ${labelize(payload.entryType)} fact: ${payload.name}`;
    }
    case "update_entry_aliases": {
      const payload = suggestion.payload as UpdateEntryAliasesSuggestionPayload;
      return `Add aliases for ${payload.entryName}`;
    }
    case "create_relationship": {
      const payload = suggestion.payload as CreateRelationshipSuggestionPayload;
      return `Link ${payload.sourceEntryName} and ${payload.targetEntryName}`;
    }
    case "create_progression": {
      const payload = suggestion.payload as CreateProgressionSuggestionPayload;
      return `Update Chapter ${payload.chapterNumber} truth for ${payload.entryName}`;
    }
    case "flag_stale_entry": {
      const payload = suggestion.payload as FlagStaleEntrySuggestionPayload;
      return `Review ${payload.entryName} for outdated memory`;
    }
    default:
      return "Review memory update";
  }
}

function getSuggestionSummary(suggestion: CodexChangeSuggestion): string {
  switch (suggestion.changeType) {
    case "create_entry": {
      const payload = suggestion.payload as CreateEntrySuggestionPayload;
      return payload.description || "Add a new story fact suggested from the chapter.";
    }
    case "update_entry_aliases": {
      const payload = suggestion.payload as UpdateEntryAliasesSuggestionPayload;
      return `Suggested aliases: ${payload.aliases.join(", ")}.`;
    }
    case "create_relationship": {
      const payload = suggestion.payload as CreateRelationshipSuggestionPayload;
      const forward = payload.forwardLabel?.trim();
      if (forward) {
        return `${payload.sourceEntryName} ${forward} ${payload.targetEntryName}.`;
      }
      return `Create a relationship between ${payload.sourceEntryName} and ${payload.targetEntryName}.`;
    }
    case "create_progression": {
      const payload = suggestion.payload as CreateProgressionSuggestionPayload;
      return payload.descriptionOverride?.trim()
        || payload.notes?.trim()
        || "Apply a chapter-aware state change to this entry.";
    }
    case "flag_stale_entry": {
      const payload = suggestion.payload as FlagStaleEntrySuggestionPayload;
      return payload.reason;
    }
    default:
      return "Review this memory update before it changes future writing.";
  }
}

function getSuggestionOpenEntryId(suggestion: CodexChangeSuggestion): string | null {
  if (suggestion.targetEntryId) {
    return suggestion.targetEntryId;
  }

  switch (suggestion.changeType) {
    case "update_entry_aliases":
      return (suggestion.payload as UpdateEntryAliasesSuggestionPayload).entryId;
    case "create_progression":
      return (suggestion.payload as CreateProgressionSuggestionPayload).entryId;
    case "flag_stale_entry":
      return (suggestion.payload as FlagStaleEntrySuggestionPayload).entryId;
    default:
      return null;
  }
}

function previewProgression(
  baseEntry: ResolvedCodexEntry,
  payload: CreateProgressionSuggestionPayload
): ResolvedCodexEntry {
  const fieldOverrides = payload.fieldOverrides ?? {};
  const nextFieldMap = { ...baseEntry.customFieldMap, ...fieldOverrides };

  return {
    ...baseEntry,
    description: payload.descriptionOverride ?? baseEntry.description,
    customFieldMap: nextFieldMap,
    customFields: Object.entries(nextFieldMap)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({ key, value })),
  };
}

function getProgressionChangedFields(
  payload: CreateProgressionSuggestionPayload
): string[] {
  const changed = new Set<string>();

  if (payload.descriptionOverride?.trim()) {
    changed.add("description");
  }

  for (const key of Object.keys(payload.fieldOverrides ?? {})) {
    changed.add(labelize(key));
  }

  if (payload.notes?.trim()) {
    changed.add("notes");
  }

  return [...changed];
}

function getRoleLabel(entry?: CodexEntry): string | undefined {
  if (!entry) {
    return undefined;
  }

  const roleField = entry.customFields.find((field) => field.key === "role");
  return roleField?.value || labelize(entry.entryType);
}

function getChipClasses(tone: ChipTone): string {
  switch (tone) {
    case "purple":
      return "bg-purple-500/15 text-purple-200";
    case "blue":
      return "bg-blue-500/15 text-blue-200";
    case "amber":
      return "bg-amber-500/15 text-amber-200";
    case "emerald":
      return "bg-emerald-500/15 text-emerald-200";
    case "zinc":
    default:
      return "bg-zinc-900 text-zinc-300";
  }
}

function labelStatus(status: CodexChangeSuggestion["status"]): string {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "applied":
      return "Applied";
    case "rejected":
      return "Rejected";
    case "pending":
    default:
      return "Pending";
  }
}

function labelChangeType(changeType: CodexChangeSuggestion["changeType"]): string {
  switch (changeType) {
    case "create_entry":
      return "New fact";
    case "update_entry_aliases":
      return "Alias update";
    case "create_relationship":
      return "Relationship";
    case "create_progression":
      return "Progression";
    case "flag_stale_entry":
      return "Stale review";
    default:
      return "Suggestion";
  }
}

function getStatusClasses(status: CodexChangeSuggestion["status"]): string {
  switch (status) {
    case "accepted":
    case "applied":
      return "bg-emerald-500/15 text-emerald-200";
    case "rejected":
      return "bg-zinc-800 text-zinc-300";
    case "pending":
    default:
      return "bg-purple-500/15 text-purple-200";
  }
}

function getConfidenceClasses(
  confidence: CodexChangeSuggestion["confidence"]
): string {
  switch (confidence) {
    case "high":
      return "bg-emerald-500/15 text-emerald-200";
    case "low":
      return "bg-amber-500/15 text-amber-200";
    case "medium":
    default:
      return "bg-zinc-900 text-zinc-300";
  }
}

function labelize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
