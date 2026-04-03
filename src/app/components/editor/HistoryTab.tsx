"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Lightbulb,
  Palette,
  PencilLine,
  PlusSquare,
} from "lucide-react";
import { getProjectUnitLabel } from "../../lib/projectMode";
import { CraftHistoryEntry, CraftTool } from "../../types/craft";
import type { ProjectMode } from "../../types/story";

const TOOL_META: Record<
  CraftTool,
  { label: string; Icon: typeof PencilLine; tone: string }
> = {
  rewrite: {
    label: "Rewrite",
    Icon: PencilLine,
    tone: "bg-purple-500/15 text-purple-200",
  },
  expand: {
    label: "Expand",
    Icon: PlusSquare,
    tone: "bg-blue-500/15 text-blue-200",
  },
  describe: {
    label: "Describe",
    Icon: Palette,
    tone: "bg-rose-500/15 text-rose-200",
  },
  brainstorm: {
    label: "Brainstorm",
    Icon: Lightbulb,
    tone: "bg-amber-500/15 text-amber-200",
  },
};

interface HistoryTabProps {
  storyId: string;
  projectMode: ProjectMode;
  currentChapter: number;
  onReinsert: (text: string) => void;
}

function getResultPreview(entry: CraftHistoryEntry): string {
  const result = entry.result;

  if (result.type === "rewrite" || result.type === "expand") {
    return result.text;
  }

  if (result.type === "describe") {
    return result.blend || result.senses[0]?.text || "";
  }

  if (result.type === "brainstorm") {
    return result.ideas[0]?.prose || result.ideas[0]?.title || "";
  }

  return "";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) {
    return "just now";
  }

  if (mins < 60) {
    return `${mins} min ago`;
  }

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs} hr ago`;
  }

  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryTab({
  storyId,
  projectMode,
  currentChapter,
  onReinsert,
}: HistoryTabProps) {
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const [entries, setEntries] = useState<CraftHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOlderChapters, setExpandedOlderChapters] = useState<Set<number>>(
    new Set()
  );

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/craft/history?storyId=${storyId}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // Best effort only for this supporting panel.
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const groupedChapters = useMemo(() => {
    const grouped = new Map<number, CraftHistoryEntry[]>();

    for (const entry of entries) {
      const chapterEntries = grouped.get(entry.chapterNumber) ?? [];
      chapterEntries.push(entry);
      grouped.set(entry.chapterNumber, chapterEntries);
    }

    return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]);
  }, [entries]);

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-3xl bg-zinc-900/70"
            />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-white">No writing tool results yet</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Run a writing tool and its results will stay here for quick reuse.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto px-4 py-4">
      <div className="space-y-5">
        {groupedChapters.map(([chapterNumber, chapterEntries]) => {
          const isCurrent = chapterNumber === currentChapter;
          const isExpanded =
            isCurrent || expandedOlderChapters.has(chapterNumber);

          return (
            <section
              key={chapterNumber}
              className="rounded-3xl border border-zinc-800 bg-zinc-950/70"
            >
              <button
                type="button"
                onClick={() => {
                  if (isCurrent) {
                    return;
                  }

                  setExpandedOlderChapters((prev) => {
                    const next = new Set(prev);
                    if (next.has(chapterNumber)) {
                      next.delete(chapterNumber);
                    } else {
                      next.add(chapterNumber);
                    }
                    return next;
                  });
                }}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                  isCurrent ? "cursor-default" : "transition-colors hover:bg-zinc-900/60"
                }`}
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    {unitLabelCapitalized} {chapterNumber}
                    {isCurrent ? " | Current" : ""}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {chapterEntries.length} saved craft result
                    {chapterEntries.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
                  {isExpanded ? "Open" : "Closed"}
                </span>
              </button>

              {isExpanded && (
                <div className="space-y-3 border-t border-zinc-800 px-4 py-4">
                  {chapterEntries.map((entry) => {
                    const preview = getResultPreview(entry);
                    const meta = TOOL_META[entry.toolType];

                    return (
                      <article
                        key={entry.id}
                        className="rounded-2xl border border-zinc-900 bg-black/20 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}
                          >
                            <meta.Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </span>
                          <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
                            {timeAgo(entry.createdAt)}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] ${
                              entry.status === "inserted"
                                ? "bg-emerald-500/15 text-emerald-200"
                                : entry.status === "dismissed"
                                  ? "bg-zinc-900 text-zinc-400"
                                  : "bg-zinc-900 text-zinc-300"
                            }`}
                          >
                            {entry.status === "generated"
                              ? "Generated"
                              : entry.status === "inserted"
                                ? "Inserted"
                                : "Dismissed"}
                          </span>
                        </div>

                        {entry.direction && (
                          <p className="mt-3 text-xs leading-5 text-zinc-500">
                            Direction: &ldquo;{entry.direction}&rdquo;
                          </p>
                        )}

                        <p className="mt-3 break-words text-sm leading-6 text-zinc-300">
                          {preview}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onReinsert(preview)}
                            className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                          >
                            Use in editor
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(preview)}
                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
