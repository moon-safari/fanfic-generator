"use client";

import { Copy, Lightbulb, RefreshCw } from "lucide-react";
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
    void navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-amber-500/15 p-2 text-amber-200">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Brainstorm</p>
            <p className="text-xs text-zinc-500">Pick an idea and move it into prose.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onGenerateMore}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Generate more
        </button>
      </div>

      <div className="space-y-3">
        {ideas.map((idea, index) => (
          <article
            key={`${idea.title}-${index}`}
            className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <h4 className="break-words text-sm font-semibold text-zinc-100">
              {idea.title}
            </h4>
            <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
              {idea.description}
            </p>
            {idea.prose && (
              <div className="mt-3 rounded-2xl border border-zinc-900 bg-black/20 px-3 py-3">
                <p className="break-words text-sm italic leading-6 text-zinc-300">
                  &ldquo;{idea.prose}&rdquo;
                </p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onInsert(idea.prose || idea.description)}
                className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
              >
                Use in editor
              </button>
              <button
                type="button"
                onClick={() => handleCopy(idea.prose || idea.description)}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
