// src/app/components/editor/DescribeResults.tsx
"use client";

import { Copy } from "lucide-react";
import { SenseDescription } from "../../types/craft";

const SENSE_CONFIG: Record<string, { emoji: string; color: string }> = {
  sight: { emoji: "👁", color: "bg-blue-500/10 text-blue-400" },
  smell: { emoji: "👃", color: "bg-emerald-500/10 text-emerald-400" },
  sound: { emoji: "👂", color: "bg-amber-500/10 text-amber-400" },
  touch: { emoji: "🤚", color: "bg-rose-500/10 text-rose-400" },
  taste: { emoji: "👅", color: "bg-orange-500/10 text-orange-400" },
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
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-2">
      {/* Blend card (featured) */}
      {blend && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-950/40 to-zinc-900/60 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">
              ✨
            </span>
            <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
              Blend
            </span>
            <span className="text-[9px] text-zinc-500 ml-auto">Recommended</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{blend}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onInsert(blend)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
            >
              ↵ Insert
            </button>
            <button
              onClick={() => handleCopy(blend)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Individual sense cards */}
      {senses.map((sense) => {
        const config = SENSE_CONFIG[sense.type];
        if (!config) return null;
        return (
          <div
            key={sense.type}
            className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${config.color}`}
              >
                {config.emoji}
              </span>
              <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                {sense.type}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{sense.text}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onInsert(sense.text)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
              >
                ↵ Insert
              </button>
              <button
                onClick={() => handleCopy(sense.text)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
