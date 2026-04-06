import type {
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

  return {};
}

export function getProjectModeLabel(mode: ProjectMode): string {
  if (mode === "newsletter") {
    return "Newsletter";
  }
  if (mode === "screenplay") {
    return "Screenplay";
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
  return "Continue Story";
}

export function getLoadingContinueLabel(mode: ProjectMode): string {
  if (mode === "newsletter") {
    return "Writing the next issue...";
  }
  if (mode === "screenplay") {
    return "Writing the next scene...";
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
