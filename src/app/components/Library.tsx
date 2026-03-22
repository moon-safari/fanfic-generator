"use client";

import { BookOpen, Clock } from "lucide-react";
import { Story } from "../types/story";
import { getFandomById } from "../lib/fandoms";

interface LibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
}

export default function Library({ stories, onSelectStory }: LibraryProps) {
  if (stories.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400 text-lg">No stories yet</p>
        <p className="text-zinc-500 text-sm mt-1">
          Create your first story to get started
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {stories.map((story) => {
        const fandom = getFandomById(story.fandom);
        const fandomLabel = story.customFandom || fandom?.name || "Original";
        const updatedAt = new Date(story.updatedAt);
        const timeAgo = getTimeAgo(updatedAt);

        return (
          <button
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                  {story.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {fandomLabel} · {story.chapters.length} chapter
                  {story.chapters.length !== 1 ? "s" : ""} ·{" "}
                  {story.wordCount.toLocaleString()} words
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {story.tropes.slice(0, 3).map((trope) => (
                    <span
                      key={trope}
                      className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full"
                    >
                      {trope}
                    </span>
                  ))}
                  {story.tropes.length > 3 && (
                    <span className="text-xs text-zinc-500">
                      +{story.tropes.length - 3}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-zinc-500 text-xs shrink-0">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
