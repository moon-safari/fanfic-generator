import { Story } from "../types/story";

const STORAGE_KEY = "fanfic-stories";

export function getStories(): Story[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
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
  lines.push(`Characters: ${story.characters}`);
  lines.push(`Setting: ${story.setting}`);
  lines.push(`Theme: ${story.plotTheme}`);
  lines.push(`Tone: ${story.tone}`);
  if (story.tropes.length) lines.push(`Tropes: ${story.tropes.join(", ")}`);
  lines.push(`\n${"—".repeat(40)}\n`);

  story.chapters.forEach((ch, i) => {
    lines.push(`Chapter ${i + 1}\n`);
    lines.push(ch);
    lines.push(`\n${"—".repeat(40)}\n`);
  });

  return lines.join("\n");
}
