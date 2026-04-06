import type {
  ComicsModeConfig,
  ComicsStoryFormData,
  GameWritingModeConfig,
  GameWritingStoryFormData,
  NewsletterModeConfig,
  NewsletterStoryFormData,
  ProjectMode,
  ScreenplayModeConfig,
  ScreenplayStoryFormData,
  Story,
  StoryModeConfig,
  StoryFormData,
} from "../types/story";

export function isNewsletterFormData(
  value: StoryFormData
): value is NewsletterStoryFormData {
  return value.projectMode === "newsletter";
}

export function isScreenplayFormData(
  value: StoryFormData
): value is ScreenplayStoryFormData {
  return value.projectMode === "screenplay";
}

export function isComicsFormData(
  value: StoryFormData
): value is ComicsStoryFormData {
  return value.projectMode === "comics";
}

export function isGameWritingFormData(
  value: StoryFormData
): value is GameWritingStoryFormData {
  return value.projectMode === "game_writing";
}

export function isNewsletterStory(story: Story): boolean {
  return story.projectMode === "newsletter";
}

export function getNewsletterModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): NewsletterModeConfig | null {
  if (story.projectMode !== "newsletter" || !story.modeConfig) {
    return null;
  }

  return parseNewsletterModeConfig(story.modeConfig);
}

export function getScreenplayModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): ScreenplayModeConfig | null {
  if (story.projectMode !== "screenplay" || !story.modeConfig) {
    return null;
  }

  return parseScreenplayModeConfig(story.modeConfig);
}

export function getComicsModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): ComicsModeConfig | null {
  if (story.projectMode !== "comics" || !story.modeConfig) {
    return null;
  }

  return parseComicsModeConfig(story.modeConfig);
}

export function getGameWritingModeConfig(
  story: Pick<Story, "projectMode" | "modeConfig">
): GameWritingModeConfig | null {
  if (story.projectMode !== "game_writing" || !story.modeConfig) {
    return null;
  }

  return parseGameWritingModeConfig(story.modeConfig);
}

export function parseNewsletterModeConfig(
  input: unknown
): NewsletterModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<NewsletterModeConfig>;
  if (
    typeof candidate.topic !== "string"
    || typeof candidate.audience !== "string"
    || typeof candidate.issueAngle !== "string"
    || typeof candidate.cadence !== "string"
  ) {
    return null;
  }

  const recurringSections = Array.isArray(candidate.recurringSections)
    ? candidate.recurringSections
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  return {
    topic: candidate.topic.trim(),
    audience: candidate.audience.trim(),
    issueAngle: candidate.issueAngle.trim(),
    cadence: candidate.cadence as NewsletterModeConfig["cadence"],
    subtitle:
      typeof candidate.subtitle === "string" && candidate.subtitle.trim()
        ? candidate.subtitle.trim()
        : undefined,
    hookApproach:
      typeof candidate.hookApproach === "string" && candidate.hookApproach.trim()
        ? candidate.hookApproach.trim()
        : undefined,
    ctaStyle:
      typeof candidate.ctaStyle === "string" && candidate.ctaStyle.trim()
        ? candidate.ctaStyle.trim()
        : undefined,
    recurringSections: recurringSections.length > 0 ? recurringSections : undefined,
  };
}

export function parseScreenplayModeConfig(
  input: unknown
): ScreenplayModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<ScreenplayModeConfig>;
  if (
    (candidate.draftingPreference !== "script_pages"
      && candidate.draftingPreference !== "beat_draft")
    || candidate.formatStyle !== "fountain"
  ) {
    return null;
  }

  return {
    draftingPreference: candidate.draftingPreference,
    formatStyle: "fountain",
    storyEngine:
      candidate.storyEngine === "feature"
      || candidate.storyEngine === "pilot"
      || candidate.storyEngine === "short"
        ? candidate.storyEngine
        : undefined,
  };
}

export function parseComicsModeConfig(input: unknown): ComicsModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<ComicsModeConfig>;
  if (
    candidate.draftingPreference !== "comic_script_pages"
    || candidate.formatStyle !== "comic_script"
  ) {
    return null;
  }

  return {
    draftingPreference: "comic_script_pages",
    formatStyle: "comic_script",
    seriesEngine:
      candidate.seriesEngine === "issue"
      || candidate.seriesEngine === "one_shot"
      || candidate.seriesEngine === "graphic_novel"
        ? candidate.seriesEngine
        : undefined,
  };
}

