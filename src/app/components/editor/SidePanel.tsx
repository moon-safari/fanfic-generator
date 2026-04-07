"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  BookOpen,
  ChevronDown,
  History,
  ScrollText,
  Sparkles,
  X,
} from "lucide-react";
import type {
  ProjectMode,
  StoryModeConfig,
} from "../../types/story";
import type {
  AdaptationChainId,
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../../types/adaptation";
import type { MemoryMention } from "../../types/memory";
import type {
  MemoryFocusRequest,
  ArtifactFocusRequest,
} from "../../hooks/useMemoryFocus";
import {
  SidePanelTab,
  CraftResult,
  CraftTool,
  SidePanelWidth,
} from "../../types/craft";
import MemoryPanel from "../memory/MemoryPanel";
import AdaptTab from "./AdaptTab";
import ArtifactsTab from "./ArtifactsTab";
import CraftTab from "./CraftTab";
import HistoryTab from "./HistoryTab";

interface SidePanelProps {
  storyId: string;
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  activeTab: SidePanelTab;
  annotationCount?: number;
  activeTool: CraftTool | null;
  craftResult: CraftResult | null;
  craftLoading: boolean;
  craftError: string | null;
  craftDirection: string;
  currentChapter: number;
  currentChapterId?: string;
  memorySuggestionRefreshKey?: number;
  adaptationActiveOutputType: AdaptationOutputType;
  adaptationSelectedChainId: AdaptationChainId;
  adaptationCurrentResult: ChapterAdaptationResult | null;
  adaptationResultsByType: Partial<
    Record<AdaptationOutputType, ChapterAdaptationResult>
  >;
  adaptationLoadingOutputType: AdaptationOutputType | null;
  adaptationDeletingOutputType: AdaptationOutputType | null;
  adaptationChainLoading: boolean;
  adaptationError: string | null;
  currentChapterMentions?: MemoryMention[];
  mentionSyncing?: boolean;
  mentionError?: string | null;
  memoryFocusRequest?: MemoryFocusRequest | null;
  artifactFocusRequest?: ArtifactFocusRequest | null;
  panelWidth: SidePanelWidth;
  onPanelWidthChange: (panelWidth: SidePanelWidth) => void;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
  onCraftDirectionChange: (direction: string) => void;
  onCraftRerun: (direction: string) => void;
  onCraftInsert: (text: string) => void;
  onCraftGenerateMore: () => void;
  onCraftRetry: () => void;
  onHistoryReinsert: (text: string) => void;
  onArtifactInsert: (text: string) => void;
  onArtifactOpenInAdapt: (
    chapterNumber: number,
    outputType: AdaptationOutputType
  ) => void;
  onArtifactSummaryUpdated?: (chapterId: string, summary: string) => void;
  onModeConfigUpdated?: (modeConfig: StoryModeConfig) => void;
  onAdaptSelectChainId: (chainId: AdaptationChainId) => void;
  onAdaptSelectOutputType: (outputType: AdaptationOutputType) => void;
  onAdaptGenerate: (outputType: AdaptationOutputType) => Promise<void>;
  onAdaptGenerateChain: (chainId?: AdaptationChainId) => Promise<void>;
  onAdaptDeleteOutput: (outputType: AdaptationOutputType) => Promise<void>;
  onAdaptInsert: (text: string) => void;
  onAdaptSummaryUpdated?: (summary: string) => void;
  onAdaptDismissError: () => void;
  onGenerateMentions?: () => Promise<void>;
  onDismissMentionError?: () => void;
}

const TABS: Array<{
  key: SidePanelTab;
  label: string;
  Icon: typeof BookOpen;
  advanced?: boolean;
}> = [
  { key: "memory", label: "Memory", Icon: BookOpen },
  { key: "artifacts", label: "Project", Icon: ScrollText },
  { key: "adapt", label: "Outputs", Icon: ArrowRightLeft },
  { key: "craft", label: "Writing Tools", Icon: Sparkles, advanced: true },
  { key: "history", label: "Past Results", Icon: History, advanced: true },
];

export default function SidePanel({
  storyId,
  storyTitle,
  projectMode,
  modeConfig,
  activeTab,
  annotationCount = 0,
  activeTool,
  craftResult,
  craftLoading,
  craftError,
  craftDirection,
  currentChapter,
  currentChapterId,
  memorySuggestionRefreshKey = 0,
  adaptationActiveOutputType,
  adaptationSelectedChainId,
  adaptationCurrentResult,
  adaptationResultsByType,
  adaptationLoadingOutputType,
  adaptationDeletingOutputType,
  adaptationChainLoading,
  adaptationError,
  currentChapterMentions = [],
  mentionSyncing = false,
  mentionError = null,
  memoryFocusRequest = null,
  artifactFocusRequest = null,
  panelWidth,
  onPanelWidthChange,
  onTabChange,
  onClose,
  onCraftDirectionChange,
  onCraftRerun,
  onCraftInsert,
  onCraftGenerateMore,
  onCraftRetry,
  onHistoryReinsert,
  onArtifactInsert,
  onArtifactOpenInAdapt,
  onArtifactSummaryUpdated,
  onModeConfigUpdated,
  onAdaptSelectChainId,
  onAdaptSelectOutputType,
  onAdaptGenerate,
  onAdaptGenerateChain,
  onAdaptDeleteOutput,
  onAdaptInsert,
  onAdaptSummaryUpdated,
  onAdaptDismissError,
  onGenerateMentions,
  onDismissMentionError,
}: SidePanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const displayedActiveTab =
    projectMode === "newsletter" && activeTab === "memory"
      ? "artifacts"
      : activeTab;
  const allowedTabs =
    projectMode === "newsletter"
      ? TABS.filter((tab) => tab.key !== "memory")
      : TABS;
  const defaultTabs = allowedTabs.filter((tab) => !tab.advanced);
  const advancedTabs = allowedTabs.filter((tab) => tab.advanced);
  const showAdvancedTabs =
    advancedOpen || advancedTabs.some((tab) => tab.key === displayedActiveTab);
  const widthClass =
    panelWidth === "focus"
      ? "w-full md:w-[64%] md:min-w-[640px] lg:w-[62%] lg:min-w-[780px] xl:w-[60%] xl:min-w-[900px]"
      : panelWidth === "expanded"
        ? "w-full md:w-[52%] md:min-w-[500px] lg:w-[50%] lg:min-w-[580px] xl:w-[48%] xl:min-w-[640px]"
        : "w-full md:w-[46%] md:min-w-[440px] lg:w-[43%] lg:min-w-[500px] xl:w-[40%] xl:min-w-[540px]";
  const focusModeActive = panelWidth === "focus";
  const defaultPanelWidth: SidePanelWidth =
    displayedActiveTab === "adapt"
    || displayedActiveTab === "artifacts"
    || (
      displayedActiveTab === "craft"
      && activeTool === "brainstorm"
      && Boolean(craftResult)
    )
      ? "expanded"
      : "normal";

  return (
    <div
      className={`${widthClass} absolute inset-0 z-50 flex h-full min-h-0 flex-col border-l border-zinc-800 bg-[#13101e] transition-all duration-300 ease-out md:static`}
    >
      <div className="shrink-0 border-b border-zinc-800 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white md:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {allowedTabs.find((tab) => tab.key === displayedActiveTab)?.label
                ?? allowedTabs[0]?.label}
            </p>
            {annotationCount > 0 && (
              <p className="mt-1 text-xs text-cyan-300">
                {annotationCount} editor note{annotationCount === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() =>
                onPanelWidthChange(focusModeActive ? defaultPanelWidth : "focus")
              }
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                focusModeActive
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
                  : "border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-white"
              }`}
            >
              {focusModeActive ? "Exit focus" : "Focus mode"}
            </button>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white md:flex"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {focusModeActive && (
          <p className="mt-3 hidden text-xs leading-5 text-zinc-500 md:block">
            Focus mode gives Story tools more room so longer results, facts, and
            project items need less scrolling.
          </p>
        )}

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap gap-1 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1">
            {defaultTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  displayedActiveTab === tab.key
                    ? "bg-purple-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <tab.Icon className="h-3.5 w-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
            </div>

            {advancedTabs.length > 0 && (
              <button
                type="button"
                onClick={() => setAdvancedOpen((prev) => !prev)}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition-colors ${
                  showAdvancedTabs
                    ? "border-zinc-600 bg-zinc-900 text-white"
                    : "border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                Advanced
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    showAdvancedTabs ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {advancedTabs.length > 0 && showAdvancedTabs && (
            <div className="mt-2 flex flex-wrap gap-1 rounded-2xl border border-zinc-800 bg-black/20 p-1">
              {advancedTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    displayedActiveTab === tab.key
                      ? "bg-zinc-200 text-zinc-950"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <tab.Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {displayedActiveTab === "memory" && (
          <MemoryPanel
            storyId={storyId}
            currentChapter={currentChapter}
            currentChapterId={currentChapterId}
            projectMode={projectMode}
            panelWidth={panelWidth}
            focusMode={focusModeActive}
            suggestionRefreshKey={memorySuggestionRefreshKey}
            currentChapterMentions={currentChapterMentions}
            mentionSyncing={mentionSyncing}
            mentionError={mentionError}
            focusRequest={memoryFocusRequest}
            onGenerateMentions={onGenerateMentions}
            onDismissMentionError={onDismissMentionError}
          />
        )}
        {displayedActiveTab === "craft" && (
          <CraftTab
            activeTool={activeTool}
            result={craftResult}
            loading={craftLoading}
            error={craftError}
            direction={craftDirection}
            onDirectionChange={onCraftDirectionChange}
            onRerun={onCraftRerun}
            onInsert={onCraftInsert}
            onGenerateMore={onCraftGenerateMore}
            onRetry={onCraftRetry}
          />
        )}
        {displayedActiveTab === "artifacts" && (
          <ArtifactsTab
            storyId={storyId}
            storyTitle={storyTitle}
            projectMode={projectMode}
            modeConfig={modeConfig}
            currentChapter={currentChapter}
            currentChapterId={currentChapterId}
            panelWidth={panelWidth}
            focusMode={focusModeActive}
            focusRequest={artifactFocusRequest}
            onInsert={onArtifactInsert}
            onOpenInAdapt={onArtifactOpenInAdapt}
            onSummaryUpdated={onArtifactSummaryUpdated}
            onModeConfigUpdated={onModeConfigUpdated}
          />
        )}
        {displayedActiveTab === "adapt" && (
          <AdaptTab
            storyId={storyId}
            projectMode={projectMode}
            modeConfig={modeConfig}
            currentChapter={currentChapter}
            currentChapterId={currentChapterId}
            focusMode={focusModeActive}
            activeOutputType={adaptationActiveOutputType}
            selectedChainId={adaptationSelectedChainId}
            currentResult={adaptationCurrentResult}
            resultsByType={adaptationResultsByType}
            loadingOutputType={adaptationLoadingOutputType}
            deletingOutputType={adaptationDeletingOutputType}
            chainLoading={adaptationChainLoading}
            error={adaptationError}
            onSelectChainId={onAdaptSelectChainId}
            onSelectOutputType={onAdaptSelectOutputType}
            onGenerate={onAdaptGenerate}
            onGenerateChain={onAdaptGenerateChain}
            onDeleteOutput={onAdaptDeleteOutput}
            onInsert={onAdaptInsert}
            onSummaryUpdated={onAdaptSummaryUpdated}
            onDismissError={onAdaptDismissError}
          />
        )}
        {displayedActiveTab === "history" && (
          <HistoryTab
            storyId={storyId}
            projectMode={projectMode}
            currentChapter={currentChapter}
            onReinsert={onHistoryReinsert}
          />
        )}
      </div>
    </div>
  );
}
