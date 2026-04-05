"use client";

import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useStoryContext } from "../../hooks/useStoryContext";
import type { MemoryContextMode, StoryContextReasonKey } from "../../types/memory";

interface ContextNotice {
  tone: "success" | "warning";
  message: string;
}

interface ContextConsoleProps {
  storyId: string;
  currentChapter: number;
  contentUnitLabel?: string;
  refreshKey?: number;
  notice?: ContextNotice | null;
  onDismissNotice?: () => void;
  onSelectEntry?: (entryId: string) => void;
}

export default function ContextConsole({
  storyId,
  currentChapter,
  contentUnitLabel = "chapter",
  refreshKey = 0,
  notice = null,
  onDismissNotice,
  onSelectEntry,
}: ContextConsoleProps) {
  const {
    context,
    loading,
    refreshing,
    updatingEntryId,
    error,
    refresh,
    setEntryMode,
  } = useStoryContext(storyId, currentChapter, refreshKey);
  const [showRawContext, setShowRawContext] = useState(false);
  const [actionNotice, setActionNotice] = useState<ContextNotice | null>(null);
  const visibleNotice = actionNotice ?? notice;
  const dismissNotice = () => {
    if (actionNotice) {
      setActionNotice(null);
      return;
    }

    onDismissNotice?.();
  };
  const hasNoIncludedMemoryEntries =
    context.source === "memory"
    && context.entryCount > 0
    && context.includedEntryCount === 0;
  const groupedEntryCount = useMemo(
    () => context.groups.reduce((sum, group) => sum + group.count, 0),
    [context.groups]
  );

  const handleSetEntryMode = async (
    entryId: string,
    entryName: string,
    mode: MemoryContextMode
  ) => {
    await setEntryMode(entryId, mode);
    setActionNotice(buildContextModeNotice(entryName, mode));
  };

  if (loading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-3xl bg-zinc-900/70"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-4">
        {visibleNotice && (
          <div
            className={`rounded-3xl border px-4 py-3 ${
              visibleNotice.tone === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-amber-500/30 bg-amber-500/10 text-amber-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="break-words text-sm leading-6">
                {visibleNotice.message}
              </p>
              <button
                type="button"
                onClick={dismissNotice}
                className="text-xs font-medium text-current/80 transition-colors hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <span className="break-words">{error}</span>
          </div>
        )}

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Context Console</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                This is the {contentUnitLabel}-aware story truth the system can use right now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill label="Source" value={formatSourceLabel(context.source)} />
            <StatPill
              label="Resolved"
              value={`Ch. ${context.resolvedThroughChapter}`}
            />
            <StatPill
              label={`Next ${contentUnitLabel}`}
              value={`Ch. ${context.generationChapter}`}
            />
            <StatPill label="Included" value={String(context.includedEntryCount)} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatPill label="Total entries" value={String(context.entryCount)} />
            <StatPill
              label="Priority"
              value={String(context.priorityEntryCount)}
            />
            <StatPill label="Pinned" value={String(context.pinnedEntryCount)} />
            <StatPill label="Excluded" value={String(context.excludedEntryCount)} />
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            The next {contentUnitLabel} prompt starts with pinned and priority entries, then
            the rest of the included Memory truth. Current active relationships:{" "}
            {context.relationshipCount}.
          </p>

          {context.source === "story_bible" && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
              Memory is empty for this story, so the system is falling back to the
              legacy Story Bible.
            </div>
          )}

          {hasNoIncludedMemoryEntries && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
              Every Memory entry is currently excluded from prompt context. Future
              writing can still use {contentUnitLabel} summaries and manuscript text, but no
              Memory entries are being injected until you reset at least one entry.
            </div>
          )}

          {context.source === "none" && (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 px-3 py-3 text-sm text-zinc-500">
              No story context is available yet. Generate {contentUnitLabel} 1 or build the
              Memory first.
            </div>
          )}
        </section>

        {context.source === "memory" && context.includedEntryCount > 0 && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Next {contentUnitLabel.charAt(0).toUpperCase() + contentUnitLabel.slice(1)} Focus
                </h4>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  These entries will be surfaced before supporting context when you
                  continue the story.
                </p>
              </div>
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                {context.focusEntries.length} focus
              </span>
            </div>

            {context.focusEntries.length > 0 ? (
              <div className="mt-4 space-y-2">
                {context.focusEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {onSelectEntry ? (
                          <button
                            type="button"
                            onClick={() => onSelectEntry(entry.id)}
                            className="truncate text-left text-sm font-medium text-white transition-colors hover:text-purple-200"
                          >
                            {entry.name}
                          </button>
                        ) : (
                          <p className="truncate text-sm font-medium text-white">
                            {entry.name}
                          </p>
                        )}
                          <p className="mt-1 break-words text-xs text-zinc-500">
                            {entry.role
                              ? `${entry.role} - ${labelize(entry.entryType)}`
                              : labelize(entry.entryType)}
                        </p>
                      </div>
                      <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-200">
                        {entry.contextMode === "pin" ? "Pinned first" : "Priority next"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.reasons.map((reason) => (
                        <ReasonChip
                          key={`${entry.id}:${reason.key}`}
                          label={reason.label}
                          tone={getReasonTone(reason.key)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 px-3 py-3 text-sm text-zinc-500">
                No entries are specially emphasized yet. The next {contentUnitLabel} will use
                the included Memory in its normal resolved order.
              </div>
            )}
          </section>
        )}

        {groupedEntryCount > 0 && (
          <section className="space-y-3">
            {context.groups.map((group) => (
              <div
                key={group.key}
                className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{group.label}</h4>
                    <p className="text-xs text-zinc-500">
                      {group.count} entr{group.count === 1 ? "y" : "ies"} resolved
                      for this chapter
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                    {group.count}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {group.entries.map((entry) => {
                    const isUpdating = updatingEntryId === entry.id;
                    const statusTone = getContextTone(entry.contextMode);

                    return (
                      <div
                        key={entry.id}
                        className={`rounded-2xl border px-3 py-3 ${
                          entry.contextMode === "exclude"
                            ? "border-zinc-900 bg-black/20"
                            : "border-zinc-900 bg-black/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {onSelectEntry ? (
                              <button
                                type="button"
                                onClick={() => onSelectEntry(entry.id)}
                                className="truncate text-left text-sm font-medium text-white transition-colors hover:text-purple-200"
                              >
                                {entry.name}
                              </button>
                            ) : (
                              <p className="truncate text-sm font-medium text-white">
                                {entry.name}
                              </p>
                            )}
                          <p className="mt-1 break-words text-xs text-zinc-500">
                            {entry.role
                              ? `${entry.role} - ${labelize(entry.entryType)}`
                              : labelize(entry.entryType)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone}`}
                            >
                              {formatContextModeLabel(entry.contextMode)}
                            </span>
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                              {formatPriorityLabel(entry.nextChapterPriority)}
                            </span>
                            {entry.changedThisChapter && (
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                                Changed now
                              </span>
                            )}
                            {entry.mentionCount > 0 && (
                              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-200">
                                {entry.mentionCount} mention
                                {entry.mentionCount === 1 ? "" : "s"}
                              </span>
                            )}
                            {entry.relationshipCount > 0 && (
                              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                                {entry.relationshipCount} link
                                {entry.relationshipCount === 1 ? "" : "s"}
                              </span>
                            )}
                            {entry.aliasCount > 0 && (
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                                {entry.aliasCount} alias
                                {entry.aliasCount === 1 ? "" : "es"}
                              </span>
                            )}
                          </div>
                        </div>

                        {entry.description && (
                          <p className="mt-2 break-words text-sm leading-6 text-zinc-300">
                            {entry.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {entry.reasons.map((reason) => (
                            <ReasonChip
                              key={`${entry.id}:${reason.key}`}
                              label={reason.label}
                              tone={getReasonTone(reason.key)}
                            />
                          ))}
                        </div>

                        <p className="mt-3 text-xs text-zinc-500">
                          {describeNextChapterBehavior(
                            entry.contextMode,
                            entry.nextChapterPriority
                          )}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <ModeButton
                            label="Pin"
                            active={entry.contextMode === "pin"}
                            disabled={isUpdating || refreshing || entry.contextMode === "pin"}
                            onClick={() => {
                              void handleSetEntryMode(entry.id, entry.name, "pin");
                            }}
                          />
                          <ModeButton
                            label="Exclude"
                            active={entry.contextMode === "exclude"}
                            disabled={
                              isUpdating
                              || refreshing
                              || entry.contextMode === "exclude"
                            }
                            onClick={() => {
                              void handleSetEntryMode(entry.id, entry.name, "exclude");
                            }}
                          />
                          <button
                            type="button"
                            disabled={
                              isUpdating || refreshing || entry.contextMode === "default"
                            }
                            onClick={() => {
                              void handleSetEntryMode(entry.id, entry.name, "default");
                            }}
                            className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reset
                          </button>
                          {onSelectEntry && (
                            <button
                              type="button"
                              onClick={() => onSelectEntry(entry.id)}
                              className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                            >
                              Open entry
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {context.text && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">Prompt Preview</h4>
                <p className="mt-1 text-xs text-zinc-500">
                  Raw context block currently available to `Continue Story` and the
                  craft tools.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRawContext((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {showRawContext ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Show
                  </>
                )}
              </button>
            </div>

            {showRawContext && (
              <pre className="mt-4 max-h-96 overflow-auto rounded-2xl border border-zinc-900 bg-black/40 p-3 text-xs leading-6 text-zinc-300 whitespace-pre-wrap break-words">
                {context.text}
              </pre>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ModeButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "border-purple-500 bg-purple-500/15 text-white"
          : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ReasonChip({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function formatSourceLabel(source: "memory" | "story_bible" | "none") {
  switch (source) {
    case "memory":
      return "Memory";
    case "story_bible":
      return "Story Bible";
    default:
      return "None";
  }
}

function formatContextModeLabel(mode: MemoryContextMode) {
  switch (mode) {
    case "pin":
      return "Pinned";
    case "exclude":
      return "Excluded";
    default:
      return "Auto";
  }
}

function getContextTone(mode: MemoryContextMode) {
  switch (mode) {
    case "pin":
      return "bg-purple-500/15 text-purple-200";
    case "exclude":
      return "bg-amber-500/15 text-amber-200";
    default:
      return "bg-zinc-800 text-zinc-300";
  }
}

function formatPriorityLabel(priority: "priority" | "supporting" | "excluded") {
  switch (priority) {
    case "priority":
      return "Next-chapter focus";
    case "excluded":
      return "Not injected";
    default:
      return "Supporting context";
  }
}

function getReasonTone(reasonKey: StoryContextReasonKey) {
  switch (reasonKey) {
    case "pinned_by_writer":
      return "bg-purple-500/15 text-purple-200";
    case "excluded_by_writer":
      return "bg-amber-500/15 text-amber-200";
    case "changed_this_chapter":
      return "bg-emerald-500/15 text-emerald-200";
    case "mentioned_this_chapter":
      return "bg-sky-500/15 text-sky-200";
    case "linked_to_pinned_entry":
      return "bg-blue-500/15 text-blue-200";
    default:
      return "bg-zinc-800 text-zinc-300";
  }
}

function describeNextChapterBehavior(
  contextMode: MemoryContextMode,
  priority: "priority" | "supporting" | "excluded"
) {
  if (contextMode === "exclude") {
    return "Excluded entries stay in the Memory but are omitted from the active prompt context.";
  }

  if (contextMode === "pin") {
    return "Pinned entries are surfaced first in the next chapter prompt.";
  }

  if (priority === "priority") {
    return "This entry will be surfaced early in the next chapter prompt because it changed recently, was mentioned, or is tied to a pinned entry.";
  }

  return "This entry remains available as supporting context after the higher-priority story truth.";
}

function labelize(value: string) {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildContextModeNotice(
  entryName: string,
  mode: MemoryContextMode
): ContextNotice {
  switch (mode) {
    case "pin":
      return {
        tone: "success",
        message: `${entryName} is pinned. Future writing will surface it near the top of active story context.`,
      };
    case "exclude":
      return {
        tone: "warning",
        message: `${entryName} is excluded from active prompt context. It stays in the Memory, but future writing will stop injecting it until you reset it.`,
      };
    default:
      return {
        tone: "success",
        message: `${entryName} is back on automatic context handling. Future writing will include it when the resolved Memory says it is relevant.`,
      };
  }
}
