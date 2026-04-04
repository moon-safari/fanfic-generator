"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Mail,
  PencilRuler,
  RefreshCw,
  ScrollText,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { buildNewsletterMemorySnapshot } from "../../lib/newsletterMemory";
import {
  formatPlanningArtifactContent,
  getArtifactSubtypeLabel,
} from "../../lib/artifacts";
import { getAdaptationPreset } from "../../lib/adaptations";
import { getNewsletterModeConfig, getProjectUnitLabel } from "../../lib/projectMode";
import { useArtifacts } from "../../hooks/useArtifacts";
import type { ArtifactFocusRequest } from "../../hooks/useCodexFocus";
import { getErrorMessage, requestJson } from "../../lib/request";
import {
  buildReadinessGroups,
  formatArtifactListMeta,
  formatScopeLabel,
  formatTimestamp,
  getAggregateReadinessStatus,
  getNewsletterSelectionFieldForOutputType,
  getReadinessErrorMessage,
  getReadinessStatusClasses,
  getReadinessStatusLabel,
  labelArtifactKind,
  labelContextSource,
  parseNumberedOptions,
  READINESS_GROUPS,
  summarizeSelectionValue,
  useElementSize,
  useMinWidth,
} from "../../lib/artifactsHelpers";
import type {
  FilterOption,
  ReadinessGroupSummary,
  ScopeFilter,
  ScopeOption,
} from "../../lib/artifactsHelpers";
import type { SidePanelWidth } from "../../types/craft";
import type { AdaptationOutputType } from "../../types/adaptation";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleStyleGuideContent,
  BibleSynopsisContent,
} from "../../types/bible";
import type {
  PlanningArtifact,
  PlanningArtifactContent,
  ProjectArtifact,
  ProjectArtifactKind,
  ProjectArtifactSubtype,
} from "../../types/artifact";
import type {
  NewsletterIssuePackageSelection,
  NewsletterIssuePackageSelectionField,
  NewsletterIssuePackageSelectionValues,
  NewsletterIssueReadinessCheck,
  NewsletterIssueReadinessReport,
  NewsletterIssueReadinessStatus,
} from "../../types/newsletter";
import {
  EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES,
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS,
} from "../../types/newsletter";
import type {
  NewsletterModeConfig,
  ProjectMode,
  StoryModeConfig,
} from "../../types/story";
import NewsletterPublicationProfile from "./NewsletterPublicationProfile";
import NotesEditor from "../story-bible/NotesEditor";
import OutlineEditor from "../story-bible/OutlineEditor";
import StyleGuideEditor from "../story-bible/StyleGuideEditor";
import SynopsisEditor from "../story-bible/SynopsisEditor";

interface ArtifactsTabProps {
  storyId: string;
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  currentChapter: number;
  currentChapterId?: string;
  panelWidth: SidePanelWidth;
  focusMode?: boolean;
  focusRequest?: ArtifactFocusRequest | null;
  onInsert: (text: string) => void;
  onOpenInAdapt: (
    chapterNumber: number,
    outputType: AdaptationOutputType
  ) => void;
  onSummaryUpdated?: (chapterId: string, summary: string) => void;
  onModeConfigUpdated?: (modeConfig: NewsletterModeConfig) => void;
}

type ArtifactKindFilter = "all" | ProjectArtifactKind;
type ArtifactTypeFilter = "all" | ProjectArtifactSubtype;

