"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Loader2,
  PenLine,
  Expand,
  Palette,
  Lightbulb,
  ChevronDown,
  X,
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

interface CraftDrawerProps {
  loading: boolean;
  activeTool: CraftTool | null;
  onTool: (tool: CraftTool, direction?: string) => void;
  onDismiss: () => void;
}

export default function CraftDrawer({
  loading,
  activeTool,
  onTool,
  onDismiss,
}: CraftDrawerProps) {
  const [showRewriteMenu, setShowRewriteMenu] = useState(false);
  const [customDirection, setCustomDirection] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Focus custom input when shown
  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  // Tap outside backdrop dismisses drawer
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onDismiss();
      }
    },
    [onDismiss]
  );

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
    "flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 min-h-[44px] min-w-[44px]";
  const btnIdle = "text-zinc-300 hover:bg-zinc-700 hover:text-white active:bg-zinc-600";
  const btnActive = "bg-purple-600 text-white";

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40"
    >
      <div
        ref={drawerRef}
        className="absolute bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out"
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-zinc-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-sm font-medium text-zinc-400">Craft Tools</span>
          <button
            onClick={onDismiss}
            className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool buttons */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {/* Rewrite */}
          <button
            onClick={() => {
              if (loading) return;
              setShowRewriteMenu((v) => !v);
            }}
            disabled={loading}
            className={`${btnBase} ${activeTool === "rewrite" ? btnActive : btnIdle} disabled:opacity-50`}
          >
            {loading && activeTool === "rewrite" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <PenLine className="w-5 h-5" />
            )}
            Rewrite
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Expand */}
          <button
            onClick={() => !loading && onTool("expand")}
            disabled={loading}
            className={`${btnBase} ${activeTool === "expand" ? btnActive : btnIdle} disabled:opacity-50`}
          >
            {loading && activeTool === "expand" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Expand className="w-5 h-5" />
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
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Palette className="w-5 h-5" />
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
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Lightbulb className="w-5 h-5" />
            )}
            Brainstorm
          </button>
        </div>

        {/* Rewrite direction menu */}
        {showRewriteMenu && (
          <div className="px-4 pb-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg py-1">
              {REWRITE_DIRECTIONS.map((dir) => (
                <button
                  key={dir}
                  onClick={() => handleRewriteDirection(dir)}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors min-h-[44px]"
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom direction input */}
        {showCustomInput && (
          <div className="px-4 pb-4 flex gap-2">
            <input
              ref={customInputRef}
              type="text"
              value={customDirection}
              onChange={(e) => setCustomDirection(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              placeholder="e.g. More sarcastic, less exposition..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 min-h-[44px]"
            />
            <button
              onClick={handleCustomSubmit}
              className="px-5 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-500 transition-colors min-h-[44px]"
            >
              Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