export function parseGameWritingModeConfig(
  input: unknown
): GameWritingModeConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<GameWritingModeConfig>;
  if (
    candidate.draftingPreference !== "hybrid_quest_brief"
    || candidate.formatStyle !== "quest_brief"
  ) {
    return null;
  }

  return {
    draftingPreference: "hybrid_quest_brief",
    formatStyle: "quest_brief",
    questEngine:
      candidate.questEngine === "main_quest"
      || candidate.questEngine === "side_quest"
      || candidate.questEngine === "questline"
        ? candidate.questEngine
        : undefined,
  };
}

export function parseStoryModeConfig(
  projectMode: ProjectMode,
  input: unknown
): StoryModeConfig | null {
  if (projectMode === "newsletter") {
    return parseNewsletterModeConfig(input);
  }

  if (projectMode === "screenplay") {
    return parseScreenplayModeConfig(input);
  }

  if (projectMode === "comics") {
    return parseComicsModeConfig(input);
  }

  if (projectMode === "game_writing") {
    return parseGameWritingModeConfig(input);
  }

  return {};
}

export function getProjectModeLabel(mode: ProjectMode): string {
  if (mode === "newsletter") {
    return "Newsletter";
  }
  if (mode === "screenplay") {
    return "Screenplay";
  }
  if (mode === "comics") {
    return "Comics";
  }
  if (mode === "game_writing") {
    return "Game Writing";
  }
  return "Fiction";
}

export function getProjectUnitLabel(
  mode: ProjectMode,
  options: {
    count?: number;
    capitalize?: boolean;
    abbreviated?: boolean;
  } = {}
): string {
  const { count = 1, capitalize = false, abbreviated = false } = options;
  if (mode === "game_writing") {
    const singular = abbreviated
      ? "Q."
      : capitalize
        ? "Quest"
        : "quest";
    const plural = capitalize ? "Quests" : "quests";
    return count === 1 ? singular : plural;
  }

  if (mode === "comics") {
    const singular = abbreviated
      ? "Pg."
      : capitalize
        ? "Page"
        : "page";
    const plural = capitalize ? "Pages" : "pages";
    return count === 1 ? singular : plural;
  }

  if (mode === "screenplay") {
    const singular = abbreviated
      ? "Sc."
      : capitalize
        ? "Scene"
        : "scene";
    const plural = capitalize ? "Scenes" : "scenes";
    return count === 1 ? singular : plural;
  }

  const singular =
    mode === "newsletter"
      ? abbreviated
        ? "Iss."
        : capitalize
          ? "Issue"
          : "issue"
      : abbreviated
        ? "Ch."
        : capitalize
          ? "Chapter"
          : "chapter";

  const plural =
    mode === "newsletter"
      ? capitalize
        ? "Issues"
        : "issues"
      : capitalize
        ? "Chapters"
        : "chapters";

  return count === 1 ? singular : plural;
}

export function getContinueActionLabel(mode: ProjectMode): string {
  if (mode === "newsletter") {
    return "Continue Issue";
  }
  if (mode === "screenplay") {
    return "Continue Scene";
  }
  if (mode === "comics") {
    return "Continue Page";
  }
  if (mode === "game_writing") {
    return "Continue Quest";
  }
  return "Continue Story";
}

export function getLoadingContinueLabel(mode: ProjectMode): string {
  if (mode === "newsletter") {
    return "Writing the next issue...";
  }
  if (mode === "screenplay") {
    return "Writing the next scene...";
  }
  if (mode === "comics") {
    return "Writing the next page...";
  }
  if (mode === "game_writing") {
    return "Writing the next quest...";
  }
  return "Writing the next chapter...";
}

export function formatProjectProgressLabel(
  mode: ProjectMode,
  currentNumber: number,
  totalCount: number
): string {
  return `${getProjectUnitLabel(mode, { capitalize: true })} ${currentNumber} of ${totalCount}`;
}

export function formatNewsletterCadence(value: NewsletterModeConfig["cadence"]): string {
  switch (value) {
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Biweekly";
    case "monthly":
      return "Monthly";
    default:
      return "Irregular";
  }
}
