// src/app/components/editor/HistoryTab.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, ChevronDown } from "lucide-react";
import { CraftHistoryEntry, CraftTool } from "../../types/craft";

const TOOL_ICONS: Record<CraftTool, string> = {
  rewrite: "✏️",
  expand: "📐",
  describe: "🎨",
  brainstorm: "💡",
};

interface HistoryTabProps {
  storyId: string;
  currentChapter: number;
  onReinsert: (text: string) => void;
}

function getResultPreview(entry: CraftHistoryEntry): string {
  const r = entry.result;
  if (r.type === "rewrite" || r.type === "expand") return r.text;
  if (r.type === "describe") return r.blend || r.senses[0]?.text || "";
  if (r.type === "brainstorm") return entry.result.type === "brainstorm" ? entry.result.ideas[0]?.prose || entry.result.ideas[0]?.title || "" : "";
  return "";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryTab({
  storyId,
  currentChapter,
  onReinsert,
}: HistoryTabProps) {
  const [entries, setEntries] = useState<CraftHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOlderChapters, setExpandedOlderChapters] = useState<Set<number>>(new Set());

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/craft/history?storyId=${storyId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-sm text-zinc-500">No craft history yet.</p>
        <p className="text-xs text-zinc-600 mt-1">
          Use a craft tool and your results will appear here.
        </p>
      </div>
    );
  }

  // Group by chapter
  const grouped = new Map<number, CraftHistoryEntry[]>();
  for (const entry of entries) {
    const ch = entry.chapterNumber;
    if (!grouped.has(ch)) grouped.set(ch, []);
    grouped.get(ch)!.push(entry);
  }

  const chapters = [...grouped.keys()].sort((a, b) => b - a);

  return (
    <div className="p-3 overflow-y-auto">
      {chapters.map((ch) => {
        const chapterEntries = grouped.get(ch)!;
        const isCurrent = ch === currentChapter;
        const isExpanded = isCurrent || expandedOlderChapters.has(ch);

        return (
          <div key={ch} className="mb-4">
            {!isCurrent && (
              <button
                onClick={() =>
                  setExpandedOlderChapters((prev) => {
                    const next = new Set(prev);
                    if (next.has(ch)) next.delete(ch);
                    else next.add(ch);
                    return next;
                  })
                }
                className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase tracking-wider mb-2 hover:text-zinc-400 transition-colors"
              >
                Chapter {ch} — {chapterEntries.length} entries
                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>
            )}
            {isCurrent && (
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                Chapter {ch} · Current
              </div>
            )}

            {isExpanded &&
              chapterEntries.map((entry) => {
                const preview = getResultPreview(entry);
                return (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-700/30 mb-1.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-purple-400">
                        {TOOL_ICONS[entry.toolType]} {entry.toolType.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-zinc-600">
                        {timeAgo(entry.createdAt)} ·{" "}
                        <span
                          className={
                            entry.status === "inserted"
                              ? "text-emerald-500"
                              : entry.status === "dismissed"
                              ? "text-zinc-500"
                              : "text-zinc-400"
                          }
                        >
                          {entry.status === "generated" ? "Generated" : entry.status === "inserted" ? "Inserted" : "Dismissed"}
                        </span>
                      </span>
                    </div>
                    {entry.direction && (
                      <div className="text-[9px] text-zinc-600 mb-1">
                        Direction: &ldquo;{entry.direction}&rdquo;
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                      {preview}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => onReinsert(preview)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Re-insert
                      </button>
                      <button
                        onClick={() => handleCopy(preview)}
                        className="text-[10px] text-zinc-500 hover:text-zinc-400 transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        Copy
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
