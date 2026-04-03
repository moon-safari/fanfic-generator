"use client";

import { BookOpen, Clock } from "lucide-react";
import { getFandomById } from "../lib/fandoms";
import {
  formatNewsletterCadence,
  getNewsletterModeConfig,
  getProjectModeLabel,
  getProjectUnitLabel,
  isNewsletterStory,
} from "../lib/projectMode";
import type { Story } from "../types/story";

interface LibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
}

export default function Library({ stories, onSelectStory }: LibraryProps) {
  if (stories.length === 0) {
    return (
      <div className="py-16 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
        <p className="text-lg text-zinc-400">No projects yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Start a fiction or newsletter project to open your workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="mb-1">
        <p className="text-sm font-semibold text-white">Saved projects</p>
        <p className="mt-1 text-sm text-zinc-500">
          Open an existing project and continue where you left off.
        </p>
      </div>

      {stories.map((story) => {
        const fandom = getFandomById(story.fandom);
        const fandomLabel = story.customFandom || fandom?.name || "Original";
        const updatedAt = new Date(story.updatedAt);
        const timeAgo = getTimeAgo(updatedAt);
        const modeLabel = getProjectModeLabel(story.projectMode);
        const metaLine = isNewsletterStory(story)
          ? buildNewsletterMetaLine(story)
          : [
              modeLabel,
              fandomLabel,
              (story.rating || "mature").toUpperCase(),
              (story.relationshipType || "gen").toUpperCase(),
              `${story.chapters.length} ${getProjectUnitLabel(story.projectMode, {
                count: story.chapters.length,
              })}`,
              `${story.wordCount.toLocaleString()} words`,
            ].join(" | ");

        return (
          <button
            key={story.id}
            onClick={() => onSelectStory(story)}
            className="group w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition-colors hover:border-zinc-600"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-white transition-colors group-hover:text-purple-300">
                  {story.title}
                </h3>
                <p className="mt-1 break-words text-sm text-zinc-500">
                  {metaLine}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function buildNewsletterMetaLine(story: Story): string {
  const config = getNewsletterModeConfig(story);
  const parts = [getProjectModeLabel(story.projectMode)];

  if (config?.topic) {
    parts.push(config.topic);
  }

  if (config?.audience) {
    parts.push(`For ${config.audience}`);
  }

  if (config?.cadence) {
    parts.push(formatNewsletterCadence(config.cadence));
  }

  parts.push(
    `${story.chapters.length} ${getProjectUnitLabel(story.projectMode, {
      count: story.chapters.length,
    })}`
  );
  parts.push(`${story.wordCount.toLocaleString()} words`);

  return parts.join(" | ");
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}
