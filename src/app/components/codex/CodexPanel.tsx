"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCodex } from "../../hooks/useCodex";
import { useCodexSuggestions } from "../../hooks/useCodexSuggestions";
import type {
  CodexMention,
  CodexChangeSuggestion,
  CreateEntrySuggestionPayload,
  CreateProgressionSuggestionPayload,
  CreateRelationshipSuggestionPayload,
  FlagStaleEntrySuggestionPayload,
  UpdateEntryAliasesSuggestionPayload,
  CreateCodexCustomTypeInput,
  CreateCodexEntryInput,
  UpdateCodexEntryInput,
} from "../../types/codex";
import type { SidePanelWidth } from "../../types/craft";
import ContextConsole from "./ContextConsole";
import EntryDetail from "./EntryDetail";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import SuggestionList from "./SuggestionList";

interface CodexFocusRequest {
  entryId: string;
  nonce: number;
}

interface ContextNotice {
  tone: "success" | "warning";
  message: string;
}

interface CodexPanelProps {
  storyId: string;
  currentChapter: number;
  currentChapterId?: string;
  panelWidth: SidePanelWidth;
  focusMode?: boolean;
  suggestionRefreshKey?: number;
  currentChapterMentions?: CodexMention[];
  mentionSyncing?: boolean;
  mentionError?: string | null;
  focusRequest?: CodexFocusRequest | null;
  onGenerateMentions?: () => Promise<void>;
  onDismissMentionError?: () => void;
}

