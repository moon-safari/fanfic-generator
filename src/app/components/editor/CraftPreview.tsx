"use client";

import { Check, X } from "lucide-react";
import { CraftResult, BrainstormItem } from "./useCraftTools";

interface CraftPreviewProps {
  result: CraftResult;
  originalText: string;
  onAccept: (text: string) => void;
  onDismiss: () => void;
}

function RewriteExpandPreview({
  result,
  originalText,
  onAccept,
  onDismiss,
}: {
  result: { type: "rewrite" | "expand"; text: string };
  originalText: string;
  onAccept: (text: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Original text - dimmed with strikethrough */}
      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Original
        </span>
        <p className="mt-1 text-sm text-zinc-500 line-through leading-relaxed">
          {originalText}
        </p>
      </div>

      {/* Suggested replacement - highlighted */}
      <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40">
        <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
          Suggested
        </span>
        <p className="mt-1 text-sm text-zinc-200 leading-relaxed">
          {result.text}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors min-h-[44px]"
        >
          <X className="w-4 h-4" />
          Dismiss
        </button>
        <button
          onClick={() => onAccept(result.text)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[44px]"
        >
          <Check className="w-4 h-4" />
          Accept
        </button>
      </div>
    </div>
  );
}

function DescribePreview({
  options,
  onAccept,
  onDismiss,
}: {
  options: string[];
  onAccept: (text: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        Pick a description
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onAccept(option)}
            className="text-left p-3 rounded-lg bg-zinc-900/50 border border-zinc-700 hover:border-purple-500 hover:bg-purple-950/20 transition-colors text-sm text-zinc-300 hover:text-white leading-relaxed min-h-[44px]"
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors min-h-[44px]"
        >
          <X className="w-4 h-4" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

function BrainstormPreview({
  ideas,
  onAccept,
  onDismiss,
}: {
  ideas: BrainstormItem[];
  onAccept: (text: string) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
        Pick an idea
      </span>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {ideas.map((idea, idx) => (
          <button
            key={idx}
            onClick={() => onAccept(idea.preview)}
            className="w-full text-left p-3 rounded-lg bg-zinc-900/50 border border-zinc-700 hover:border-purple-500 hover:bg-purple-950/20 transition-colors min-h-[44px]"
          >
            <h4 className="text-sm font-semibold text-white">{idea.title}</h4>
            <p className="text-xs text-zinc-400 mt-0.5">{idea.description}</p>
            <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">
              {idea.preview}
            </p>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors min-h-[44px]"
        >
          <X className="w-4 h-4" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function CraftPreview({
  result,
  originalText,
  onAccept,
  onDismiss,
}: CraftPreviewProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:inset-auto sm:fixed sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4">
        {result.type === "rewrite" || result.type === "expand" ? (
          <RewriteExpandPreview
            result={result}
            originalText={originalText}
            onAccept={onAccept}
            onDismiss={onDismiss}
          />
        ) : result.type === "describe" ? (
          <DescribePreview
            options={result.options}
            onAccept={onAccept}
            onDismiss={onDismiss}
          />
        ) : result.type === "brainstorm" ? (
          <BrainstormPreview
            ideas={result.ideas}
            onAccept={onAccept}
            onDismiss={onDismiss}
          />
        ) : null}
      </div>
    </div>
  );
}
