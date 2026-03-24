"use client";

import { Loader2 } from "lucide-react";

interface EditorFooterProps {
  wordCount: number;
  isLatestChapter: boolean;
  loading: boolean;
  error: string;
  onContinue: () => void;
}

export default function EditorFooter({
  wordCount,
  isLatestChapter,
  loading,
  error,
  onContinue,
}: EditorFooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shrink-0">
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-700 text-red-200 text-sm">
          {error}
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
            className="px-5 py-2 rounded-xl font-semibold text-white text-sm transition-all flex items-center gap-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 active:from-purple-700 active:to-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Writing the next chapter...</span>
                <span className="sm:hidden">Writing...</span>
              </>
            ) : (
              "Continue Story \u2192"
            )}
          </button>
        )}
      </div>
    </footer>
  );
}
