"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MoreVertical,
  Download,
  Trash2,
} from "lucide-react";
import { Story } from "../../types/story";
import { CraftTool } from "../../types/craft";

interface EditorToolbarProps {
  story: Story;
  currentChapterIdx: number;
  totalChapters: number;
  showBible: boolean;
  annotationCount?: number;
  onBack: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onToggleBible: () => void;
  onExport: () => void;
  onDelete: () => void;
  activeCraftTool: CraftTool | null;
  hasSelection: boolean;
  craftLoading: boolean;
  onCraftTool: (tool: CraftTool) => void;
}

export default function EditorToolbar({
  story,
  currentChapterIdx,
  totalChapters,
  showBible,
  annotationCount = 0,
  onBack,
  onPrevChapter,
  onNextChapter,
  onToggleBible,
  onExport,
  onDelete,
  activeCraftTool,
  hasSelection,
  craftLoading,
  onCraftTool,
}: EditorToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0 pt-[env(safe-area-inset-top)]">
      {/* Left section */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[120px] sm:max-w-[240px]">
          {story.title}
        </h1>
      </div>

      {/* Center: chapter nav */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevChapter}
          disabled={currentChapterIdx === 0}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous chapter"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs sm:text-sm text-zinc-400 whitespace-nowrap">
          Ch {currentChapterIdx + 1} of {totalChapters}
        </span>
        <button
          onClick={onNextChapter}
          disabled={currentChapterIdx >= totalChapters - 1}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next chapter"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 shrink-0">
            {/* Craft tool buttons */}
            <div className="hidden sm:flex items-center gap-0.5">
              {(
                [
                  { tool: "rewrite" as CraftTool, icon: "✏️", label: "Rewrite" },
                  { tool: "expand" as CraftTool, icon: "📐", label: "Expand" },
                  { tool: "describe" as CraftTool, icon: "🎨", label: "Describe" },
                  { tool: "brainstorm" as CraftTool, icon: "💡", label: "Brainstorm" },
                ] as const
              ).map(({ tool, icon, label }) => (
                <button
                  key={tool}
                  onClick={() => onCraftTool(tool)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                    activeCraftTool === tool
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/40"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                  title={label}
                >
                  {craftLoading && activeCraftTool === tool ? (
                    <span className="animate-spin inline-block">⏳</span>
                  ) : (
                    icon
                  )}{" "}
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Mobile craft tool icons */}
            <div className="flex sm:hidden items-center gap-0.5">
              {(
                [
                  { tool: "rewrite" as CraftTool, icon: "✏️" },
                  { tool: "expand" as CraftTool, icon: "📐" },
                  { tool: "describe" as CraftTool, icon: "🎨" },
                  { tool: "brainstorm" as CraftTool, icon: "💡" },
                ] as const
              ).map(({ tool, icon }) => (
                <button
                  key={tool}
                  onClick={() => onCraftTool(tool)}
                  className={`p-2 rounded-lg text-sm min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                    activeCraftTool === tool
                      ? "bg-purple-600/20 text-purple-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {craftLoading && activeCraftTool === tool ? "⏳" : icon}
                </button>
              ))}
            </div>

            <span className="hidden sm:block w-px h-5 bg-zinc-700 mx-1" />

        <div className="relative">
          <button
            onClick={onToggleBible}
            className={`p-2 rounded-lg transition-colors ${
              showBible
                ? "bg-purple-600 text-white"
                : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
            aria-label="Story Bible"
            title="Story Bible"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          {annotationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-yellow-500 text-zinc-950 text-[10px] font-bold px-1">
              {annotationCount > 99 ? "99+" : annotationCount}
            </span>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onExport();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Export to .txt
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete story
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
