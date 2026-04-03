"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Copy,
  Lightbulb,
  Palette,
  PencilLine,
  PlusSquare,
  RefreshCw,
} from "lucide-react";
import { CraftResult, CraftTool } from "../../types/craft";
import BrainstormResults from "./BrainstormResults";
import DescribeResults from "./DescribeResults";

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

const TOOL_META: Record<
  CraftTool,
  { label: string; description: string; Icon: typeof PencilLine }
> = {
  rewrite: {
    label: "Rewrite",
    description: "Steer existing prose without losing the underlying scene.",
    Icon: PencilLine,
  },
  expand: {
    label: "Expand",
    description: "Open the moment up with more texture, pacing, or detail.",
    Icon: PlusSquare,
  },
  describe: {
    label: "Describe",
    description: "Surface sensory language and stronger scene texture.",
    Icon: Palette,
  },
  brainstorm: {
    label: "Brainstorm",
    description: "Generate options before you commit to the next move.",
    Icon: Lightbulb,
  },
};

function LoadingSkeleton({ tool }: { tool: CraftTool }) {
  return (
    <div className="space-y-3">
      <div className="h-20 animate-pulse rounded-3xl bg-zinc-900/70" />
      {tool === "describe" || tool === "brainstorm" ? (
        [...Array(3)].map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-3xl bg-zinc-900/70"
          />
        ))
      ) : (
        <div className="h-40 animate-pulse rounded-3xl bg-zinc-900/70" />
      )}
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
  if (!activeTool && !result && !loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-white">Pick a writing tool</p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Select text in the editor, then use Rewrite, Expand, Describe, or
          Brainstorm from the toolbar.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-3xl border border-red-800/40 bg-red-950/20 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              Something went wrong
            </span>
          </div>
          <p className="mt-2 break-words text-sm leading-6 text-zinc-300">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (loading && activeTool) {
    const meta = TOOL_META[activeTool];

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4 pb-6">
            <ToolHeader tool={activeTool} />
            {(activeTool === "rewrite" || activeTool === "expand") && (
              <DirectionInput
                direction={direction}
                onDirectionChange={onDirectionChange}
                onRerun={onRerun}
                disabled
              />
            )}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="flex items-center gap-2">
                <meta.Icon className="h-4 w-4 text-purple-300" />
                <p className="text-sm font-semibold text-white">{meta.label}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {meta.description}
              </p>
            </div>
            <LoadingSkeleton tool={activeTool} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4 pb-6">
          {activeTool && <ToolHeader tool={activeTool} />}

          {result && (result.type === "rewrite" || result.type === "expand") && (
            <>
              <DirectionInput
                direction={direction}
                onDirectionChange={onDirectionChange}
                onRerun={onRerun}
              />

              <section className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-[11px] text-purple-200">
                    {TOOL_META[result.type].label}
                  </span>
                  {direction.trim().length > 0 && (
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300">
                      {direction}
                    </span>
                  )}
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">
                  {result.text}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onInsert(result.text)}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                  >
                    Use in editor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(result.text);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </section>
            </>
          )}

          {result && result.type === "describe" && (
            <DescribeResults
              blend={result.blend}
              senses={result.senses}
              onInsert={onInsert}
            />
          )}

          {result && result.type === "brainstorm" && (
            <BrainstormResults
              ideas={result.ideas}
              onInsert={onInsert}
              onGenerateMore={onGenerateMore}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ToolHeader({ tool }: { tool: CraftTool }) {
  const meta = TOOL_META[tool];

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-purple-500/15 p-2 text-purple-200">
          <meta.Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {meta.description}
          </p>
        </div>
      </div>
    </section>
  );
}

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
  const [localDirection, setLocalDirection] = useState(direction);

  useEffect(() => {
    setLocalDirection(direction);
  }, [direction]);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/75 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 space-y-1.5">
          <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            Direction
          </span>
          <input
            type="text"
            value={localDirection}
            onChange={(event) => {
              setLocalDirection(event.target.value);
              onDirectionChange(event.target.value);
            }}
            placeholder="Show, don't tell. Sharpen the subtext."
            className="w-full rounded-2xl border border-zinc-800 bg-black/20 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-purple-500"
            disabled={disabled}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !disabled) {
                onRerun(localDirection);
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => onRerun(localDirection)}
          disabled={disabled}
          className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Apply
        </button>
      </div>
    </section>
  );
}