export default function ArtifactsTab({
  storyId,
  storyTitle,
  projectMode,
  modeConfig,
  currentChapter,
  currentChapterId,
  panelWidth,
  focusMode = false,
  focusRequest = null,
  onInsert,
  onOpenInAdapt,
  onSummaryUpdated,
  onModeConfigUpdated,
}: ArtifactsTabProps) {
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const unitLabelAbbreviated = getProjectUnitLabel(projectMode, {
    abbreviated: true,
  });
  const {
    artifacts,
    chapterNumbers,
    loading,
    refreshing,
    deletingArtifactId,
    error,
    refresh,
    deleteArtifact,
    savePlanningArtifact,
    clearError,
  } = useArtifacts(storyId, projectMode);
  const newsletterModeConfig = getNewsletterModeConfig({
    projectMode,
    modeConfig,
  });
  const [kindFilter, setKindFilter] = useState<ArtifactKindFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ArtifactTypeFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [projectFiltersOpen, setProjectFiltersOpen] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null
  );
  const [focusNotice, setFocusNotice] = useState<ArtifactFocusRequest | null>(null);
  const [planningDrafts, setPlanningDrafts] = useState<
    Partial<Record<PlanningArtifact["sectionType"], PlanningArtifactContent>>
  >({});
  const [newsletterProfileDraft, setNewsletterProfileDraft] =
    useState<NewsletterModeConfig | null>(newsletterModeConfig);
  const [savingSections, setSavingSections] = useState<
    PlanningArtifact["sectionType"][]
  >([]);
  const [savingNewsletterProfile, setSavingNewsletterProfile] = useState(false);
  const [newsletterProfileError, setNewsletterProfileError] = useState<string | null>(
    null
  );
  const [showNewsletterSetup, setShowNewsletterSetup] = useState(false);
  const [readinessReport, setReadinessReport] =
    useState<NewsletterIssueReadinessReport | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [readinessRefreshNonce, setReadinessRefreshNonce] = useState(0);
  const [showReadinessDetails, setShowReadinessDetails] = useState(false);
  const [exportingBundle, setExportingBundle] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const saveTimersRef = useRef<
    Partial<Record<PlanningArtifact["sectionType"], ReturnType<typeof setTimeout>>>
  >({});
  const newsletterProfileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const contentViewportRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useMinWidth("(min-width: 768px)");
  const contentViewport = useElementSize(contentViewportRef);
  const splitViewMinWidth = panelWidth === "focus" ? 760 : 880;
  const isSplitView =
    panelWidth !== "normal"
    && isDesktop
    && contentViewport.width >= splitViewMinWidth
    && contentViewport.height >= 620;

  const adaptationCount = artifacts.filter(
    (artifact) => artifact.kind === "adaptation"
  ).length;
  const planningCount = artifacts.filter(
    (artifact) => artifact.kind === "planning"
  ).length;

  const familyArtifacts = useMemo(
    () =>
      kindFilter === "all"
        ? artifacts
        : artifacts.filter((artifact) => artifact.kind === kindFilter),
    [artifacts, kindFilter]
  );

  const showScopeControl = kindFilter !== "planning";

  const scopeOptions = useMemo(() => {
    const options: ScopeOption[] = [];

    if (kindFilter === "all") {
      options.push({
        key: "project",
        label: "Project-wide",
        count: planningCount,
      });
    }

    options.push({
      key: "current",
      label: `Current ${unitLabel} (${unitLabelAbbreviated} ${currentChapter})`,
      count: artifacts.filter(
        (artifact) =>
          artifact.kind === "adaptation"
          && artifact.chapterNumber === currentChapter
      ).length,
    });

    for (const chapterNumber of chapterNumbers) {
      options.push({
        key: chapterNumber,
        label: `${unitLabelCapitalized} ${chapterNumber}`,
        count: artifacts.filter(
          (artifact) =>
            artifact.kind === "adaptation"
            && artifact.chapterNumber === chapterNumber
        ).length,
      });
    }

    return options;
  }, [
    artifacts,
    chapterNumbers,
    currentChapter,
    kindFilter,
    planningCount,
    unitLabel,
    unitLabelAbbreviated,
    unitLabelCapitalized,
  ]);

  const effectiveScopeFilter =
    !showScopeControl
      ? "project"
      : scopeFilter !== "all"
        && !scopeOptions.some((option) => option.key === scopeFilter)
        ? "all"
        : scopeFilter;

  const scopedArtifacts = useMemo(
    () =>
      familyArtifacts.filter((artifact) => {
        if (effectiveScopeFilter === "all") {
          return true;
        }

        if (effectiveScopeFilter === "project") {
          return artifact.kind === "planning";
        }

        if (effectiveScopeFilter === "current") {
          return (
            artifact.kind === "adaptation"
            && artifact.chapterNumber === currentChapter
          );
        }

        return (
          artifact.kind === "adaptation"
          && artifact.chapterNumber === effectiveScopeFilter
        );
      }),
    [currentChapter, effectiveScopeFilter, familyArtifacts]
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(scopedArtifacts.map((artifact) => artifact.subtype))).sort(),
    [scopedArtifacts]
  );

  const effectiveTypeFilter =
    typeFilter !== "all" && !typeOptions.includes(typeFilter)
      ? "all"
      : typeFilter;
  const projectFilterSummary = [
    effectiveTypeFilter !== "all"
      ? getArtifactSubtypeLabel(effectiveTypeFilter)
      : null,
    showScopeControl && effectiveScopeFilter !== "all"
      ? formatScopeLabel(effectiveScopeFilter, currentChapter, projectMode)
      : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const secondaryFiltersActive =
    effectiveTypeFilter !== "all"
    || (showScopeControl && effectiveScopeFilter !== "all");
  const showProjectFilters = projectFiltersOpen || secondaryFiltersActive;

  const filteredArtifacts = useMemo(
    () =>
      scopedArtifacts.filter((artifact) =>
        effectiveTypeFilter === "all"
          ? true
          : artifact.subtype === effectiveTypeFilter
      ),
    [effectiveTypeFilter, scopedArtifacts]
  );

  const selectedArtifact =
    filteredArtifacts.find((artifact) => artifact.id === selectedArtifactId)
    ?? filteredArtifacts[0]
    ?? null;

  const selectedPlanningContent =
    selectedArtifact?.kind === "planning"
      ? planningDrafts[selectedArtifact.sectionType] ?? selectedArtifact.rawContent
      : null;

  const selectedArtifactText =
    selectedArtifact?.kind === "planning" && selectedPlanningContent
      ? formatPlanningArtifactContent(
          selectedArtifact.sectionType,
          selectedPlanningContent,
          undefined,
          projectMode
        )
      : selectedArtifact?.content ?? "";
  const newsletterMemory =
    projectMode === "newsletter" && newsletterProfileDraft
      ? buildNewsletterMemorySnapshot({
          storyTitle,
          modeConfig: newsletterProfileDraft,
          synopsis: artifacts.find(
            (artifact): artifact is PlanningArtifact =>
              artifact.kind === "planning" && artifact.sectionType === "synopsis"
          )?.rawContent as BibleSynopsisContent | undefined,
          styleGuide: artifacts.find(
            (artifact): artifact is PlanningArtifact =>
              artifact.kind === "planning" && artifact.sectionType === "style_guide"
          )?.rawContent as BibleStyleGuideContent | undefined,
          outline: artifacts.find(
            (artifact): artifact is PlanningArtifact =>
              artifact.kind === "planning" && artifact.sectionType === "outline"
          )?.rawContent as BibleOutlineContent | undefined,
          notes: artifacts.find(
            (artifact): artifact is PlanningArtifact =>
              artifact.kind === "planning" && artifact.sectionType === "notes"
          )?.rawContent as BibleNotesContent | undefined,
          currentUnitNumber: currentChapter,
        })
      : null;
  const canExportIssueBundle =
    projectMode === "newsletter"
    && Boolean(newsletterProfileDraft)
    && Boolean(currentChapterId);
  const visibleReadinessChecks = useMemo(() => {
    if (!readinessReport) {
      return [];
    }

    const nonReadyChecks = readinessReport.checks.filter(
      (check) => check.status !== "ready"
    );

    return nonReadyChecks.length > 0 ? nonReadyChecks : readinessReport.checks;
  }, [readinessReport]);
  const hiddenReadyCheckCount = readinessReport
    ? readinessReport.checks.length - visibleReadinessChecks.length
    : 0;
  const readinessGroups = useMemo(
    () => buildReadinessGroups(readinessReport),
    [readinessReport]
  );
  const nextRecommendedPreset = readinessReport?.nextRecommendedOutputType
    ? getAdaptationPreset(readinessReport.nextRecommendedOutputType)
    : null;
  const newsletterArtifactRefreshToken = useMemo(
    () =>
      artifacts
        .filter(
          (artifact) =>
            artifact.kind === "adaptation"
            && artifact.chapterNumber === currentChapter
        )
        .map((artifact) => `${artifact.id}:${artifact.updatedAt}`)
        .join("|"),
    [artifacts, currentChapter]
  );

  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      for (const timer of Object.values(timers)) {
        if (timer) {
          clearTimeout(timer);
        }
      }

      if (newsletterProfileTimerRef.current) {
        clearTimeout(newsletterProfileTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setKindFilter("planning");
      setTypeFilter(focusRequest.sectionType);
      setScopeFilter("project");
      setFocusNotice(focusRequest);

      const targetArtifact = artifacts.find(
        (artifact) =>
          artifact.kind === "planning"
          && artifact.sectionType === focusRequest.sectionType
      );

      if (targetArtifact) {
        setSelectedArtifactId(targetArtifact.id);
      }
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [artifacts, focusRequest]);

  useEffect(() => {
    if (projectMode !== "newsletter" || !currentChapterId) {
      setReadinessReport(null);
      setReadinessError(null);
      setReadinessLoading(false);
      return;
    }

    let cancelled = false;
    setReadinessLoading(true);
    setReadinessError(null);

    void requestJson<{ report: NewsletterIssueReadinessReport }>(
      `/api/newsletter/${storyId}/preflight?chapterId=${currentChapterId}`
    )
      .then((data) => {
        if (!cancelled) {
          setReadinessReport(data.report);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReadinessError(getReadinessErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReadinessLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentChapterId,
    newsletterArtifactRefreshToken,
    projectMode,
    readinessRefreshNonce,
    storyId,
  ]);

  const updateSavingState = (
    sectionType: PlanningArtifact["sectionType"],
    saving: boolean
  ) => {
    setSavingSections((prev) => {
      if (saving) {
        return prev.includes(sectionType) ? prev : [...prev, sectionType];
      }

      return prev.filter((item) => item !== sectionType);
    });
  };

  const handlePlanningChange = (nextContent: PlanningArtifactContent) => {
    if (!selectedArtifact || selectedArtifact.kind !== "planning") {
      return;
    }

    const artifact = selectedArtifact;
    setPlanningDrafts((prev) => ({
      ...prev,
      [artifact.sectionType]: nextContent,
    }));

    const existingTimer = saveTimersRef.current[artifact.sectionType];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    saveTimersRef.current[artifact.sectionType] = setTimeout(() => {
      updateSavingState(artifact.sectionType, true);
      void savePlanningArtifact(artifact, nextContent)
        .then((savedArtifact) => {
          setSelectedArtifactId(savedArtifact.id);
          setPlanningDrafts((prev) => ({
            ...prev,
            [savedArtifact.sectionType]: savedArtifact.rawContent,
          }));
        })
        .catch(() => {
          // Hook already surfaces the error state.
        })
        .finally(() => {
          updateSavingState(artifact.sectionType, false);
        });
    }, 700);
  };

  const handleNewsletterProfileChange = (nextValue: NewsletterModeConfig) => {
    setNewsletterProfileDraft(nextValue);
    setNewsletterProfileError(null);

    if (newsletterProfileTimerRef.current) {
      clearTimeout(newsletterProfileTimerRef.current);
    }

    newsletterProfileTimerRef.current = setTimeout(() => {
      setSavingNewsletterProfile(true);
      void requestJson<{ modeConfig: NewsletterModeConfig }>(
        `/api/stories/${storyId}/mode-config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modeConfig: nextValue }),
        }
      )
        .then((data) => {
          setNewsletterProfileDraft(data.modeConfig);
          onModeConfigUpdated?.(data.modeConfig);
          setReadinessRefreshNonce((prev) => prev + 1);
        })
        .catch((error: unknown) => {
          setNewsletterProfileError(
            error instanceof Error
              ? error.message
              : "Failed to save newsletter profile"
          );
        })
        .finally(() => {
          setSavingNewsletterProfile(false);
        });
    }, 700);
  };

  const exportIssueBundle = async (mode: "copy" | "download") => {
    if (!canExportIssueBundle || !currentChapterId) {
      return;
    }

    setExportingBundle(true);
    setExportError(null);

    try {
      const data = await requestJson<{
        filename: string;
        content: string;
        missingOutputs: AdaptationOutputType[];
      }>(`/api/newsletter/${storyId}/bundle?chapterId=${currentChapterId}`);

      if (mode === "copy") {
        await navigator.clipboard.writeText(data.content);
      } else {
        const blob = new Blob([data.content], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error: unknown) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Failed to export issue bundle"
      );
    } finally {
      setExportingBundle(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#13101e]">
      <div
        className={`shrink-0 border-b border-zinc-800 px-4 ${
          focusMode ? "py-2.5" : "py-3"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold text-white">Project</h2>
            </div>
            {focusMode ? (
              <p className="mt-1 text-xs text-zinc-500">
                {artifacts.length} saved | {adaptationCount} outputs | {planningCount} plans
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                Saved outputs and plans for this project.
              </p>
            )}
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

        {!focusMode && (
          <p className="mt-4 text-[11px] text-zinc-500">
            {artifacts.length} saved | {adaptationCount} outputs | {planningCount} plans
          </p>
        )}

        <div className={`${focusMode ? "mt-3" : "mt-4"} flex flex-wrap gap-2`}>
          <FilterChip
            label="All"
            count={artifacts.length}
            active={kindFilter === "all"}
            onClick={() => setKindFilter("all")}
          />
          <FilterChip
            label="Outputs"
            count={adaptationCount}
            active={kindFilter === "adaptation"}
            onClick={() => setKindFilter("adaptation")}
          />
          <FilterChip
            label="Plans"
            count={planningCount}
            active={kindFilter === "planning"}
            onClick={() => setKindFilter("planning")}
          />
        </div>

        <div
          className={`rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3 ${
            focusMode ? "mt-2" : "mt-3"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              {focusMode ? (
                <p className="text-xs text-zinc-400">
                  {secondaryFiltersActive
                    ? `Filters: ${projectFilterSummary}`
                    : "Filters: showing everything in this section."}
                </p>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Filters
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {secondaryFiltersActive
                      ? projectFilterSummary
                      : "Showing everything in this section."}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setProjectFiltersOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                showProjectFilters
                  ? "border-zinc-600 bg-zinc-900 text-white"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
              }`}
            >
              {showProjectFilters ? "Hide filters" : "More filters"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showProjectFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {showProjectFilters && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <FilterMenu
                label="Type"
                selectedKey={String(effectiveTypeFilter)}
                valueLabel={
                  effectiveTypeFilter === "all"
                    ? `All types (${scopedArtifacts.length})`
                    : getArtifactSubtypeLabel(effectiveTypeFilter)
                }
                options={[
                  {
                    key: "all",
                    label: `All types (${scopedArtifacts.length})`,
                  },
                  ...typeOptions.map((type) => ({
                    key: type,
                    label: `${getArtifactSubtypeLabel(type)}`,
                  })),
                ]}
                onSelect={(value) => setTypeFilter(value as ArtifactTypeFilter)}
              />

              {showScopeControl ? (
                <FilterMenu
                  label="Scope"
                  selectedKey={String(effectiveScopeFilter)}
                  valueLabel={formatScopeLabel(
                    effectiveScopeFilter,
                    currentChapter,
                    projectMode
                  )}
                  options={[
                    {
                      key: "all",
                      label: `All scopes (${familyArtifacts.length})`,
                    },
                    ...scopeOptions.map((option) => ({
                      key: String(option.key),
                      label: `${option.label} (${option.count})`,
                    })),
                  ]}
                  onSelect={(value) =>
                    setScopeFilter(
                      value === "all"
                        ? "all"
                        : value === "project"
                          ? "project"
                          : value === "current"
                            ? "current"
                            : Number(value)
                    )
                  }
                />
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Scope
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    Plans are project-wide by default.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

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

        {focusNotice && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-purple-500/25 bg-purple-500/10 px-3 py-2.5 text-sm text-purple-100">
            <div className="min-w-0">
              <p className="font-medium text-white">
                Reviewing planning drift
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-purple-100/80">
                {focusNotice.targetLabel
                  ? `Opened ${getArtifactSubtypeLabel(focusNotice.sectionType)} for "${focusNotice.targetLabel}".`
                  : `Opened ${getArtifactSubtypeLabel(focusNotice.sectionType)} from a planning note.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFocusNotice(null)}
              className="shrink-0 text-xs font-medium text-purple-200 transition-colors hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div
        ref={contentViewportRef}
        className={`min-h-0 flex-1 overflow-y-auto px-4 ${
          focusMode ? "py-3" : "py-4"
        }`}
      >
        <div className="space-y-4">
          {projectMode === "newsletter" && newsletterProfileDraft && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      Pre-send check
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      A quick send/no-send pass for the current issue. It checks
                      your saved setup, official package choices, and final
                      export state.
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Current issue
                    {readinessReport
                      ? ` | ${getReadinessStatusLabel(readinessReport.status)}`
                      : ""}
                  </p>
                </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/20 p-3">
                {readinessLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-900" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-900" />
                  </div>
                ) : readinessError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3">
                    <p className="text-sm font-medium text-red-100">
                      Pre-send check is unavailable right now
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-100/90">
                      {readinessError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReadinessRefreshNonce((prev) => prev + 1)}
                      className="mt-3 rounded-xl border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-100 transition-colors hover:border-red-300 hover:text-white"
                    >
                      Try again
                    </button>
                  </div>
                ) : readinessReport ? (
                  <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {readinessReport.readyCount} of {readinessReport.totalCount} checks ready
                          </p>
                          <p className="mt-2 text-xs leading-5 text-zinc-400">
                            {readinessReport.readyCount} ready
                            {` | ${readinessReport.attentionCount} need attention`}
                            {` | ${readinessReport.blockerCount} blocking`}
                          </p>
                        </div>
                      <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
                        <p className="text-xs text-zinc-500">
                          {readinessReport.bundleFilename}
                        </p>
                          {nextRecommendedPreset && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenInAdapt(
                                currentChapter,
                                readinessReport.nextRecommendedOutputType!
                              )
                              }
                              className="rounded-xl border border-cyan-700 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white"
                            >
                              Open next step
                            </button>
                          )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {readinessGroups.map((group) => {
                        const preset = group.recommendedOutputType
                          ? getAdaptationPreset(group.recommendedOutputType)
                          : null;

                        return (
                          <div
                            key={group.key}
                            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-white">
                                    {group.label}
                                  </p>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getReadinessStatusClasses(
                                      group.status
                                    )}`}
                                  >
                                    {getReadinessStatusLabel(group.status)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-zinc-400">
                                  {group.detail}
                                </p>
                              </div>

                              {preset && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenInAdapt(currentChapter, group.recommendedOutputType!)
                                  }
                                  className="shrink-0 rounded-xl border border-cyan-700 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white"
                                >
                                  Open {preset.label}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReadinessDetails((prev) => !prev)}
                        className="text-xs font-medium text-zinc-400 transition-colors hover:text-white"
                      >
                        {showReadinessDetails ? "Hide detailed checks" : "Show detailed checks"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadinessRefreshNonce((prev) => prev + 1)}
                        className="text-xs font-medium text-zinc-400 transition-colors hover:text-white"
                      >
                        Refresh check
                      </button>
                    </div>

                    {showReadinessDetails && (
                      <div className="space-y-2 border-t border-zinc-800 pt-3">
                        {visibleReadinessChecks.map((check) => {
                          const preset = check.recommendedOutputType
                            ? getAdaptationPreset(check.recommendedOutputType)
                            : null;

                          return (
                            <div
                              key={check.key}
                              className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-white">
                                      {check.label}
                                    </p>
                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getReadinessStatusClasses(
                                        check.status
                                      )}`}
                                    >
                                      {getReadinessStatusLabel(check.status)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                                    {check.detail}
                                  </p>
                                </div>

                                {preset && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenInAdapt(currentChapter, check.recommendedOutputType!)
                                    }
                                    className="shrink-0 rounded-xl border border-cyan-700 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white"
                                  >
                                    Open {preset.label}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {hiddenReadyCheckCount > 0 && (
                          <p className="text-xs text-zinc-500">
                            {hiddenReadyCheckCount} ready check
                            {hiddenReadyCheckCount === 1 ? "" : "s"} hidden to keep the detailed view focused.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Readiness will appear once the current issue is available.
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void exportIssueBundle("download");
                  }}
                  disabled={!canExportIssueBundle || exportingBundle}
                  className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    {exportingBundle ? "Preparing..." : "Download bundle"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void exportIssueBundle("copy");
                    }}
                    disabled={exportingBundle}
                    className="hidden items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
                  >
                    <Copy className="h-4 w-4" />
                    {exportingBundle ? "Preparing..." : "Copy bundle"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExportOptions((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:hidden"
                  >
                    {showExportOptions ? "Hide export options" : "More export options"}
                    <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      showExportOptions ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showExportOptions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void exportIssueBundle("copy");
                    }}
                    disabled={!canExportIssueBundle || exportingBundle}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Copy className="h-4 w-4" />
                    {exportingBundle ? "Preparing..." : "Copy bundle"}
                  </button>
                </div>
              )}

              {exportError && (
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {exportError}
                </div>
              )}
            </div>
          )}

          {projectMode === "newsletter" && newsletterProfileDraft && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      Newsletter setup
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Publication profile, recurring sections, and saved setup.
                      Open this only when you want to change the setup.
                    </p>
                  </div>
                <button
                  type="button"
                  onClick={() => setShowNewsletterSetup((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    showNewsletterSetup
                      ? "border-zinc-600 bg-zinc-900 text-white"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  {showNewsletterSetup ? "Hide setup" : "Open setup"}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      showNewsletterSetup ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showNewsletterSetup && (
                <div className="mt-4 space-y-4">
                  {newsletterMemory && (
                    <NewsletterMemoryPanel
                      snapshot={newsletterMemory}
                      currentChapter={currentChapter}
                    />
                  )}

                  <NewsletterPublicationProfile
                    value={newsletterProfileDraft}
                    saving={savingNewsletterProfile}
                    error={newsletterProfileError}
                    onChange={handleNewsletterProfileChange}
                  />
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-3xl bg-zinc-900/70"
                />
              ))}
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 px-5 py-8 text-center">
              <ScrollText className="mx-auto h-6 w-6 text-zinc-500" />
              <h3 className="mt-3 text-sm font-semibold text-white">
                Nothing matches these filters
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Saved outputs and plans show up here once you create them.
              </p>
            </div>
          ) : isSplitView ? (
            <div className="grid min-h-[38rem] gap-4 grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
              <ArtifactList
                artifacts={filteredArtifacts}
                projectMode={projectMode}
                selectedArtifactId={selectedArtifact?.id ?? null}
                splitView
                onSelectArtifact={setSelectedArtifactId}
              />
              <ArtifactDetail
                artifact={selectedArtifact}
                storyId={storyId}
                projectMode={projectMode}
                artifactText={selectedArtifactText}
                planningContent={selectedPlanningContent}
                savingSections={savingSections}
                deletingArtifactId={deletingArtifactId}
                splitView
                onPlanningChange={handlePlanningChange}
                onInsert={onInsert}
                onCopy={() => {
                  void navigator.clipboard.writeText(selectedArtifactText);
                }}
                onOpenInAdapt={onOpenInAdapt}
                onSummaryUpdated={onSummaryUpdated}
                onPackageSelectionUpdated={(chapterId) => {
                  if (chapterId === currentChapterId) {
                    setReadinessRefreshNonce((prev) => prev + 1);
                  }
                }}
                onDeleteArtifact={(artifact) => {
                  void deleteArtifact(artifact);
                }}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <ArtifactList
                artifacts={filteredArtifacts}
                projectMode={projectMode}
                selectedArtifactId={selectedArtifact?.id ?? null}
                splitView={false}
                onSelectArtifact={setSelectedArtifactId}
              />
              <ArtifactDetail
                artifact={selectedArtifact}
                storyId={storyId}
                projectMode={projectMode}
                artifactText={selectedArtifactText}
                planningContent={selectedPlanningContent}
                savingSections={savingSections}
                deletingArtifactId={deletingArtifactId}
                splitView={false}
                onPlanningChange={handlePlanningChange}
                onInsert={onInsert}
                onCopy={() => {
                  void navigator.clipboard.writeText(selectedArtifactText);
                }}
                onOpenInAdapt={onOpenInAdapt}
                onSummaryUpdated={onSummaryUpdated}
                onPackageSelectionUpdated={(chapterId) => {
                  if (chapterId === currentChapterId) {
                    setReadinessRefreshNonce((prev) => prev + 1);
                  }
                }}
                onDeleteArtifact={(artifact) => {
                  void deleteArtifact(artifact);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtifactList({
  artifacts,
  projectMode,
  selectedArtifactId,
  splitView = true,
  onSelectArtifact,
}: {
  artifacts: ProjectArtifact[];
  projectMode: ProjectMode;
  selectedArtifactId: string | null;
  splitView?: boolean;
  onSelectArtifact: (artifactId: string) => void;
}) {
  const unitLabelAbbreviated = getProjectUnitLabel(projectMode, {
    abbreviated: true,
  });

  return (
    <section
      className={`rounded-3xl border border-zinc-800 bg-zinc-950/45 p-3 ${
        splitView ? "min-h-0 overflow-y-auto" : ""
      }`}
    >
      <div
        className={`mb-4 border-b border-zinc-800 px-4 pb-4 ${
          splitView
            ? "sticky top-0 z-10 -mx-3 -mt-3 bg-[#161120]/95 pt-4 backdrop-blur"
            : "-mx-3 -mt-3 pt-4"
        }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">Project items</h3>
              <p className="text-xs text-zinc-500">
                Pick one to view, edit, or reuse it.
              </p>
            </div>
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
              {artifacts.length}
            </span>
        </div>
      </div>

        <div className="space-y-2">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              type="button"
            onClick={() => onSelectArtifact(artifact.id)}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                selectedArtifactId === artifact.id
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {artifact.title}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-zinc-500">
                  {artifact.description}
                </p>
                <p className="mt-2 text-[11px] text-zinc-400">
                  {formatArtifactListMeta(
                    artifact,
                    unitLabelAbbreviated
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
  );
}

function ArtifactDetail({
  artifact,
  storyId,
  projectMode,
  artifactText,
  planningContent,
  savingSections,
  deletingArtifactId,
  splitView = true,
  onPlanningChange,
  onInsert,
  onCopy,
  onOpenInAdapt,
  onSummaryUpdated,
  onPackageSelectionUpdated,
  onDeleteArtifact,
}: {
  artifact: ProjectArtifact | null;
  storyId: string;
  projectMode: ProjectMode;
  artifactText: string;
  planningContent: PlanningArtifactContent | null;
  savingSections: PlanningArtifact["sectionType"][];
  deletingArtifactId: string | null;
  splitView?: boolean;
  onPlanningChange: (content: PlanningArtifactContent) => void;
  onInsert: (text: string) => void;
  onCopy: () => void;
  onOpenInAdapt: (
    chapterNumber: number,
    outputType: AdaptationOutputType
  ) => void;
  onSummaryUpdated?: (chapterId: string, summary: string) => void;
  onPackageSelectionUpdated?: (chapterId: string) => void;
  onDeleteArtifact: (artifact: Extract<ProjectArtifact, { kind: "adaptation" }>) => void;
}) {
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showItemActions, setShowItemActions] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summarySaveMessage, setSummarySaveMessage] = useState<string | null>(null);
  const [summarySaveTone, setSummarySaveTone] = useState<"success" | "error">(
    "success"
  );
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
  const [packageSelectionMessage, setPackageSelectionMessage] = useState<string | null>(
    null
  );
  const [packageSelectionTone, setPackageSelectionTone] =
    useState<"success" | "error">("success");
  const [showOfficialEditor, setShowOfficialEditor] = useState(false);

  useEffect(() => {
    setSavingSummary(false);
    setSummarySaveMessage(null);
    setSummarySaveTone("success");
    setPackageSelection(null);
    setPackageSelectionDrafts(EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES);
    setPackageSelectionLoading(false);
    setPackageSelectionSavingField(null);
    setPackageSelectionError(null);
    setPackageSelectionMessage(null);
    setPackageSelectionTone("success");
    setShowOfficialEditor(false);
  }, [artifact?.id]);

  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const canPromoteArtifactToSummary =
    artifact?.kind === "adaptation"
    && (artifact.subtype === "short_summary" || artifact.subtype === "newsletter_recap")
    && artifact.content.trim().length > 0;
  const selectionField =
    projectMode === "newsletter" && artifact?.kind === "adaptation"
      ? getNewsletterSelectionFieldForOutputType(artifact.subtype)
      : null;
  const currentSelectionValue = selectionField
    ? packageSelection?.[selectionField] ?? ""
    : "";
  const currentSelectionDraftValue = selectionField
    ? packageSelectionDrafts[selectionField] ?? ""
    : "";
  const hasUnsavedSelectionDraft =
    selectionField !== null
    && currentSelectionDraftValue.trim() !== currentSelectionValue.trim();
  const parsedArtifactOptions =
    selectionField !== null ? parseNumberedOptions(artifact?.content ?? "") : [];
  const showArtifactOfficialChoices =
    selectionField !== null
    && selectionField !== "sectionPackage"
    && parsedArtifactOptions.length > 1;
  const singleArtifactOfficialValue =
    selectionField === null
      ? ""
      : showArtifactOfficialChoices
        ? ""
        : parsedArtifactOptions[0] ?? artifact?.content.trim() ?? "";

  const handlePromoteArtifactToSummary = async () => {
    if (!canPromoteArtifactToSummary || !artifact || artifact.kind !== "adaptation") {
      return;
    }

    setSavingSummary(true);
    setSummarySaveMessage(null);
    setSummarySaveTone("success");

    try {
      const data = await requestJson<{ summary: string }>(
        `/api/chapters/${artifact.chapterId}/summary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: artifact.content,
          }),
        }
      );

      onSummaryUpdated?.(artifact.chapterId, data.summary);
      setSummarySaveMessage(
        `${unitLabelCapitalized} summary updated from ${artifact.title.toLowerCase()}.`
      );
    } catch (saveError: unknown) {
      setSummarySaveTone("error");
      setSummarySaveMessage(
        getErrorMessage(saveError, `Failed to update the ${unitLabelCapitalized.toLowerCase()} summary`)
      );
    } finally {
      setSavingSummary(false);
    }
  };

  useEffect(() => {
    if (
      !artifact
      || projectMode !== "newsletter"
      || artifact.kind !== "adaptation"
      || !selectionField
    ) {
      return;
    }

    let cancelled = false;
    setPackageSelectionLoading(true);
    setPackageSelectionError(null);

    void requestJson<{ selection: NewsletterIssuePackageSelection }>(
      `/api/newsletter/${storyId}/package?chapterId=${artifact.chapterId}`
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
            "Failed to load official package state"
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
  }, [artifact, projectMode, selectionField, storyId]);

  const persistSelectionField = async (
    field: NewsletterIssuePackageSelectionField,
    value: string
  ) => {
    if (!artifact || artifact.kind !== "adaptation") {
      return;
    }

    setPackageSelectionSavingField(field);
    setPackageSelectionError(null);
    setPackageSelectionMessage(null);
    setPackageSelectionTone("success");

    try {
      const data = await requestJson<{ selection: NewsletterIssuePackageSelection }>(
        `/api/newsletter/${storyId}/package`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: artifact.chapterId,
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
      setPackageSelectionMessage(
        value.trim()
          ? `Official ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[
              field
            ].toLowerCase()} updated from this saved output.`
          : `Official ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[
              field
            ].toLowerCase()} cleared.`
      );
      onPackageSelectionUpdated?.(artifact.chapterId);
    } catch (selectionError: unknown) {
      setPackageSelectionTone("error");
      setPackageSelectionError(
        getErrorMessage(
          selectionError,
          "Failed to update official package state"
        )
      );
    } finally {
      setPackageSelectionSavingField(null);
    }
  };

  if (!artifact) {
    return null;
  }

  return (
    <section
      className={`rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 ${
        splitView ? "min-h-0 overflow-y-auto" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{artifact.title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            {artifact.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowItemDetails((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {showItemDetails ? "Hide details" : "Show details"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              showItemDetails ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {artifact.persisted && artifact.updatedAt
          ? `Last updated ${formatTimestamp(artifact.updatedAt)}`
          : "Not yet saved to the project"}
      </p>

      {showItemDetails && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            {labelArtifactKind(artifact.kind)}
          </span>
          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
            {getArtifactSubtypeLabel(artifact.subtype)}
          </span>
          {artifact.kind === "adaptation" ? (
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
              {unitLabelCapitalized} {artifact.chapterNumber}
            </span>
          ) : (
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
              Project-wide
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs ${
              artifact.contextSource === "codex"
                ? "bg-cyan-500/15 text-cyan-200"
                : artifact.contextSource === "story_bible"
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-zinc-900 text-zinc-300"
            }`}
          >
            {labelContextSource(artifact.contextSource)}
          </span>
        </div>
      )}

      {artifact.kind === "planning" ? (
        <PlanningArtifactEditor
          artifact={artifact}
          projectMode={projectMode}
          content={planningContent ?? artifact.rawContent}
          saving={savingSections.includes(artifact.sectionType)}
          onChange={onPlanningChange}
        />
      ) : (
        <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-800 bg-black/30 p-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-100">
            {artifact.content}
          </pre>
        </div>
      )}

      {selectionField && artifact.kind === "adaptation" && (
        <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                Official {NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[selectionField]}
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Make this saved output part of the issue package truth.
              </p>
            </div>
            <p className="text-xs text-zinc-400">
              {packageSelectionSavingField === selectionField
                ? "Saving..."
                : currentSelectionValue.trim()
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
                  {summarizeSelectionValue(currentSelectionValue)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {singleArtifactOfficialValue && (
                  <button
                    type="button"
                    onClick={() => {
                      void persistSelectionField(
                        selectionField,
                        singleArtifactOfficialValue
                      );
                    }}
                    disabled={
                      packageSelectionSavingField === selectionField
                      || singleArtifactOfficialValue.trim() === currentSelectionValue.trim()
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    {singleArtifactOfficialValue.trim() === currentSelectionValue.trim()
                      ? "Already official"
                      : "Make this official"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowOfficialEditor((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Edit official value
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showOfficialEditor ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showArtifactOfficialChoices && (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Choices from this saved output
                  </p>
                  {parsedArtifactOptions.map((option, index) => {
                    const isOfficial = option.trim() === currentSelectionValue.trim();
                    return (
                      <div
                        key={`${selectionField}-${index}`}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
                            {option}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              void persistSelectionField(selectionField, option);
                            }}
                            disabled={packageSelectionSavingField === selectionField}
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
                    value={currentSelectionDraftValue}
                    onChange={(event) =>
                      setPackageSelectionDrafts((prev) => ({
                        ...prev,
                        [selectionField]: event.target.value,
                      }))
                    }
                    rows={selectionField === "sectionPackage" ? 12 : 6}
                    placeholder={`Save the official ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[
                      selectionField
                    ].toLowerCase()} here...`}
                    className="min-h-[144px] w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-cyan-500/50"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void persistSelectionField(
                          selectionField,
                          currentSelectionDraftValue
                        );
                      }}
                      disabled={
                        packageSelectionSavingField === selectionField
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
                          [selectionField]: "",
                        }));
                        void persistSelectionField(selectionField, "");
                      }}
                      disabled={
                        packageSelectionSavingField === selectionField
                        || (!currentSelectionValue.trim()
                          && !currentSelectionDraftValue.trim())
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

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onInsert(artifactText)}
            className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            Use in editor
          </button>
          {canPromoteArtifactToSummary && (
            <button
              type="button"
              onClick={() => {
                void handlePromoteArtifactToSummary();
              }}
              disabled={savingSummary}
              className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PencilRuler className="h-4 w-4" />
              {savingSummary
                ? "Saving summary..."
                : `Save as ${unitLabelCapitalized.toLowerCase()} summary`}
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="hidden items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:inline-flex"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          {artifact.kind === "adaptation" && (
            <button
              type="button"
              onClick={() =>
                onOpenInAdapt(artifact.chapterNumber, artifact.subtype)
              }
              className="hidden items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white sm:inline-flex"
            >
              <WandSparkles className="h-4 w-4" />
              Open in Outputs
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowItemActions((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {showItemActions ? "Hide actions" : "More actions"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showItemActions ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {showItemActions && (
          <div className="mt-3 flex flex-wrap gap-2">
          {canPromoteArtifactToSummary && (
            <button
              type="button"
              onClick={() => {
                void handlePromoteArtifactToSummary();
              }}
              disabled={savingSummary}
              className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white sm:hidden disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PencilRuler className="h-4 w-4" />
              {savingSummary
                ? "Saving summary..."
                : `Save as ${unitLabelCapitalized.toLowerCase()} summary`}
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white sm:hidden"
          >
          <Copy className="h-4 w-4" />
          Copy
        </button>
        {artifact.kind === "adaptation" && (
          <>
              <button
                type="button"
                onClick={() =>
                  onOpenInAdapt(artifact.chapterNumber, artifact.subtype)
                }
                className="inline-flex items-center gap-1 rounded-xl border border-cyan-700 px-3 py-2 text-sm text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white sm:hidden"
              >
                <WandSparkles className="h-4 w-4" />
                Open in Outputs
              </button>
            <button
              type="button"
              onClick={() => onDeleteArtifact(artifact)}
              disabled={deletingArtifactId === artifact.id}
              className="inline-flex items-center gap-1 rounded-xl border border-red-900 px-3 py-2 text-sm text-red-200 transition-colors hover:border-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deletingArtifactId === artifact.id ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
          </div>
        )}

      {summarySaveMessage && (
        <div
          className={`mt-3 rounded-2xl border px-3 py-2 text-xs ${
            summarySaveTone === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {summarySaveMessage}
        </div>
      )}

      {packageSelectionMessage && (
        <div
          className={`mt-3 rounded-2xl border px-3 py-2 text-xs ${
            packageSelectionTone === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {packageSelectionMessage}
        </div>
      )}
      </section>
    );
  }

function PlanningArtifactEditor({
  artifact,
  projectMode,
  content,
  saving,
  onChange,
}: {
  artifact: PlanningArtifact;
  projectMode: ProjectMode;
  content: PlanningArtifactContent;
  saving: boolean;
  onChange: (content: PlanningArtifactContent) => void;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-zinc-800 bg-black/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-zinc-900 p-2 text-zinc-300">
            <PencilRuler className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Edit plan</p>
            <p className="text-xs text-zinc-500">
              Changes save automatically.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs ${
            saving
              ? "bg-cyan-500/15 text-cyan-200"
              : artifact.persisted
                ? "bg-emerald-500/15 text-emerald-200"
                : "bg-zinc-900 text-zinc-300"
          }`}
        >
          {saving ? "Saving..." : artifact.persisted ? "Saved" : "Draft"}
        </span>
      </div>

      {renderPlanningEditor(artifact, content, onChange, projectMode)}
    </div>
  );
}

function renderPlanningEditor(
  artifact: PlanningArtifact,
  content: PlanningArtifactContent,
  onChange: (content: PlanningArtifactContent) => void,
  projectMode: ProjectMode
) {
  switch (artifact.sectionType) {
    case "synopsis":
      return (
        <SynopsisEditor
          content={content as BibleSynopsisContent}
          onSave={(next) => onChange(next)}
        />
      );
    case "style_guide":
      return (
        <StyleGuideEditor
          content={content as BibleStyleGuideContent}
          onSave={(next) => onChange(next)}
        />
      );
    case "outline":
      return (
        <OutlineEditor
          content={content as BibleOutlineContent}
          projectMode={projectMode}
          onSave={(next) => onChange(next)}
        />
      );
    case "notes":
      return (
        <NotesEditor
          content={content as BibleNotesContent}
          projectMode={projectMode}
          onSave={(next) => onChange(next)}
        />
      );
  }
}

function FilterMenu<T extends string | number>({
  label,
  selectedKey,
  valueLabel,
  options,
  onSelect,
}: {
  label: string;
  selectedKey: string;
  valueLabel: string;
  options: FilterOption<T>[];
  onSelect: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current
        && !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2.5 text-left text-sm text-white transition-colors hover:border-zinc-600"
      >
        <span className="truncate">{valueLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-700 bg-[#17131f] shadow-2xl">
          <div className="max-h-64 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  onSelect(option.key);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                <span className="min-w-0 truncate">{option.label}</span>
                <Check
                  className={`h-4 w-4 shrink-0 text-cyan-300 ${
                    String(option.key) === selectedKey ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-cyan-500 bg-cyan-500/15 text-white"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span>{label}</span>
        <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] text-current/80">
          {count}
        </span>
      </span>
    </button>
  );
}

function NewsletterMemoryPanel({
  snapshot,
  currentChapter,
}: {
  snapshot: ReturnType<typeof buildNewsletterMemorySnapshot>;
  currentChapter: number;
}) {
  const [showSetupContext, setShowSetupContext] = useState(false);
  const setupSummary = [
    snapshot.recurringSections.length > 0
      ? `${snapshot.recurringSections.length} recurring section${snapshot.recurringSections.length === 1 ? "" : "s"}`
      : null,
    snapshot.dueThreads.length > 0
      ? `${snapshot.dueThreads.length} follow-up${snapshot.dueThreads.length === 1 ? "" : "s"} due`
      : null,
    snapshot.voiceGuides.length > 0
      ? `${snapshot.voiceGuides.length} voice guardrail${snapshot.voiceGuides.length === 1 ? "" : "s"}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/10 p-2 text-cyan-200">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Saved setup</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              The saved setup the system uses to keep issues aligned for readers,
              promise, and voice.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSetupContext((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
        >
          {showSetupContext ? "Hide details" : "More setup context"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              showSetupContext ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MemoryMetric label="Audience" value={snapshot.audience} />
        <MemoryMetric label="Current angle" value={snapshot.currentAngle} />
      </div>

      {setupSummary && (
        <p className="mt-3 text-xs leading-5 text-zinc-400">{setupSummary}</p>
      )}

      {showSetupContext && (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MemoryMetric label="Subtitle" value={snapshot.subtitle} />
            <MemoryMetric label="Cadence" value={snapshot.cadence} />
          </div>

          {snapshot.seriesPromise && (
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Series promise
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                {snapshot.seriesPromise}
              </p>
            </div>
          )}

          {snapshot.voiceGuides.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Voice guardrails
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.voiceGuides.map((guide) => (
                  <span
                    key={guide}
                    className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                  >
                    {guide}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(snapshot.hookApproach || snapshot.ctaStyle) && (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <MemoryMetric label="Hook approach" value={snapshot.hookApproach} />
              <MemoryMetric label="CTA style" value={snapshot.ctaStyle} />
            </div>
          )}

          {snapshot.recurringSections.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Recurring sections
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.recurringSections.map((section) => (
                  <span
                    key={section}
                    className="rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-200"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(snapshot.currentUnitPlan.length > 0 || snapshot.dueThreads.length > 0) && (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {snapshot.currentUnitPlan.length > 0 && (
                <MemoryList
                  title={`Issue ${currentChapter} plan`}
                  items={snapshot.currentUnitPlan}
                />
              )}
              {snapshot.dueThreads.length > 0 && (
                <MemoryList title="Due follow-ups" items={snapshot.dueThreads} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MemoryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-200">{value}</p>
    </div>
  );
}

function MemoryList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm leading-6 text-zinc-200">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
