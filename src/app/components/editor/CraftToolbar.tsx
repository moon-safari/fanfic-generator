"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2,
  PenLine,
  Expand,
  Palette,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { CraftTool } from "./useCraftTools";

const REWRITE_DIRECTIONS = [
  "More tense",
  "More poetic",
  "Shorter",
  "More dialogue",
  "More descriptive",
  "Custom...",
] as const;

interface CraftToolbarProps {
  position: { top: number; left: number };
  loading: boolean;
  activeTool: CraftTool | null;
  onTool: (tool: CraftTool, direction?: string) => void;
  onDismiss: () => void;
}

export default function CraftToolbar({
  position,
  loading,
  activeTool,
  onTool,
  onDismiss,
}: CraftToolbarProps) {
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [customDirection, setCustomDirection] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        onDismiss();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onDismiss]);

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const handleRewriteDirection = useCallback(
    (direction: string) => {
      if (direction === "Custom...") {
        setShowCustomInput(true);
        setShowRewriteMenu(false);
        return;
      }
      setShowRewriteMenu(false);
      onTool("rewrite", direction);
    },
    [onTool]
  );

  const handleCustomSubmit = useCallback(() => {
    if (customDirection.trim()) {
      onTool("rewrite", customDirection.trim());
      setCustomDirection("");
      setShowCustomInput(false);
    }
  }, [customDirection, onTool]);

  const btnBase =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200";
  const btnIdle = "text-zinc-300 hover:bg-zinc-700 hover:text-white";
  const btnActive = "bg-purple-600 text-white";

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-1 flex items-center gap-0.5">
        {/* Rewrite with dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (loading) return;
              setShowRewriteMenu((v) => !v);
            }}
            disabled={loading}
            className={`${btnBase} ${activeTool === "rewrite" ? btnActive : btnIdle} disabled:opacity-50`}
          >
            {loading && activeTool === "rewrite" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PenLine className="w-4 h-4" />
            )}
            Rewrite
            <ChevronDown className="w-3 h-3" />
          </button>

          {showRewriteMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 z-50">
              {REWRITE_DIRECTIONS.map((dir) => (
                <button
                  key={dir}
                  onClick={() => handleRewriteDirection(dir)}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {dir}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Expand */}
        <button
          onClick={() => !loading && onTool("expand")}
          disabled={loading}
          className={`${btnBase} ${activeTool === "expand" ? btnActive : btnIdle} disabled:opacity-50`}
        >
          {loading && activeTool === "expand" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Expand className="w-4 h-4" />
          )}
          Expand
        </button>

        {/* Describe */}
        <button
          onClick={() => !loading && onTool("describe")}
          disabled={loading}
          className={`${btnBase} ${activeTool === "describe" ? btnActive : btnIdle} disabled:opacity-50`}
        >
          {loading && activeTool === "describe" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Palette className="w-4 h-4" />
          )}
          Describe
        </button>

        {/* Brainstorm */}
        <button
          onClick={() => !loading && onTool("brainstorm")}
          disabled={loading}
          className={`${btnBase} ${activeTool === "brainstorm" ? btnActive : btnIdle} disabled:opacity-50`}
        >
          {loading && activeTool === "brainstorm" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          Brainstorm
        </button>
      </div>

      {/* Custom direction input */}
      {showCustomInput && (
        <div className="mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2 flex gap-2">
          <input
            ref={customInputRef}
            type="text"
            value={customDirection}
            onChange={(e) => setCustomDirection(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            placeholder="e.g. More sarcastic, less exposition..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleCustomSubmit}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-500 transition-colors"
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
}
