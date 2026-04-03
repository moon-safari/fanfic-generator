import { Story, Chapter } from "../types/story";
import {
  formatNewsletterCadence,
  getProjectModeLabel,
  getProjectUnitLabel,
  isNewsletterStory,
} from "./projectMode";

const PRIMARY_STORAGE_KEY = "writing-projects";
const LEGACY_STORAGE_KEY = "fanfic-stories";
const EXPORT_DIVIDER = "-".repeat(40);

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
  const lines = [`${story.title}\n`];
  lines.push(`Mode: ${getProjectModeLabel(story.projectMode)}`);

  if (isNewsletterStory(story)) {
    const modeConfig = story.modeConfig;
    if (modeConfig && "topic" in modeConfig) {
      lines.push(`Topic: ${modeConfig.topic}`);
      lines.push(`Audience: ${modeConfig.audience}`);
      lines.push(`Cadence: ${formatNewsletterCadence(modeConfig.cadence)}`);
      lines.push(`Current angle: ${modeConfig.issueAngle}`);
      if (modeConfig.subtitle) lines.push(`Subtitle: ${modeConfig.subtitle}`);
      if (modeConfig.hookApproach) lines.push(`Hook approach: ${modeConfig.hookApproach}`);
      if (modeConfig.ctaStyle) lines.push(`CTA style: ${modeConfig.ctaStyle}`);
      if (modeConfig.recurringSections?.length) {
        lines.push(`Recurring sections: ${modeConfig.recurringSections.join(", ")}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Voice: ${story.tone.join(", ")}`);
    }
  } else {
    if (story.fandom) lines.push(`Fandom: ${story.customFandom || story.fandom}`);
    lines.push(`Characters: ${story.characters.join(", ")}`);
    lines.push(`Relationship: ${story.relationshipType.toUpperCase()}`);
    lines.push(`Rating: ${story.rating.charAt(0).toUpperCase() + story.rating.slice(1)}`);
    if (story.setting) lines.push(`Setting: ${story.setting}`);
    lines.push(`Tone: ${story.tone.join(", ")}`);
    if (story.tropes.length) lines.push(`Tropes: ${story.tropes.join(", ")}`);
  }
  lines.push(`\n${EXPORT_DIVIDER}\n`);

  story.chapters.forEach((chapter, index) => {
    lines.push(
      `${getProjectUnitLabel(story.projectMode, { capitalize: true })} ${index + 1}\n`
    );
    lines.push(chapter.content);
    lines.push(`\n${EXPORT_DIVIDER}\n`);
  });

  return lines.join("\n");
}
