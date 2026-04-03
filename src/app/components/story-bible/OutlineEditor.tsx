"use client";

import { Plus, Trash2 } from "lucide-react";
import { getProjectUnitLabel } from "../../lib/projectMode";
import type { ProjectMode } from "../../types/story";
import type { BibleOutlineContent, BibleOutlineChapter } from "../../types/bible";

interface OutlineEditorProps {
  content: BibleOutlineContent | null;
  onSave: (content: BibleOutlineContent) => void;
  projectMode?: ProjectMode;
}

const STATUS_COLORS: Record<BibleOutlineChapter["status"], string> = {
  planned: "bg-zinc-700 text-zinc-300",
  written: "bg-purple-900/60 text-purple-300",
  revised: "bg-green-900/60 text-green-300",
};

export default function OutlineEditor({
  content,
  onSave,
  projectMode = "fiction",
}: OutlineEditorProps) {
  const chapters = content?.chapters ?? [];
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });

  const updateChapter = (
    idx: number,
    partial: Partial<BibleOutlineChapter>
  ) => {
    const next = [...chapters];
    next[idx] = { ...next[idx], ...partial };
    onSave({ chapters: next });
  };

  const updateOpenLoops = (idx: number, value: string) => {
    const openLoops = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    updateChapter(idx, { openLoops });
  };

  const removeChapter = (idx: number) => {
    const next = chapters.filter((_, index) => index !== idx);
    next.forEach((chapter, index) => {
      chapter.number = index + 1;
    });
    onSave({ chapters: next });
  };

  const addChapter = () => {
    onSave({
      chapters: [
        ...chapters,
        {
          number: chapters.length + 1,
          title: "",
          summary: "",
          intent: "",
          keyReveal: "",
          openLoops: [],
          status: "planned",
        },
      ],
    });
  };

  return (
    <div className="space-y-3">
      {chapters.map((chapter, index) => (
        <div
          key={chapter.number}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-full bg-black/30 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              {unitLabelCapitalized} {chapter.number}
            </span>
            <input
              type="text"
              value={chapter.title}
              onChange={(event) =>
                updateChapter(index, { title: event.target.value })
              }
              placeholder={`${unitLabelCapitalized} title...`}
              className="min-w-0 flex-1 border-b border-zinc-700 bg-transparent pb-0.5 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
            <select
              value={chapter.status}
              onChange={(event) =>
                updateChapter(index, {
                  status: event.target.value as BibleOutlineChapter["status"],
                })
              }
              className={`rounded-full border-0 px-2 py-0.5 text-xs focus:outline-none ${STATUS_COLORS[chapter.status]}`}
            >
              <option value="planned">Planned</option>
              <option value="written">Written</option>
              <option value="revised">Revised</option>
            </select>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Summary
              </label>
              <textarea
                value={chapter.summary}
                onChange={(event) =>
                  updateChapter(index, { summary: event.target.value })
                }
                placeholder={`${unitLabelCapitalized} summary...`}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Intent
              </label>
              <textarea
                value={chapter.intent ?? ""}
                onChange={(event) =>
                  updateChapter(index, { intent: event.target.value })
                }
                placeholder={`What is this ${unitLabel} trying to do?`}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Key Reveal Or Turn
              </label>
              <textarea
                value={chapter.keyReveal ?? ""}
                onChange={(event) =>
                  updateChapter(index, { keyReveal: event.target.value })
                }
                placeholder={`What reveal, promise, or turn should land here?`}
                rows={2}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Open Threads
              </label>
              <textarea
                value={(chapter.openLoops ?? []).join("\n")}
                onChange={(event) => updateOpenLoops(index, event.target.value)}
                placeholder="One thread per line..."
                rows={2}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeChapter(index)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-900/70 px-3 py-2 text-xs font-medium text-red-200 transition-colors hover:border-red-600 hover:text-white"
              aria-label={`Delete ${unitLabel} ${chapter.number}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {unitLabel}
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addChapter}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-700/50 py-2 text-sm text-purple-400 transition-colors hover:bg-purple-900/20"
      >
        <Plus className="h-4 w-4" />
        Add {unitLabelCapitalized}
      </button>
    </div>
  );
}
