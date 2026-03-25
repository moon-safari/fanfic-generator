// src/app/components/editor/CraftTab.tsx
"use client";

import { useState } from "react";
import { Copy, AlertCircle, RefreshCw } from "lucide-react";
import { CraftTool, CraftResult } from "../../types/craft";
import DescribeResults from "./DescribeResults";
import BrainstormResults from "./BrainstormResults";

interface CraftTabProps {
  activeTool: CraftTool | null;
  result: CraftResult | null;
  loading: boolean;
  error: string | null;
  direction: string;
  onDirectionChange: (direction: string) => void;
  onRerun: (direction: string) => void;
  onInsert: (text: string) => void;
  onGenerateMore: () => void;
  onRetry: () => void;
}

function LoadingSkeleton({ tool }: { tool: CraftTool }) {
  if (tool === "describe") {
    return (
      <div className="space-y-2">
        <div className="h-28 bg-purple-900/20 rounded-lg animate-pulse" />
        <div className="h-20 bg-zinc-800/50 rounded-lg animate-pulse" />
        <div className="h-20 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>
    );
  }
  if (tool === "brainstorm") {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="h-6 w-1/3 bg-zinc-800/50 rounded animate-pulse" />
      <div className="h-32 bg-zinc-800/50 rounded-lg animate-pulse" />
    </div>
  );
}

export default function CraftTab({
  activeTool,
  result,
  loading,
  error,
  direction,
  onDirectionChange,
  onRerun,
  onInsert,
  onGenerateMore,
  onRetry,
}: CraftTabProps) {
  // No tool selected state
  if (!activeTool && !result && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-sm text-zinc-500">
          Select text in the editor, then click a craft tool in the toolbar.
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-3">
        <div className="p-4 rounded-lg border border-red-800/40 bg-red-950/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Something went wrong</span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && activeTool) {
    return (
      <div className="p-3">
        {(activeTool === "rewrite" || activeTool === "expand") && (
          <DirectionInput
            direction={direction}
            onDirectionChange={onDirectionChange}
            onRerun={onRerun}
            disabled
          />
        )}
        <LoadingSkeleton tool={activeTool} />
      </div>
    );
  }

  // Results
  return (
    <div className="p-3 flex flex-col h-full overflow-y-auto">
      {/* Rewrite / Expand results */}
      {result && (result.type === "rewrite" || result.type === "expand") && (
        <>
          <DirectionInput
            direction={direction}
            onDirectionChange={onDirectionChange}
            onRerun={onRerun}
          />
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
            {result.type === "rewrite" ? "✏️" : "📐"}{" "}
            {result.type}{direction ? ` · "${direction}"` : ""}
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50">
            <p className="text-sm text-zinc-200 leading-relaxed">{result.text}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onInsert(result.text)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
              >
                ↵ Insert
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(result.text)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors min-h-[32px]"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 text-center mt-3">
            Try another direction ↑ or select new text
          </p>
        </>
      )}

      {/* Describe results */}
      {result && result.type === "describe" && (
        <DescribeResults
          blend={result.blend}
          senses={result.senses}
          onInsert={onInsert}
        />
      )}

      {/* Brainstorm results */}
      {result && result.type === "brainstorm" && (
        <BrainstormResults
          ideas={result.ideas}
          onInsert={onInsert}
          onGenerateMore={onGenerateMore}
        />
      )}
    </div>
  );
}

// Direction input sub-component
function DirectionInput({
  direction,
  onDirectionChange,
  onRerun,
  disabled,
}: {
  direction: string;
  onDirectionChange: (d: string) => void;
  onRerun: (d: string) => void;
  disabled?: boolean;
}) {
  const [localDir, setLocalDir] = useState(direction);

  return (
    <div className="flex gap-2 mb-3">
      <input
        type="text"
        value={localDir}
        onChange={(e) => {
          setLocalDir(e.target.value);
          onDirectionChange(e.target.value);
        }}
        placeholder="Direction (e.g., show not tell)"
        className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) onRerun(localDir);
        }}
      />
      <button
        onClick={() => onRerun(localDir)}
        disabled={disabled}
        className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors min-h-[36px]"
      >
        Go
      </button>
    </div>
  );
}
