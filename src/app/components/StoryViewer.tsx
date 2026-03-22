"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  Trash2,
  ArrowLeft,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Story, ContinueResponse } from "../types/story";
import { saveStory, deleteStory, exportStoryToText } from "../lib/storage";

interface StoryViewerProps {
  story: Story;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
}

export default function StoryViewer({
  story,
  onBack,
  onUpdate,
  onDelete,
}: StoryViewerProps) {
  const [currentChapter, setCurrentChapter] = useState(
    story.chapters.length - 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(story.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLatestChapter = currentChapter === story.chapters.length - 1;

  const handleContinue = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/continue-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to continue story");
      }

      const data: ContinueResponse = await res.json();
      const updated: Story = {
        ...story,
        chapters: [...story.chapters, data.chapter],
        updatedAt: new Date().toISOString(),
        wordCount:
          story.wordCount + data.chapter.split(/\s+/).length,
      };

      saveStory(updated);
      onUpdate(updated);
      setCurrentChapter(updated.chapters.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      const updated = {
        ...story,
        title: titleDraft.trim(),
        updatedAt: new Date().toISOString(),
      };
      saveStory(updated);
      onUpdate(updated);
    }
    setEditingTitle(false);
  };

  const handleExport = () => {
    const text = exportStoryToText(story);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    deleteStory(story.id);
    onDelete(story.id);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-3 py-1 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
              />
              <button onClick={handleSaveTitle} className="text-green-400 hover:text-green-300">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditingTitle(false)} className="text-zinc-400 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white truncate">
                {story.title}
              </h1>
              <button
                onClick={() => {
                  setTitleDraft(story.title);
                  setEditingTitle(true);
                }}
                className="text-zinc-500 hover:text-zinc-300 shrink-0"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-sm text-zinc-500">
            {story.chapters.length} chapter{story.chapters.length !== 1 ? "s" : ""} · {story.wordCount.toLocaleString()} words
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Export to .txt"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            title="Delete story"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-red-200 text-sm">Delete this story permanently?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chapter navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentChapter((c) => Math.max(0, c - 1))}
          disabled={currentChapter === 0}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-zinc-400">
          Chapter {currentChapter + 1} of {story.chapters.length}
        </span>
        <button
          onClick={() =>
            setCurrentChapter((c) =>
              Math.min(story.chapters.length - 1, c + 1)
            )
          }
          disabled={isLatestChapter}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Chapter content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="prose prose-invert prose-zinc max-w-none">
          {story.chapters[currentChapter]
            .split("\n\n")
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="text-zinc-200 leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
        </div>
      </div>

      {/* Continue button */}
      {isLatestChapter && (
        <>
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm mb-4">
              {error}
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 active:from-purple-700 active:to-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Writing the next chapter...
              </>
            ) : (
              "Continue Story →"
            )}
          </button>
        </>
      )}
    </div>
  );
}
