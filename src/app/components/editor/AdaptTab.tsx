"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Copy,
  FileText,
  Mail,
  Megaphone,
  Newspaper,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getProjectUnitLabel } from "../../lib/projectMode";
import { getErrorMessage, requestJson } from "../../lib/request";
import {
  formatAdaptationWorkflowStateSource,
  getAdaptationChainPresetsForMode,
  getAdaptationPreset,
  getAdaptationPresetsForMode,
} from "../../lib/adaptations";
import type {
  AdaptationChainId,
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../../types/adaptation";
import {
  EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES,
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS,
  type NewsletterIssuePackageSelection,
  type NewsletterIssuePackageSelectionField,
  type NewsletterIssuePackageSelectionValues,
} from "../../types/newsletter";
import type { ProjectMode } from "../../types/story";

interface AdaptTabProps {
  storyId: string;
  projectMode: ProjectMode;
  currentChapter: number;
  currentChapterId?: string;
  focusMode?: boolean;
  activeOutputType: AdaptationOutputType;
  selectedChainId: AdaptationChainId;
  currentResult: ChapterAdaptationResult | null;
  resultsByType: Partial<Record<AdaptationOutputType, ChapterAdaptationResult>>;
  loadingOutputType: AdaptationOutputType | null;
  deletingOutputType: AdaptationOutputType | null;
  chainLoading: boolean;
  error: string | null;
  onSelectChainId: (chainId: AdaptationChainId) => void;
  onSelectOutputType: (outputType: AdaptationOutputType) => void;
  onGenerate: (outputType: AdaptationOutputType) => Promise<void>;
  onGenerateChain: () => Promise<void>;
  onDeleteOutput: (outputType: AdaptationOutputType) => Promise<void>;
  onInsert: (text: string) => void;
  onSummaryUpdated?: (summary: string) => void;
  onDismissError: () => void;
}

const ADAPTATION_ICONS = {
  short_summary: FileText,
  newsletter_recap: Newspaper,
  screenplay_beat_sheet: Clapperboard,
  public_teaser: Megaphone,
  issue_subject_line: Mail,
  issue_deck: FileText,
  issue_section_package: FileText,
  issue_hook_variants: Sparkles,
  issue_cta_variants: Megaphone,
  issue_send_checklist: AlertCircle,
} satisfies Record<AdaptationOutputType, typeof FileText>;

const NEWSLETTER_OUTPUT_TO_SELECTION_FIELD: Partial<
  Record<AdaptationOutputType, NewsletterIssuePackageSelectionField>
> = {
  issue_subject_line: "subjectLine",
  issue_deck: "deck",
  issue_hook_variants: "hook",
  issue_cta_variants: "cta",
  issue_section_package: "sectionPackage",
};

export default function AdaptTab({
  storyId,
  projectMode,
  currentChapter,
  currentChapterId,
  focusMode = false,
  activeOutputType,
  selectedChainId,
  currentResult,
  resultsByType,
  loadingOutputType,
  deletingOutputType,
  chainLoading,
  error,
  onSelectChainId,
  onSelectOutputType,
  onGenerate,
  onGenerateChain,
  onDeleteOutput,
  onInsert,
  onSummaryUpdated,
  onDismissError,
}: AdaptTabProps) {
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const adaptationPresets = getAdaptationPresetsForMode(projectMode);
  const chainPresets = getAdaptationChainPresetsForMode(projectMode);
  const activePreset =
    adaptationPresets.find((preset) => preset.type === activeOutputType)
    ?? adaptationPresets[0];
  const selectedChainPreset =
    chainPresets.find((preset) => preset.id === selectedChainId)
    ?? chainPresets[0];
  const loading = loadingOutputType !== null;
  const activeGenerating = loadingOutputType === activeOutputType;
  const deletingCurrent = deletingOutputType === activeOutputType;
  const canGenerate = Boolean(currentChapterId) && !loading;
  const [fillingMissingChain, setFillingMissingChain] = useState(false);
  const [fillingMissingOutputType, setFillingMissingOutputType] =
    useState<AdaptationOutputType | null>(null);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [showResultActions, setShowResultActions] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summarySaveMessage, setSummarySaveMessage] = useState<string | null>(null);
  const [summarySaveTone, setSummarySaveTone] = useState<"success" | "error">(
    "success"
  );
  const selectedChainReady = selectedChainPreset.outputTypes.every(
    (outputType) => Boolean(resultsByType[outputType]?.persisted)
  );
  const savedChainCount = useMemo(
    () =>
      selectedChainPreset.outputTypes.filter(
        (outputType) => Boolean(resultsByType[outputType]?.persisted)
      ).length,
    [resultsByType, selectedChainPreset.outputTypes]
  );
  const missingChainOutputTypes = useMemo(
    () =>
      selectedChainPreset.outputTypes.filter(
        (outputType) => !resultsByType[outputType]?.persisted
      ),
    [resultsByType, selectedChainPreset.outputTypes]
  );
  const nextMissingOutputType = missingChainOutputTypes[0] ?? null;
  const sendChecklistSaved =
    Boolean(resultsByType.issue_send_checklist?.persisted);
  const isNewsletterIssuePackage = selectedChainId === "issue_package";
  const [packageSelection, setPackageSelection] =
    useState<NewsletterIssuePackageSelection | null>(null);
  const [packageSelectionDrafts, setPackageSelectionDrafts] =
    useState<NewsletterIssuePackageSelectionValues>(
      EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES
    );
  const [packageSelectionLoading, setPackageSelectionLoading] = useState(false);
  const [packageSelectionSavingField, setPackageSelectionSavingField] =
    useState<NewsletterIssuePackageSelectionField | null>(null);
  const [packageSelectionError, setPackageSelectionError] = useState<string | null>(
    null
  );
  const [showOfficialEditor, setShowOfficialEditor] = useState(false);
  const activeSelectionField =
    projectMode === "newsletter"
      ? NEWSLETTER_OUTPUT_TO_SELECTION_FIELD[activeOutputType] ?? null
      : null;
  const activeSelectionValue = activeSelectionField
    ? packageSelection?.[activeSelectionField] ?? ""
    : "";
  const activeSelectionDraftValue = activeSelectionField
    ? packageSelectionDrafts[activeSelectionField] ?? ""
    : "";
  const hasUnsavedSelectionDraft =
    activeSelectionField !== null
    && activeSelectionDraftValue.trim() !== activeSelectionValue.trim();
  const parsedActiveOptions = useMemo(
    () =>
      activeSelectionField && currentResult?.content
        ? parseNumberedOptions(currentResult.content)
        : [],
    [activeSelectionField, currentResult?.content]
  );
  const canManageCanonicalSelection =
    projectMode === "newsletter"
    && Boolean(currentChapterId)
    && activeSelectionField !== null;
  const canPromoteToSummary =
    Boolean(currentChapterId)
    && Boolean(currentResult?.content.trim())
    && (activeOutputType === "short_summary" || activeOutputType === "newsletter_recap");
  const showOfficialChoices =
    activeSelectionField !== null
    && activeSelectionField !== "sectionPackage"
    && parsedActiveOptions.length > 0;
  const selectedChainUsesSummary = formatWorkflowStateSources(
    selectedChainPreset.stateSources
  );
  const selectedChainAvailableStateSummary = buildAvailableWorkflowStateSummary({
    savedOutputTypes: selectedChainPreset.outputTypes,
    usesOfficialPackageState:
      selectedChainPreset.stateSources.includes("official_package"),
    resultsByType,
    packageSelection,
  });
  const activeOutputUsesSummary = formatWorkflowStateSources(
    activePreset.stateSources
  );
  const activeOutputAvailableStateSummary = buildAvailableWorkflowStateSummary({
    savedOutputTypes: activePreset.supportingOutputTypes,
    usesOfficialPackageState: Boolean(activePreset.usesOfficialPackageState),
    resultsByType,
    packageSelection,
  });

  useEffect(() => {
    setShowResultActions(false);
    setShowOfficialEditor(false);
    setSummarySaveMessage(null);
    setSummarySaveTone("success");
  }, [activeOutputType, currentChapterId]);

  useEffect(() => {
    if (projectMode !== "newsletter" || !currentChapterId) {
      setPackageSelection(null);
      setPackageSelectionDrafts(EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES);
      setPackageSelectionError(null);
      setPackageSelectionLoading(false);
      return;
    }

    let cancelled = false;
    setPackageSelectionLoading(true);
    setPackageSelectionError(null);

    void requestJson<{ selection: NewsletterIssuePackageSelection }>(
      `/api/newsletter/${storyId}/package?chapterId=${currentChapterId}`
    )
      .then((data) => {
        if (cancelled) {
          return;
        }

        setPackageSelection(data.selection);
        setPackageSelectionDrafts({
          subjectLine: data.selection.subjectLine,
          deck: data.selection.deck,
          hook: data.selection.hook,
          cta: data.selection.cta,
          sectionPackage: data.selection.sectionPackage,
        });
      })
      .catch((selectionError: unknown) => {
        if (cancelled) {
          return;
        }

        setPackageSelectionError(
          getErrorMessage(
            selectionError,
            "Failed to load canonical issue package state"
          )
        );
      })
      .finally(() => {
        if (!cancelled) {
          setPackageSelectionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentChapterId, projectMode, storyId]);

  const persistSelectionField = async (
    field: NewsletterIssuePackageSelectionField,
    value: string
  ) => {
    if (!currentChapterId) {
      return;
    }

    setPackageSelectionSavingField(field);
    setPackageSelectionError(null);

    try {
      const data = await requestJson<{ selection: NewsletterIssuePackageSelection }>(
        `/api/newsletter/${storyId}/package`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: currentChapterId,
            field,
            value,
          }),
        }
      );

      setPackageSelection(data.selection);
      setPackageSelectionDrafts((prev) => ({
        ...prev,
        [field]: data.selection[field],
      }));
    } catch (selectionError: unknown) {
      setPackageSelectionError(
        getErrorMessage(
          selectionError,
          "Failed to update canonical issue package state"
        )
      );
    } finally {
      setPackageSelectionSavingField(null);
    }
  };

  const handleSelectionDraftChange = (
    field: NewsletterIssuePackageSelectionField,
    value: string
  ) => {
    setPackageSelectionDrafts((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateMissingChainOutputs = async () => {
    if (!currentChapterId || missingChainOutputTypes.length === 0) {
      return;
    }

    setFillingMissingChain(true);

    try {
      for (const outputType of missingChainOutputTypes) {
        setFillingMissingOutputType(outputType);
        await onGenerate(outputType);
      }
    } catch {
      // `onGenerate` already surfaces the error state in the panel.
    } finally {
      setFillingMissingChain(false);
      setFillingMissingOutputType(null);
    }
  };

  const handlePromoteToSummary = async () => {
    if (!currentChapterId || !currentResult?.content.trim()) {
      return;
    }

    setSavingSummary(true);
    setSummarySaveMessage(null);
    setSummarySaveTone("success");

    try {
      const data = await requestJson<{ summary: string }>(
        `/api/chapters/${currentChapterId}/summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: currentResult.content,
          }),
        }
      );

      onSummaryUpdated?.(data.summary);
      setSummarySaveMessage(
        `${unitLabelCapitalized} summary updated from ${activePreset.label.toLowerCase()}.`
      );
    } catch (saveError: unknown) {
      setSummarySaveTone("error");
      setSummarySaveMessage(
        getErrorMessage(saveError, `Failed to update the ${unitLabel} summary`)
      );
    } finally {
      setSavingSummary(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#13101e]">
      {!focusMode && (
        <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Outputs</h2>
              <p className="text-xs text-zinc-500">
                Create saved outputs from {unitLabel} {currentChapter}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-0 flex-1 overflow-y-auto px-4 ${focusMode ? "py-3" : "py-4"}`}>
        <div className={focusMode ? "space-y-4" : "space-y-5"}>
          {!currentChapterId && (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 px-5 py-6 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-cyan-300" />
              <h3 className="mt-3 text-sm font-semibold text-white">
                Save the {unitLabel} first
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Outputs work from a saved {unitLabel}, its summary, and the
                current project context.
              </p>
            </div>
          )}

          <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-900 p-2 text-zinc-300">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">Output workflow</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Choose the set of outputs you want to create.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {chainPresets.map((preset) => {
                const selected = preset.id === selectedChainId;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectChainId(preset.id)}
                    className={`rounded-2xl border px-3 py-2 text-left transition-colors ${
                      selected
                        ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                        : "border-zinc-800 bg-black/20 text-zinc-300 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    <p className="text-xs font-semibold">{preset.label}</p>
                    <p className="mt-1 text-[11px] opacity-70">
                      {preset.outputTypes
                        .map((outputType) => getPresetLabel(outputType))
                        .join(" -> ")}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-black/20 px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {selectedChainPreset.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    {selectedChainPreset.description}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Uses {selectedChainUsesSummary}.
                  </p>
                  {selectedChainAvailableStateSummary && (
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {selectedChainAvailableStateSummary}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-zinc-300">
                    {selectedChainReady
                      ? "Everything in this workflow is already saved."
                      : `${savedChainCount} of ${selectedChainPreset.outputTypes.length} outputs are already saved.`}
                  </p>
                  {!selectedChainReady && nextMissingOutputType && (
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Next missing piece: {getPresetLabel(nextMissingOutputType)}
                    </p>
                  )}
                  {selectedChainReady && isNewsletterIssuePackage && (
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Package complete. Next, review the send checklist and
                      then use Project for the pre-send check.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!selectedChainReady && savedChainCount === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        void onGenerateChain();
                      }}
                      disabled={
                        !currentChapterId || loading || chainLoading || fillingMissingChain
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${chainLoading ? "animate-spin" : ""}`}
                      />
                      {chainLoading ? "Running..." : "Run workflow"}
                    </button>
                  )}
                  {!selectedChainReady && savedChainCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleGenerateMissingChainOutputs();
                      }}
                      disabled={
                        !currentChapterId || loading || chainLoading || fillingMissingChain
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Sparkles
                        className={`h-4 w-4 ${fillingMissingChain ? "animate-pulse" : ""}`}
                      />
                      {fillingMissingChain && fillingMissingOutputType
                        ? `Generating ${getPresetLabel(fillingMissingOutputType)}...`
                        : "Generate missing pieces"}
                    </button>
                  )}
                  {selectedChainReady && isNewsletterIssuePackage && (
                    <button
                      type="button"
                      onClick={() =>
                        onSelectOutputType(
                          sendChecklistSaved
                            ? "issue_send_checklist"
                            : "issue_subject_line"
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {sendChecklistSaved
                        ? "Review send checklist"
                        : "Review package"}
                    </button>
                  )}
                  {selectedChainReady && !isNewsletterIssuePackage && (
                    <button
                      type="button"
                      onClick={() => {
                        void onGenerateChain();
                      }}
                      disabled={
                        !currentChapterId || loading || chainLoading || fillingMissingChain
                      }
                      className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${chainLoading ? "animate-spin" : ""}`}
                      />
                      {chainLoading ? "Running..." : "Run again"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowWorkflowDetails((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    Workflow details
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showWorkflowDetails ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {showWorkflowDetails && (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    {!selectedChainReady && nextMissingOutputType && (
                      <button
                        type="button"
                        onClick={() => onSelectOutputType(nextMissingOutputType)}
                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Review next missing
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void onGenerateChain();
                      }}
                      disabled={
                        !currentChapterId || loading || chainLoading || fillingMissingChain
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${chainLoading ? "animate-spin" : ""}`}
                      />
                      {chainLoading ? "Running..." : "Run full workflow again"}
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedChainPreset.outputTypes.map((outputType) => {
                      const saved = Boolean(resultsByType[outputType]?.persisted);

                      return (
                        <button
                          key={outputType}
                          type="button"
                          onClick={() => onSelectOutputType(outputType)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2 text-left transition-colors hover:border-zinc-600"
                        >
                          <span className="text-sm font-medium text-white">
                            {getPresetLabel(outputType)}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {saved ? "Saved" : "Missing"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Single outputs</h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Generate one saved output at a time from the same {unitLabel}.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {adaptationPresets.map((preset) => {
                const Icon = ADAPTATION_ICONS[preset.type];
                const selected = preset.type === activeOutputType;
                const cached = Boolean(resultsByType[preset.type]);
                const generating = loadingOutputType === preset.type;
                const persisted = resultsByType[preset.type]?.persisted ?? false;

                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => onSelectOutputType(preset.type)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                      selected
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-zinc-800 bg-black/20 hover:border-zinc-600 hover:bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-2xl p-2 ${
                          selected
                            ? "bg-cyan-500/15 text-cyan-200"
                            : "bg-zinc-900 text-zinc-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">
                          {preset.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                          {preset.description}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          {describeOutputCardState({
                            cached,
                            generating,
                            persisted,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {activePreset.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {activePreset.description}
                </p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Uses {activeOutputUsesSummary}.
                </p>
                {activeOutputAvailableStateSummary && (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {activeOutputAvailableStateSummary}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  void onGenerate(activeOutputType);
                }}
                disabled={!canGenerate}
                className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                {resultsByType[activeOutputType] ? "Regenerate" : "Generate"}
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
                <div className="flex min-w-0 items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="break-words">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={onDismissError}
                  className="text-xs font-medium text-red-200 transition-colors hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            {!currentResult && !loading && (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-4 py-5 text-sm leading-6 text-zinc-400">
                Generate this output to create a reusable version of the current{" "}
                {unitLabel} while keeping project truth intact.
              </div>
            )}

            {activeGenerating && !currentResult && (
              <div className="mt-4 space-y-3">
                <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-900/70" />
                <div className="h-20 animate-pulse rounded-2xl bg-zinc-900/70" />
                <div className="h-20 animate-pulse rounded-2xl bg-zinc-900/70" />
              </div>
            )}

            {currentResult && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-zinc-300">
                  {unitLabelCapitalized} {currentResult.chapterNumber}
                  {" | "}
                  {currentResult.persisted ? "Saved to project" : "Saved in this session"}
                  {" | "}
                  {labelContextSource(currentResult.contextSource)}
                </p>

                <p className="text-xs text-zinc-500">
                  Last updated {formatTimestamp(currentResult.updatedAt)}
                </p>

                <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-black/30 p-4">
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-100">
                    {currentResult.content}
                  </pre>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onInsert(currentResult.content)}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                  >
                    Use in editor
                  </button>
                  {canPromoteToSummary && (
                    <button
                      type="button"
                      onClick={() => {
                        void handlePromoteToSummary();
                      }}
                      disabled={savingSummary}
                      className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileText className="h-4 w-4" />
                      {savingSummary
                        ? "Saving summary..."
                        : `Save as ${unitLabel} summary`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(currentResult.content);
                    }}
                    className="hidden items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:inline-flex"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResultActions((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    More actions
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showResultActions ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {showResultActions && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-black/20 p-3">
                    {canPromoteToSummary && (
                      <button
                        type="button"
                        onClick={() => {
                          void handlePromoteToSummary();
                        }}
                        disabled={savingSummary}
                        className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white sm:hidden disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FileText className="h-4 w-4" />
                        {savingSummary
                          ? "Saving summary..."
                          : `Save as ${unitLabel} summary`}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(currentResult.content);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:hidden"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void onDeleteOutput(activeOutputType);
                      }}
                      disabled={!currentResult.persisted || deletingCurrent}
                      className="inline-flex items-center gap-1 rounded-xl border border-red-900 px-3 py-2 text-sm text-red-200 transition-colors hover:border-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingCurrent ? "Deleting..." : "Delete saved output"}
                    </button>
                  </div>
                )}

                {summarySaveMessage && (
                  <div
                    className={`rounded-2xl border px-3 py-2 text-xs ${
                      summarySaveTone === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-100"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                    }`}
                  >
                    {summarySaveMessage}
                  </div>
                )}
              </div>
            )}

            {canManageCanonicalSelection && activeSelectionField && (
              <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      Official {NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[activeSelectionField]}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      This chosen value powers the pre-send check and export.
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {packageSelectionSavingField === activeSelectionField
                      ? "Saving..."
                      : activeSelectionValue.trim()
                        ? "Official choice saved"
                        : "No official choice yet"}
                  </p>
                </div>

                {packageSelectionError && (
                  <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    {packageSelectionError}
                  </div>
                )}

                {packageSelectionLoading ? (
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-zinc-900/70" />
                    <div className="h-20 animate-pulse rounded-2xl bg-zinc-900/70" />
                  </div>
                ) : (
                  <>
                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Current official value
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
                        {summarizeSelectionValue(activeSelectionValue)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeSelectionField === "sectionPackage"
                        && currentResult?.content.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              void persistSelectionField(
                                activeSelectionField,
                                currentResult.content
                              );
                            }}
                            disabled={packageSelectionSavingField === activeSelectionField}
                            className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Use current package
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => setShowOfficialEditor((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                      >
                        Write your own
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            showOfficialEditor ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {showOfficialChoices && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Choices from this result
                        </p>
                        {parsedActiveOptions.map((option, index) => {
                          const isOfficial = option.trim() === activeSelectionValue.trim();
                          return (
                            <div
                              key={`${activeSelectionField}-${index}`}
                              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
                                  {option}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void persistSelectionField(activeSelectionField, option);
                                  }}
                                  disabled={packageSelectionSavingField === activeSelectionField}
                                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    isOfficial
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                      : "border-cyan-700 text-cyan-200 hover:border-cyan-500 hover:text-white"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {isOfficial ? "Official" : "Make official"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {showOfficialEditor && (
                      <div className="mt-4">
                        <textarea
                          value={activeSelectionDraftValue}
                          onChange={(event) =>
                            handleSelectionDraftChange(
                              activeSelectionField,
                              event.target.value
                            )
                          }
                          rows={activeSelectionField === "sectionPackage" ? 12 : 6}
                          placeholder={`Save the official ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[
                            activeSelectionField
                          ].toLowerCase()} here...`}
                          className="min-h-[144px] w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-cyan-500/50"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void persistSelectionField(
                                activeSelectionField,
                                activeSelectionDraftValue
                              );
                            }}
                            disabled={
                              packageSelectionSavingField === activeSelectionField
                              || !hasUnsavedSelectionDraft
                            }
                            className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save official value
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPackageSelectionDrafts((prev) => ({
                                ...prev,
                                [activeSelectionField]: "",
                              }));
                              void persistSelectionField(activeSelectionField, "");
                            }}
                            disabled={
                              packageSelectionSavingField === activeSelectionField
                              || (
                                !activeSelectionValue.trim()
                                && !activeSelectionDraftValue.trim()
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-red-900 px-3 py-2 text-sm text-red-200 transition-colors hover:border-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Clear official value
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function getPresetLabel(outputType: AdaptationOutputType): string {
  return getAdaptationPreset(outputType).label;
}

function labelContextSource(
  contextSource: ChapterAdaptationResult["contextSource"]
): string {
  switch (contextSource) {
    case "memory":
      return "Using memory context";
    case "story_bible":
      return "Using plan context";
    case "none":
    default:
      return "Using current draft only";
  }
}

function formatTimestamp(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatWorkflowStateSources(
  sources: ReturnType<typeof getAdaptationPreset>["stateSources"]
): string {
  return sources.map(formatAdaptationWorkflowStateSource).join(", ");
}

function buildAvailableWorkflowStateSummary({
  savedOutputTypes,
  usesOfficialPackageState,
  resultsByType,
  packageSelection,
}: {
  savedOutputTypes?: AdaptationOutputType[];
  usesOfficialPackageState: boolean;
  resultsByType: Partial<Record<AdaptationOutputType, ChapterAdaptationResult>>;
  packageSelection: NewsletterIssuePackageSelection | null;
}): string | null {
  const parts: string[] = [];

  const savedOutputLabels =
    savedOutputTypes
      ?.filter((outputType) => resultsByType[outputType]?.persisted)
      .map((outputType) => getPresetLabel(outputType)) ?? [];

  if (savedOutputLabels.length > 0) {
    parts.push(`Saved now: ${summarizeWorkflowLabels(savedOutputLabels)}`);
  }

  if (usesOfficialPackageState) {
    const selectedPackageLabels = getSelectedPackageLabels(packageSelection);
    if (selectedPackageLabels.length > 0) {
      parts.push(`Official now: ${summarizeWorkflowLabels(selectedPackageLabels)}`);
    }
  }

  return parts.length > 0 ? parts.join(" | ") : null;
}

function getSelectedPackageLabels(
  packageSelection: NewsletterIssuePackageSelection | null
): string[] {
  if (!packageSelection) {
    return [];
  }

  return (
    [
      packageSelection.subjectLine.trim() ? "subject line" : null,
      packageSelection.deck.trim() ? "deck" : null,
      packageSelection.hook.trim() ? "hook" : null,
      packageSelection.cta.trim() ? "CTA" : null,
      packageSelection.sectionPackage.trim() ? "section package" : null,
    ].filter((label): label is string => Boolean(label))
  );
}

function summarizeWorkflowLabels(labels: string[]): string {
  if (labels.length <= 2) {
    return labels.join(", ");
  }

  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
}

function parseNumberedOptions(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  const optionBlocks = trimmed
    .split(/\n+(?=\d+\.\s+)/)
    .map((block) => block.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return optionBlocks.length > 0 ? optionBlocks : [trimmed];
}

function describeOutputCardState({
  cached,
  generating,
  persisted,
}: {
  cached: boolean;
  generating: boolean;
  persisted: boolean;
}): string {
  if (generating) {
    return "Generating now";
  }

  if (cached && persisted) {
    return "Saved to project";
  }

  if (cached) {
    return "Ready in this session";
  }

  return "Not generated yet";
}

function summarizeSelectionValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "No official value chosen yet.";
  }

  if (trimmed.length <= 320) {
    return trimmed;
  }

  return `${trimmed.slice(0, 317)}...`;
}
