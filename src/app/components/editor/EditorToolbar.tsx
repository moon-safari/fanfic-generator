"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Lightbulb,
  MoreVertical,
  Palette,
  PencilLine,
  PlusSquare,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  formatProjectProgressLabel,
  getProjectUnitLabel,
} from "../../lib/projectMode";
import { Story } from "../../types/story";
import { CraftTool } from "../../types/craft";

interface EditorToolbarProps {
  story: Story;
  currentChapterIdx: number;
  totalChapters: number;
  showCodex: boolean;
  annotationCount?: number;
  onBack: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onToggleCodex: () => void;
  onExport: () => void;
  onDelete: () => void;
  activeCraftTool: CraftTool | null;
  craftLoading: boolean;
  onCraftTool: (tool: CraftTool) => void;
}

const CRAFT_TOOL_META: Array<{
  tool: CraftTool;
  label: string;
  Icon: typeof PencilLine;
}> = [
  { tool: "rewrite", label: "Rewrite", Icon: PencilLine },
  { tool: "expand", label: "Expand", Icon: PlusSquare },
  { tool: "describe", label: "Describe", Icon: Palette },
  { tool: "brainstorm", label: "Brainstorm", Icon: Lightbulb },
];

export default function EditorToolbar({
  story,
  currentChapterIdx,
  totalChapters,
  showCodex,
  annotationCount = 0,
  onBack,
  onPrevChapter,
  onNextChapter,
  onToggleCodex,
  onExport,
  onDelete,
  activeCraftTool,
  craftLoading,
  onCraftTool,
}: EditorToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !toolsOpen) {
      return;
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideMenu =
        menuRef.current && menuRef.current.contains(target);
      const clickedInsideTools =
        toolsRef.current && toolsRef.current.contains(target);

      if (!clickedInsideMenu) {
        setMenuOpen(false);
      }

      if (!clickedInsideTools) {
        setToolsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, toolsOpen]);

  const annotationLabel =
    annotationCount === 1
      ? "1 editor note"
      : `${annotationCount} editor notes`;
  const activeCraftMeta = CRAFT_TOOL_META.find(
    ({ tool }) => tool === activeCraftTool
  );

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-sm sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onBack}
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-white sm:text-base">
            {story.title}
          </h1>
          <p className="text-xs text-zinc-500">
            {formatProjectProgressLabel(
              story.projectMode,
              currentChapterIdx + 1,
              totalChapters
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrevChapter}
          disabled={currentChapterIdx === 0}
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Previous ${getProjectUnitLabel(story.projectMode)}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNextChapter}
          disabled={currentChapterIdx >= totalChapters - 1}
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Next ${getProjectUnitLabel(story.projectMode)}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="hidden items-center gap-1 lg:flex">
          {CRAFT_TOOL_META.map(({ tool, label, Icon }) => {
            const selected = activeCraftTool === tool;
            const loadingTool = craftLoading && selected;

            return (
              <button
                key={tool}
                type="button"
                onClick={() => onCraftTool(tool)}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-purple-600/15 text-purple-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
                aria-label={label}
                title={label}
              >
                {loadingTool ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden xl:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:hidden" ref={toolsRef}>
          <button
            type="button"
            onClick={() => setToolsOpen((value) => !value)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
              toolsOpen || activeCraftMeta
                ? "bg-purple-600/15 text-purple-200"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            aria-label={
              activeCraftMeta
                ? `Writing tools, active tool ${activeCraftMeta.label}`
                : "Writing tools"
            }
            title={
              craftLoading && activeCraftMeta
                ? `Running ${activeCraftMeta.label}`
                : activeCraftMeta
                  ? `Writing tools (${activeCraftMeta.label})`
                  : "Writing tools"
            }
          >
            {craftLoading && activeCraftMeta ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Writing tools</span>
            <ChevronDown
              className={`hidden h-3.5 w-3.5 transition-transform sm:block ${
                toolsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {toolsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-2xl border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
              {CRAFT_TOOL_META.map(({ tool, label, Icon }) => {
                const selected = activeCraftTool === tool;
                const loadingTool = craftLoading && selected;

                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      onCraftTool(tool);
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? "bg-purple-600/10 text-purple-100"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {loadingTool ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="flex-1">{label}</span>
                    {selected && !loadingTool && (
                      <span className="text-[11px] text-purple-200">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span className="mx-1 hidden h-5 w-px bg-zinc-700 sm:block" />

        <div className="relative">
          <button
            onClick={onToggleCodex}
            className={`flex min-h-[40px] items-center gap-2 rounded-xl px-2.5 transition-colors ${
              showCodex
                ? "bg-purple-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            aria-label={
              annotationCount > 0
                ? `Story tools, ${annotationLabel}`
                : "Story tools"
            }
            title={
              annotationCount > 0
                ? `Story tools (${annotationLabel})`
                : "Story tools"
            }
          >
            <BookOpen className="h-5 w-5" />
            <span className="hidden xl:inline">Story tools</span>
          </button>
          {annotationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-zinc-950" />
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-2xl border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onExport();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <Download className="h-4 w-4" />
                Download .txt
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-zinc-800 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete project
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
