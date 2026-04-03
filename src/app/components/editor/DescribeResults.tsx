"use client";

import { Copy, Sparkles } from "lucide-react";
import { SenseDescription } from "../../types/craft";

const SENSE_CONFIG: Record<string, string> = {
  sight: "bg-blue-500/15 text-blue-200",
  smell: "bg-emerald-500/15 text-emerald-200",
  sound: "bg-amber-500/15 text-amber-200",
  touch: "bg-rose-500/15 text-rose-200",
  taste: "bg-orange-500/15 text-orange-200",
};

interface DescribeResultsProps {
  blend: string;
  senses: SenseDescription[];
  onInsert: (text: string) => void;
}

export default function DescribeResults({
  blend,
  senses,
  onInsert,
}: DescribeResultsProps) {
  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      {blend && (
        <section className="rounded-3xl border border-purple-500/30 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_rgba(24,24,27,0.86)_60%)] p-4">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-purple-500/15 p-2 text-purple-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Blend</p>
              <p className="text-xs text-purple-200/80">Recommended combined pass</p>
            </div>
          </div>
          <p className="mt-3 break-words text-sm leading-6 text-zinc-100">
            {blend}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onInsert(blend)}
              className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
            >
              Use in editor
            </button>
            <button
              type="button"
              onClick={() => handleCopy(blend)}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>
        </section>
      )}

      {senses.map((sense) => (
        <section
          key={sense.type}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${SENSE_CONFIG[sense.type] ?? "bg-zinc-800 text-zinc-300"}`}
            >
              {sense.type}
            </span>
          </div>
          <p className="mt-3 break-words text-sm leading-6 text-zinc-300">
            {sense.text}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onInsert(sense.text)}
              className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
            >
              Use in editor
            </button>
            <button
              type="button"
              onClick={() => handleCopy(sense.text)}
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
