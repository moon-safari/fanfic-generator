import { Story } from "../types/story";

const STORAGE_KEY = "fanfic-stories";

// Migrate old story shape to new shape
function migrateStory(raw: Record<string, unknown>): Story {
  return {
    id: raw.id as string,
    title: raw.title as string,
    chapters: raw.chapters as string[],
    fandom: raw.fandom as string,
    customFandom: raw.customFandom as string | undefined,
    characters: Array.isArray(raw.characters)
      ? raw.characters
      : [raw.characters as string],
    relationshipType: (raw.relationshipType as Story["relationshipType"]) ?? "gen",
    rating: (raw.rating as Story["rating"]) ?? "mature",
    setting: (raw.setting as string) || undefined,
    tone: Array.isArray(raw.tone) ? raw.tone : [raw.tone as string],
    tropes: raw.tropes as string[],
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
    wordCount: raw.wordCount as number,
  };
}

export function getStories(): Story[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export function deleteStory(id: string): void {
  const stories = getStories().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
}

export function exportStoryToText(story: Story): string {
  const lines = [`${story.title}\n`];
  if (story.fandom) lines.push(`Fandom: ${story.customFandom || story.fandom}`);
  lines.push(`Characters: ${story.characters.join(", ")}`);
  lines.push(`Relationship: ${story.relationshipType.toUpperCase()}`);
  lines.push(`Rating: ${story.rating.charAt(0).toUpperCase() + story.rating.slice(1)}`);
  if (story.setting) lines.push(`Setting: ${story.setting}`);
  lines.push(`Tone: ${story.tone.join(", ")}`);
  if (story.tropes.length) lines.push(`Tropes: ${story.tropes.join(", ")}`);
  lines.push(`\n${"—".repeat(40)}\n`);

  story.chapters.forEach((ch, i) => {
    lines.push(`Chapter ${i + 1}\n`);
    lines.push(ch);
    lines.push(`\n${"—".repeat(40)}\n`);
  });

  return lines.join("\n");
}
