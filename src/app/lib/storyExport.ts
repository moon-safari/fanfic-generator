import type { Story } from "../types/story.ts";
import {
  formatNewsletterCadence,
  getComicsModeConfig,
  getProjectModeLabel,
  getProjectUnitLabel,
  getScreenplayModeConfig,
  isNewsletterStory,
} from "./projectMode.ts";

const EXPORT_DIVIDER = "-".repeat(40);

export interface StoryExportFile {
  filename: string;
  extension: "txt" | "fountain";
  mimeType: string;
  content: string;
}

export function buildPlainTextStoryExport(story: Story): string {
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
  } else if (story.projectMode === "screenplay") {
    const modeConfig = getScreenplayModeConfig(story);
    if (modeConfig) {
      lines.push(`Drafting preference: ${modeConfig.draftingPreference}`);
      lines.push(`Format: ${modeConfig.formatStyle}`);
      if (modeConfig.storyEngine) {
        lines.push(`Story engine: ${modeConfig.storyEngine}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Tone: ${story.tone.join(", ")}`);
    }
  } else if (story.projectMode === "comics") {
    const modeConfig = getComicsModeConfig(story);
    if (modeConfig) {
      lines.push(`Drafting preference: ${modeConfig.draftingPreference}`);
      lines.push(`Format: ${modeConfig.formatStyle}`);
      if (modeConfig.seriesEngine) {
        lines.push(`Series engine: ${modeConfig.seriesEngine}`);
      }
    }
    if (story.tone.length) {
      lines.push(`Tone: ${story.tone.join(", ")}`);
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

export function buildStoryExportFile(story: Story): StoryExportFile {
  const safeTitle =
    story.title.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    || "untitled";
  const screenplayConfig = getScreenplayModeConfig(story);

  if (
    story.projectMode === "screenplay"
    && screenplayConfig?.draftingPreference === "script_pages"
  ) {
    const scenes = story.chapters
      .map((chapter) => chapter.content.trim())
      .filter(Boolean)
      .join("\n\n");

    return {
      filename: `${safeTitle}.fountain`,
      extension: "fountain",
      mimeType: "text/plain;charset=utf-8",
      content: [`Title: ${story.title}`, "", scenes].join("\n"),
    };
  }

  return {
    filename: `${safeTitle}.txt`,
    extension: "txt",
    mimeType: "text/plain;charset=utf-8",
    content: buildPlainTextStoryExport(story),
  };
}