function useCompactCodexLayout() {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompact(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isCompact;
}

export default function CodexPanel({
  storyId,
  currentChapter,
  currentChapterId,
  panelWidth,
  focusMode = false,
  suggestionRefreshKey = 0,
  currentChapterMentions = [],
  mentionSyncing = false,
  mentionError = null,
  focusRequest = null,
  onGenerateMentions,
  onDismissMentionError,
}: CodexPanelProps) {
  const {
    entries,
    relationships,
    customTypes,
    loading,
    saving,
    generating,
    error,
    fetchCodex,
    clearError,
    createEntry,
    updateEntry,
    deleteEntry,
    createRelationship,
    deleteRelationship,
    createProgression,
    updateProgression,
    deleteProgression,
    createCustomType,
    generateFromChapter1,
  } = useCodex(storyId);
  const {
    suggestions,
    loading: suggestionsLoading,
    detecting,
    processingId,
    error: suggestionError,
    clearError: clearSuggestionError,
    generateSuggestions,
    acceptSuggestion,
    rejectSuggestion,
  } = useCodexSuggestions(storyId, suggestionRefreshKey);

  const [activeView, setActiveView] = useState<"entries" | "updates" | "context">(
    "entries"
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [creatingEntry, setCreatingEntry] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [typeName, setTypeName] = useState("");
  const [typeColor, setTypeColor] = useState("#a855f7");
  const [typeIcon, setTypeIcon] = useState("book");
  const [typeError, setTypeError] = useState<string | null>(null);
  const [dismissedFocusNonce, setDismissedFocusNonce] = useState<number | null>(null);
  const [stackedEntriesView, setStackedEntriesView] = useState<"list" | "detail">(
    "list"
  );
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [contextRefreshKey, setContextRefreshKey] = useState(0);
  const [contextNotice, setContextNotice] = useState<ContextNotice | null>(null);
  const isCompactViewport = useCompactCodexLayout();

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId]
  );
  const pendingSuggestions = useMemo(
    () => suggestions.filter((suggestion) => suggestion.status === "pending"),
    [suggestions]
  );
  const reviewCount = pendingSuggestions.length;
  const chapterMentionCount = currentChapterMentions.length;
  const memorySummary = [
    `${entries.length} facts`,
    `${chapterMentionCount} mentions in Ch. ${currentChapter}`,
    reviewCount > 0 ? `${reviewCount} to review` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const activeFocusEntryId =
    focusRequest && focusRequest.nonce !== dismissedFocusNonce
      ? focusRequest.entryId
      : null;
  const effectiveActiveView = activeFocusEntryId ? "entries" : activeView;
  const effectiveCreatingEntry = activeFocusEntryId ? false : creatingEntry;
  const useSplitEntriesLayout = !isCompactViewport && panelWidth !== "normal";
  const useStackedEntriesLayout = !useSplitEntriesLayout;
  const effectiveStackedEntriesView = activeFocusEntryId
    ? "detail"
    : effectiveCreatingEntry
      ? "detail"
      : stackedEntriesView;
  const shouldShowContextView =
    !isCompactViewport || showAdvancedTools || effectiveActiveView === "context";
  const useStackedEntriesListScreen =
    useStackedEntriesLayout &&
    effectiveActiveView === "entries" &&
    !effectiveCreatingEntry &&
    effectiveStackedEntriesView === "list";
  const showListActions =
    effectiveActiveView === "entries" &&
    (!useStackedEntriesLayout || useStackedEntriesListScreen);
  const visibleViews = useMemo<
    Array<{ key: "entries" | "updates" | "context"; label: string }>
  >(
    () => [
      { key: "entries", label: "Facts" },
      {
        key: "updates",
        label:
          pendingSuggestions.length > 0
            ? `Review (${pendingSuggestions.length})`
            : "Review",
      },
      ...(shouldShowContextView
        ? [{ key: "context" as const, label: "Current context" }]
        : []),
    ],
    [pendingSuggestions.length, shouldShowContextView]
  );

  const handleCreateEntry = async (
    input: CreateCodexEntryInput | UpdateCodexEntryInput
  ) => {
    const created = await createEntry(input as CreateCodexEntryInput);
    setContextRefreshKey((prev) => prev + 1);
    setCreatingEntry(false);
    setSelectedEntryId(created.id);
  };

  const handleCreateType = async () => {
    const trimmedName = typeName.trim();
    if (!trimmedName) {
      setTypeError("Custom type name is required.");
      return;
    }

    setTypeError(null);

    const input: CreateCodexCustomTypeInput = {
      name: trimmedName,
      color: typeColor,
      icon: typeIcon.trim() || "book",
    };

    await createCustomType(input);
    setTypeName("");
    setTypeColor("#a855f7");
    setTypeIcon("book");
    setShowTypeForm(false);
  };

  const showEmptyState =
    effectiveActiveView === "entries" &&
    !loading &&
    entries.length === 0 &&
    !effectiveCreatingEntry;
  const focusedOrSelectedEntry =
    (activeFocusEntryId
      ? entries.find((entry) => entry.id === activeFocusEntryId) ?? null
      : selectedEntry) ?? null;
  const effectiveSelectedEntry = effectiveCreatingEntry
    ? null
    : useStackedEntriesLayout
      ? focusedOrSelectedEntry
      : focusedOrSelectedEntry ?? entries[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#13101e]">
      <div
        className={`shrink-0 border-b border-zinc-800 px-4 ${
          focusMode ? "py-2.5" : "py-3"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {focusMode ? (
              <>
                <p className="text-sm font-semibold text-white">
                  Chapter {currentChapter}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {memorySummary}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  <h2 className="text-sm font-semibold text-white">Memory</h2>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Facts for Chapter {currentChapter}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {showListActions ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvancedTools(false);
                    setDismissedFocusNonce(focusRequest?.nonce ?? null);
                    setCreatingEntry(true);
                    setStackedEntriesView("detail");
                    setSelectedEntryId(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New fact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvancedTools((prev) => {
                      const next = !prev;
                      if (!next) {
                        setShowTypeForm(false);
                        setTypeError(null);
                      }
                      return next;
                    });
                  }}
                  className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                    showAdvancedTools
                      ? "border-zinc-600 bg-zinc-900 text-white"
                      : "border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  Advanced
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      showAdvancedTools ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {!focusMode && (
          <p className="mt-3 text-xs leading-5 text-zinc-500">{memorySummary}</p>
        )}

        {false && useStackedEntriesListScreen && (
          <div className="mt-3 text-xs text-zinc-500">
            {entries.length} entries · {chapterMentionCount} mentions in Ch.{" "}
            {currentChapter}
          </div>
        )}

        <div
          className={`inline-flex rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1 ${
            focusMode ? "mt-2" : "mt-4"
          }`}
        >
          {visibleViews.map((view) => (
            <button
              key={view.key}
              type="button"
                onClick={() => {
                  setDismissedFocusNonce(focusRequest?.nonce ?? null);
                  setActiveView(view.key);
                }}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                effectiveActiveView === view.key
                  ? "bg-purple-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        {showAdvancedTools && showListActions && (
          <div
            className={`rounded-2xl border border-zinc-800 bg-black/20 p-3 ${
              focusMode ? "mt-2" : "mt-3"
            }`}
          >
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTypeForm((prev) => !prev);
                  setTypeError(null);
                }}
                className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {showTypeForm ? "Hide type tools" : "Type tools"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!onGenerateMentions) {
                    return;
                  }

                  void onGenerateMentions();
                }}
                disabled={!currentChapterId || !onGenerateMentions || mentionSyncing}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${mentionSyncing ? "animate-spin" : ""}`}
                />
                {mentionSyncing ? "Syncing..." : "Sync mentions"}
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Type tools and mention sync.
            </p>
          </div>
        )}

        {effectiveActiveView === "entries" && showTypeForm && showAdvancedTools && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_120px_100px]">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Type name</span>
                <input
                  value={typeName}
                  onChange={(event) => setTypeName(event.target.value)}
                  placeholder="magic system"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Color</span>
                <input
                  type="color"
                  value={typeColor}
                  onChange={(event) => setTypeColor(event.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-transparent"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">Icon</span>
                <input
                  value={typeIcon}
                  onChange={(event) => setTypeIcon(event.target.value)}
                  placeholder="book"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-purple-500"
                />
              </label>
            </div>

            {typeError && (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {typeError}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleCreateType();
                }}
                disabled={saving}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create type
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTypeForm(false);
                  setTypeError(null);
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
            <p className="break-words">{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-xs font-medium text-red-200 transition-colors hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {mentionError && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
            <p className="break-words">{mentionError}</p>
            <button
              type="button"
              onClick={onDismissMentionError}
              className="text-xs font-medium text-amber-200 transition-colors hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {suggestionError && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
            <p className="break-words">{suggestionError}</p>
            <button
              type="button"
              onClick={clearSuggestionError}
              className="text-xs font-medium text-red-200 transition-colors hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {contextNotice && activeView !== "context" && (
          <div
            className={`mt-4 flex items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm ${
              contextNotice.tone === "success"
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-100"
            }`}
          >
            <p className="break-words">{contextNotice.message}</p>
            <div className="flex items-center gap-3">
              {contextNotice.tone === "success" && effectiveActiveView !== "context" && (
                <button
                  type="button"
                  onClick={() => setActiveView("context")}
                  className="text-xs font-medium text-current/80 transition-colors hover:text-white"
                >
                  Open current context
                </button>
              )}
              <button
                type="button"
                onClick={() => setContextNotice(null)}
                className="text-xs font-medium text-current/80 transition-colors hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {effectiveActiveView === "context" ? (
        <ContextConsole
          storyId={storyId}
          currentChapter={currentChapter}
          refreshKey={contextRefreshKey}
          notice={contextNotice}
          onDismissNotice={() => setContextNotice(null)}
          onSelectEntry={(entryId) => {
            setDismissedFocusNonce(focusRequest?.nonce ?? null);
            setActiveView("entries");
            setCreatingEntry(false);
            setStackedEntriesView("detail");
            setSelectedEntryId(entryId);
          }}
        />
      ) : effectiveActiveView === "updates" ? (
        <SuggestionList
          currentChapter={currentChapter}
          currentChapterId={currentChapterId}
          suggestions={suggestions}
          entries={entries}
          relationships={relationships}
          loading={suggestionsLoading}
          detecting={detecting}
          processingId={processingId}
          onGenerate={async (chapterId) => {
            await generateSuggestions(chapterId);
          }}
          onAccept={async (suggestionId) => {
            const acceptedSuggestion = await acceptSuggestion(suggestionId);
            await fetchCodex();
            setContextRefreshKey((prev) => prev + 1);
            setContextNotice(buildContextNotice(acceptedSuggestion));
            return acceptedSuggestion;
          }}
          onReject={async (suggestionId) => {
            const rejectedSuggestion = await rejectSuggestion(suggestionId);
            return rejectedSuggestion;
          }}
          onOpenEntry={(entryId) => {
            setDismissedFocusNonce(focusRequest?.nonce ?? null);
            setActiveView("entries");
            setCreatingEntry(false);
            setStackedEntriesView("detail");
            setSelectedEntryId(entryId);
          }}
        />
      ) : loading ? (
        <div className="grid flex-1 grid-rows-[280px_1fr] overflow-hidden">
          <div className="space-y-3 border-b border-zinc-800 px-4 py-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-2xl bg-zinc-900/70"
              />
            ))}
          </div>
          <div className="space-y-3 px-4 py-4">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl bg-zinc-900/70"
              />
            ))}
          </div>
        </div>
      ) : showEmptyState ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="max-w-sm rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <Sparkles className="mx-auto h-8 w-8 text-purple-300" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              Build this story&apos;s memory
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Build a first pass from Chapter 1, or add the first fact by hand.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  void generateFromChapter1();
                }}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Building..." : "Build from Chapter 1"}
              </button>
              <button
                type="button"
                onClick={() => setCreatingEntry(true)}
                className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Add first fact
              </button>
            </div>
          </div>
        </div>
      ) : (
        useStackedEntriesLayout ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {effectiveCreatingEntry ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedFocusNonce(focusRequest?.nonce ?? null);
                      setCreatingEntry(false);
                      setStackedEntriesView("list");
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Facts
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold text-white">New fact</h3>
                    <p className="text-xs text-zinc-500">
                      Add a new story fact to project memory.
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <EntryForm
                    key="new-entry"
                    customTypes={customTypes}
                    saving={saving}
                    submitLabel="Create fact"
                    onSubmit={handleCreateEntry}
                    onCancel={() => {
                      setCreatingEntry(false);
                      setStackedEntriesView("list");
                      setSelectedEntryId(null);
                    }}
                  />
                </div>
              </div>
            ) : effectiveStackedEntriesView === "detail" && effectiveSelectedEntry ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDismissedFocusNonce(focusRequest?.nonce ?? null);
                      setStackedEntriesView("list");
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Facts
                  </button>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {effectiveSelectedEntry.name}
                    </h3>
                    <p className="text-xs text-zinc-500">Saved story fact</p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <EntryDetail
                    key={`${effectiveSelectedEntry.id}:${currentChapter}`}
                    storyId={storyId}
                    entry={effectiveSelectedEntry}
                    entries={entries}
                    relationships={relationships}
                    customTypes={customTypes}
                    currentChapter={currentChapter}
                    currentChapterMentions={currentChapterMentions}
                    saving={saving}
                    onSelectEntry={(entryId) => {
                      setDismissedFocusNonce(focusRequest?.nonce ?? null);
                      setCreatingEntry(false);
                      setStackedEntriesView("detail");
                      setSelectedEntryId(entryId);
                    }}
                    onSave={async (updates) => {
                      await updateEntry(effectiveSelectedEntry.id, updates);
                      setContextRefreshKey((prev) => prev + 1);
                    }}
                    onDelete={async () => {
                      await deleteEntry(effectiveSelectedEntry.id);
                      setContextRefreshKey((prev) => prev + 1);
                      setSelectedEntryId(null);
                      setStackedEntriesView("list");
                    }}
                    onCreateRelationship={async (input) => {
                      await createRelationship(input);
                      setContextRefreshKey((prev) => prev + 1);
                    }}
                    onDeleteRelationship={async (relationshipId) => {
                      await deleteRelationship(relationshipId);
                      setContextRefreshKey((prev) => prev + 1);
                    }}
                    onCreateProgression={async (input) => {
                      await createProgression(effectiveSelectedEntry.id, input);
                      setContextRefreshKey((prev) => prev + 1);
                    }}
                    onUpdateProgression={async (progressionId, input) => {
                      await updateProgression(
                        effectiveSelectedEntry.id,
                        progressionId,
                        input
                      );
                      setContextRefreshKey((prev) => prev + 1);
                    }}
                    onDeleteProgression={async (progressionId) => {
                      await deleteProgression(effectiveSelectedEntry.id, progressionId);
                      setContextRefreshKey((prev) => prev + 1);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <EntryList
                  entries={entries}
                  customTypes={customTypes}
                  currentChapter={currentChapter}
                  currentChapterMentions={currentChapterMentions}
                  selectedEntryId={effectiveSelectedEntry?.id ?? null}
                  compact
                  scrollMode="natural"
                  showSummaryBadges={false}
                  onSelect={(entryId) => {
                    setDismissedFocusNonce(focusRequest?.nonce ?? null);
                    setCreatingEntry(false);
                    setStackedEntriesView("detail");
                    setSelectedEntryId(entryId);
                  }}
                  onCreate={() => {
                    setDismissedFocusNonce(focusRequest?.nonce ?? null);
                    setCreatingEntry(true);
                    setStackedEntriesView("detail");
                    setSelectedEntryId(null);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(320px,0.4fr)_minmax(0,0.6fr)]">
            <section className="min-h-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/45">
              <EntryList
                entries={entries}
                customTypes={customTypes}
                currentChapter={currentChapter}
                currentChapterMentions={currentChapterMentions}
                selectedEntryId={effectiveSelectedEntry?.id ?? null}
                compact
                showSummaryBadges={false}
                onSelect={(entryId) => {
                  setDismissedFocusNonce(focusRequest?.nonce ?? null);
                  setCreatingEntry(false);
                  setSelectedEntryId(entryId);
                }}
                onCreate={() => {
                  setDismissedFocusNonce(focusRequest?.nonce ?? null);
                  setCreatingEntry(true);
                  setSelectedEntryId(null);
                }}
              />
            </section>

            <div className="min-h-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/45">
              <div className="min-h-0 h-full overflow-y-auto">
              {effectiveCreatingEntry ? (
                <div className="px-4 py-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white">New fact</h3>
                    <p className="text-xs text-zinc-500">
                      Add a new story fact to project memory.
                    </p>
                  </div>
                  <EntryForm
                    key="new-entry"
                    customTypes={customTypes}
                    saving={saving}
                    submitLabel="Create fact"
                    onSubmit={handleCreateEntry}
                    onCancel={() => {
                      setCreatingEntry(false);
                      if (entries.length > 0) {
                        setSelectedEntryId(entries[0].id);
                      }
                    }}
                  />
                </div>
              ) : effectiveSelectedEntry ? (
                <EntryDetail
                  key={`${effectiveSelectedEntry.id}:${currentChapter}`}
                  storyId={storyId}
                  entry={effectiveSelectedEntry}
                  entries={entries}
                  relationships={relationships}
                  customTypes={customTypes}
                  currentChapter={currentChapter}
                  currentChapterMentions={currentChapterMentions}
                  saving={saving}
                  onSelectEntry={(entryId) => {
                    setDismissedFocusNonce(focusRequest?.nonce ?? null);
                    setCreatingEntry(false);
                    setSelectedEntryId(entryId);
                  }}
                  onSave={async (updates) => {
                    await updateEntry(effectiveSelectedEntry.id, updates);
                    setContextRefreshKey((prev) => prev + 1);
                  }}
                  onDelete={async () => {
                    await deleteEntry(effectiveSelectedEntry.id);
                    setContextRefreshKey((prev) => prev + 1);
                    setSelectedEntryId((prev) => {
                      if (prev !== effectiveSelectedEntry.id) {
                        return prev;
                      }
                      const nextEntry = entries.find(
                        (entry) => entry.id !== effectiveSelectedEntry.id
                      );
                      return nextEntry?.id ?? null;
                    });
                  }}
                  onCreateRelationship={async (input) => {
                    await createRelationship(input);
                    setContextRefreshKey((prev) => prev + 1);
                  }}
                  onDeleteRelationship={async (relationshipId) => {
                    await deleteRelationship(relationshipId);
                    setContextRefreshKey((prev) => prev + 1);
                  }}
                  onCreateProgression={async (input) => {
                    await createProgression(effectiveSelectedEntry.id, input);
                    setContextRefreshKey((prev) => prev + 1);
                  }}
                  onUpdateProgression={async (progressionId, input) => {
                    await updateProgression(
                      effectiveSelectedEntry.id,
                      progressionId,
                      input
                    );
                    setContextRefreshKey((prev) => prev + 1);
                  }}
                  onDeleteProgression={async (progressionId) => {
                    await deleteProgression(effectiveSelectedEntry.id, progressionId);
                    setContextRefreshKey((prev) => prev + 1);
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
                  Select a fact to edit it.
                </div>
              )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function buildContextNotice(suggestion: CodexChangeSuggestion): ContextNotice {
  switch (suggestion.changeType) {
    case "create_entry": {
      const payload = suggestion.payload as CreateEntrySuggestionPayload;
      return {
        tone: "success",
        message: `Saved to memory. Future writing now knows ${payload.name}.`,
      };
    }
    case "update_entry_aliases": {
      const payload = suggestion.payload as UpdateEntryAliasesSuggestionPayload;
      return {
        tone: "success",
        message: `Saved to memory. Future writing now recognizes the new aliases for ${payload.entryName}.`,
      };
    }
    case "create_relationship": {
      const payload = suggestion.payload as CreateRelationshipSuggestionPayload;
      return {
        tone: "success",
        message: `Saved to memory. Future writing now uses the relationship between ${payload.sourceEntryName} and ${payload.targetEntryName}.`,
      };
    }
    case "create_progression": {
      const payload = suggestion.payload as CreateProgressionSuggestionPayload;
      return {
        tone: "success",
        message: `Saved to memory. Future writing now uses the updated Chapter ${payload.chapterNumber} truth for ${payload.entryName}.`,
      };
    }
    case "flag_stale_entry": {
      const payload = suggestion.payload as FlagStaleEntrySuggestionPayload;
      return {
        tone: "warning",
        message: `${payload.entryName} was marked for manual review. Future writing stays unchanged until you edit that fact directly.`,
      };
    }
    default:
      return {
        tone: "success",
        message: "Saved to memory. Future writing now uses the updated story context.",
      };
  }
}
