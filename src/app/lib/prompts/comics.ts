import { getComicsModeConfig } from "../projectMode.ts";
import type {
  ComicsStoryFormData,
  Story,
} from "../../types/story.ts";

export function buildComicsPage1Prompt(
  form: ComicsStoryFormData
): string {
  const tone = form.tone.join(" + ");

  return `You are a sharp comics writer building the opening page of a standard paged comic.

TITLE: ${form.title}
TONE: ${tone}
${form.seriesEngine ? `SERIES ENGINE: ${form.seriesEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: comic_script_pages

Write Page 1 as a comic script page.
- Use a PAGE heading.
- Use numbered panels.
- Keep panel descriptions visual, concise, and drawable.
- Separate dialogue, captions, SFX, and lettering notes clearly when needed.
- End the page with momentum or a page-turn hook.

PAGE 1 GOALS:
1. Start with an immediate visual hook.
2. Establish page pressure quickly.
3. Make every panel drawable and readable.
4. End with propulsion into the next page.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Page 1 text only]`;
}

export function buildComicsContinuationPrompt(
  story: Story,
  pageNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getComicsModeConfig(story);
  const pageHistory = story.chapters
    .map((page, index) => {
      const label = `Page ${index + 1}`;
      const isRecent = index >= story.chapters.length - 2;
      if (isRecent) {
        return `--- ${label} ---\n${page.content}`;
      }
      if (page.summary) {
        return `--- ${label} (Summary) ---\n${page.summary}`;
      }
      return `--- ${label} ---\n${page.content}`;
    })
    .join("\n\n");

  return `You are continuing a paged comic project.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: comic_script_pages
${modeConfig?.seriesEngine ? `SERIES ENGINE: ${modeConfig.seriesEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS PAGES:
${pageHistory}

PAGE ${pageNumber} INSTRUCTIONS:
1. Continue directly from the prior page's pressure.
2. Write the next page as a comic script page with numbered panels.
3. Keep visual continuity, motif continuity, and who-is-on-page continuity coherent.
4. Control dialogue and caption density so the page still feels readable.
5. End with propulsion, compression, or a page-turn reveal.

Write Page ${pageNumber} now (page text only):`;
}
