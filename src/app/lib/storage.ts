import { Story, Chapter } from "../types/story";
import { buildPlainTextStoryExport } from "./storyExport";

const PRIMARY_STORAGE_KEY = "writing-projects";
const LEGACY_STORAGE_KEY = "fanfic-stories";
// Migrate old story shape to new shape, handling legacy chapters: string[]
function migrateStory(raw: Record<string, unknown>): Story {
  let chapters: Chapter[];
  const rawChapters = raw.chapters;

  if (Array.isArray(rawChapters)) {
    if (rawChapters.length === 0) {
      chapters = [];
    } else if (typeof rawChapters[0] === "string") {
      chapters = (rawChapters as string[]).map((content, i) => ({
        id: `legacy-${i}`,
        chapterNumber: i + 1,
        content,
        wordCount: content.split(/\s+/).length,
      }));
    } else {
      chapters = rawChapters as Chapter[];
    }
  } else {
    chapters = [];
  }

  return {
    id: raw.id as string,
    title: raw.title as string,
    projectMode: (raw.projectMode as Story["projectMode"]) ?? "fiction",
    modeConfig: (raw.modeConfig as Story["modeConfig"]) ?? undefined,
    chapters,
    fandom: raw.fandom as string,
    customFandom: raw.customFandom as string | undefined,
    characters: Array.isArray(raw.characters)
      ? (raw.characters as string[])
      : [raw.characters as string],
    relationshipType: (raw.relationshipType as Story["relationshipType"]) ?? "gen",
    rating: (raw.rating as Story["rating"]) ?? "mature",
    setting: (raw.setting as string) || undefined,
    tone: Array.isArray(raw.tone) ? (raw.tone as string[]) : [raw.tone as string],
    tropes: (raw.tropes as string[]) ?? [],
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
    wordCount: raw.wordCount as number,
  };
}

export function getStories(): Story[] {
  if (typeof window === "undefined") return [];
  const raw =
    localStorage.getItem(PRIMARY_STORAGE_KEY)
    ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(migrateStory);
  } catch {
    return [];
  }
}

export function saveStory(story: Story): void {
  const stories = getStories();
  const idx = stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) {
    stories[idx] = story;
  } else {
    stories.unshift(story);
  }
  localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(stories));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function deleteStory(id: string): void {
  const stories = getStories().filter((s) => s.id !== id);
  localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(stories));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function exportStoryToText(story: Story): string {
  return buildPlainTextStoryExport(story);
}
