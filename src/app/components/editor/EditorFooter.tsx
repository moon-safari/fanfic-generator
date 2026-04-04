"use client";

import { Loader2 } from "lucide-react";
import {
  getContinueActionLabel,
  getLoadingContinueLabel,
} from "../../lib/projectMode";
import type { ProjectMode } from "../../types/story";

interface EditorFooterProps {
  projectMode: ProjectMode;
  wordCount: number;
  isLatestChapter: boolean;
  loading: boolean;
  error: string;
  saveError?: string | null;
  onContinue: () => void;
}

export default function EditorFooter({
  projectMode,
  wordCount,
  isLatestChapter,
  loading,
  error,
  saveError,
  onContinue,
}: EditorFooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0 pb-[env(safe-area-inset-bottom)]">
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-700 text-red-200 text-sm">
          {error}
        </div>
      )}
      {saveError && (
        <div className="px-4 py-1.5 text-xs text-red-400">
          Save failed — retrying...
        </div>
      )}

      <div className="flex items-center justify-between px-4 h-14">
        <span className="text-sm text-zinc-500">
          {wordCount.toLocaleString()} word{wordCount !== 1 ? "s" : ""}
        </span>

        {isLatestChapter && (
          <button
            onClick={onContinue}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500 active:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">
                  {getLoadingContinueLabel(projectMode)}
                </span>
                <span className="sm:hidden">Writing...</span>
              </>
            ) : (
              `${getContinueActionLabel(projectMode)} \u2192`
            )}
          </button>
        )}
      </div>
    </footer>
  );
}
