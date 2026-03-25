// src/app/components/editor/SidePanel.tsx
"use client";

import { X, ArrowLeft } from "lucide-react";
import { SidePanelTab, CraftTool, CraftResult } from "../../types/craft";
import { StoryBibleBody } from "../story-bible/StoryBiblePanel";
import CraftTab from "./CraftTab";
import HistoryTab from "./HistoryTab";

interface SidePanelProps {
  storyId: string;
  activeTab: SidePanelTab;
  activeTool: CraftTool | null;
  craftResult: CraftResult | null;
  craftLoading: boolean;
  craftError: string | null;
  craftDirection: string;
  currentChapter: number;
  panelWidth: "normal" | "expanded";
  isMobile: boolean;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
  onCraftDirectionChange: (direction: string) => void;
  onCraftRerun: (direction: string) => void;
  onCraftInsert: (text: string) => void;
  onCraftGenerateMore: () => void;
  onCraftRetry: () => void;
  onHistoryReinsert: (text: string) => void;
}

const TABS: { key: SidePanelTab; label: string; icon: string }[] = [
  { key: "bible", label: "Bible", icon: "📖" },
  { key: "craft", label: "Craft", icon: "✨" },
  { key: "history", label: "History", icon: "📜" },
];

export default function SidePanel({
  storyId,
  activeTab,
  activeTool,
  craftResult,
  craftLoading,
  craftError,
  craftDirection,
  currentChapter,
  panelWidth,
  isMobile,
  onTabChange,
  onClose,
  onCraftDirectionChange,
  onCraftRerun,
  onCraftInsert,
  onCraftGenerateMore,
  onCraftRetry,
  onHistoryReinsert,
}: SidePanelProps) {
  const widthClass =
    panelWidth === "expanded"
      ? "w-full sm:w-[50%] sm:min-w-[400px]"
      : "w-full sm:w-[35%] sm:min-w-[320px]";

  return (
    <div
      className={`${widthClass} bg-[#13101e] border-l border-zinc-800 flex flex-col fixed inset-0 sm:static z-50 transition-all duration-300 ease-out`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-zinc-800 shrink-0">
        <button
          onClick={onClose}
          className="sm:hidden p-2 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="hidden sm:flex p-2 text-zinc-400 hover:text-white transition-colors items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 py-2.5 text-center text-xs transition-colors ${
              activeTab === tab.key
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "bible" && <StoryBibleBody storyId={storyId} />}
        {activeTab === "craft" && (
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
        {activeTab === "history" && (
          <HistoryTab
            storyId={storyId}
            currentChapter={currentChapter}
            onReinsert={onHistoryReinsert}
          />
        )}
      </div>
    </div>
  );
}
