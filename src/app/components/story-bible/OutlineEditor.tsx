"use client";

import { Plus, X } from "lucide-react";
import { BibleOutlineContent, BibleOutlineChapter } from "../../types/bible";

interface OutlineEditorProps {
  content: BibleOutlineContent | null;
  onSave: (content: BibleOutlineContent) => void;
}

const STATUS_COLORS: Record<BibleOutlineChapter["status"], string> = {
  planned: "bg-zinc-700 text-zinc-300",
  written: "bg-purple-900/60 text-purple-300",
  revised: "bg-green-900/60 text-green-300",
};

export default function OutlineEditor({
  content,
  onSave,
}: OutlineEditorProps) {
  const chapters = content?.chapters ?? [];

  const updateChapter = (
    idx: number,
    partial: Partial<BibleOutlineChapter>
  ) => {
    const next = [...chapters];
    next[idx] = { ...next[idx], ...partial };
    onSave({ chapters: next });
  };

  const removeChapter = (idx: number) => {
    const next = chapters.filter((_, i) => i !== idx);
    // Renumber
    next.forEach((ch, i) => (ch.number = i + 1));
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
          status: "planned",
        },
      ],
    });
  };

  return (
    <div className="space-y-2">
      {chapters.map((ch, i) => (
        <div
          key={i}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono shrink-0">
              Ch {ch.number}
            </span>
            <input
              type="text"
              value={ch.title}
              onChange={(e) => updateChapter(i, { title: e.target.value })}
              placeholder="Chapter title..."
              className="flex-1 bg-transparent border-b border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500 pb-0.5 min-w-0"
            />
            <select
              value={ch.status}
              onChange={(e) =>
                updateChapter(i, {
                  status: e.target.value as BibleOutlineChapter["status"],
                })
              }
              className={`text-xs px-2 py-0.5 rounded-full border-0 focus:outline-none ${STATUS_COLORS[ch.status]}`}
            >
              <option value="planned">Planned</option>
              <option value="written">Written</option>
              <option value="revised">Revised</option>
            </select>
            <button
              onClick={() => removeChapter(i)}
              className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <textarea
            value={ch.summary}
            onChange={(e) => updateChapter(i, { summary: e.target.value })}
            placeholder="Chapter summary..."
            rows={2}
            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
      ))}

      <button
        onClick={addChapter}
        className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-purple-700/50 rounded-xl text-sm text-purple-400 hover:bg-purple-900/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Chapter
      </button>
    </div>
  );
}
