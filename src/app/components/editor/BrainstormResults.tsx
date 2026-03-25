// src/app/components/editor/BrainstormResults.tsx
"use client";

import { Copy } from "lucide-react";
import { BrainstormIdea } from "../../types/craft";

interface BrainstormResultsProps {
  ideas: BrainstormIdea[];
  onInsert: (text: string) => void;
  onGenerateMore: () => void;
}

export default function BrainstormResults({
  ideas,
  onInsert,
  onGenerateMore,
}: BrainstormResultsProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-xs font-bold tracking-wider text-purple-400 uppercase">
          💡 Brainstorm
        </span>
        <button
          onClick={onGenerateMore}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          + Generate more
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {ideas.map((idea, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50"
          >
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">
              {idea.title}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">
              {idea.description}
            </p>
            {idea.prose && (
              <div className="border-l-2 border-zinc-700 pl-3 mb-3">
                <p className="text-xs text-zinc-500 italic leading-relaxed">
                  &ldquo;{idea.prose}&rdquo;
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onInsert(idea.prose || idea.description)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
              >
                ↵ Use this
              </button>
              <button
                onClick={() => handleCopy(idea.prose || idea.description)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
