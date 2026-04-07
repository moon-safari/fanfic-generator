import {
  formatAdaptationWorkflowStateSource,
  getAdaptationPreset,
} from "../adaptations.ts";
import type {
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../../types/adaptation";
import type { NewsletterIssuePackageSelectionValues } from "../../types/newsletter";
import type { ProjectMode, StoryModeConfig } from "../../types/story";

interface BuildChapterAdaptationPromptInput {
  outputType: AdaptationOutputType;
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  fandom: string;
  customFandom?: string;
  characters: string[];
  tone: string[];
  tropes: string[];
  chapterNumber: number;
  chapterSummary?: string | null;
  chapterContent: string;
  storyContext: string;
  planningContext?: string;
  existingOutputs?: ChapterAdaptationResult[];
  packageSelection?: NewsletterIssuePackageSelectionValues | null;
  workflowLabel?: string;
  currentStepLabel?: string;
  supportingArtifacts?: Array<{
    label: string;
    content: string;
  }>;
}

interface BuildPublicTeaserFromRecapPromptInput {
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  fandom: string;
  customFandom?: string;
  characters: string[];
  tone: string[];
  tropes: string[];
  chapterNumber: number;
  chapterSummary?: string | null;
  newsletterRecap: string;
  storyContext: string;
  planningContext?: string;
}

interface BuildChainedAdaptationPromptInput {
  outputType: AdaptationOutputType;
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  fandom: string;
  customFandom?: string;
  characters: string[];
  tone: string[];
  tropes: string[];
  chapterNumber: number;
  chapterSummary?: string | null;
  sourceLabel: string;
  sourceContent: string;
  storyContext: string;
  planningContext?: string;
  existingOutputs?: ChapterAdaptationResult[];
  packageSelection?: NewsletterIssuePackageSelectionValues | null;
  workflowLabel?: string;
  currentStepLabel?: string;
  immediateSourceLabel?: string;
}

export function buildChapterAdaptationPrompt({
  outputType,
  storyTitle,
  projectMode,
  modeConfig,
  fandom,
  customFandom,
  characters,
  tone,
  tropes,
  chapterNumber,
  chapterSummary,
  chapterContent,
  storyContext,
  planningContext,
  existingOutputs,
  packageSelection,
  workflowLabel,
  currentStepLabel,
  supportingArtifacts,
}: BuildChapterAdaptationPromptInput): string {
  const preset = getAdaptationPreset(outputType);
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const projectContext = buildProjectContextBlock({
    storyTitle,
    projectMode,
    modeConfig,
    fandom,
    customFandom,
    characters,
    tone,
    tropes,
  });

  return `You are helping adapt a ${unitLabel} into a different writing output.

The source ${unitLabel} is the primary record of what happens.
The story context is the source of truth for names, relationships, lore, and character state.
The planning layer explains what this ${unitLabel} was trying to do and which active arcs or threads matter most.
Preserve identity, continuity, and tone. Do not invent unsupported plot points.

TARGET OUTPUT: ${preset.label}
TARGET GOAL: ${preset.description}

${buildFormatInstructions(outputType)}

PROJECT CONTEXT:
${projectContext}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}${buildWorkflowStateBlock({
    outputType,
    existingOutputs,
    packageSelection,
    workflowLabel,
    currentStepLabel,
  })}${buildSupportingArtifactBlock(outputType, supportingArtifacts)}
${unitLabelCapitalized.toUpperCase()} NUMBER:
${chapterNumber}

${chapterSummary ? `${unitLabelCapitalized.toUpperCase()} SUMMARY:\n${chapterSummary}\n\n` : ""}${unitLabelCapitalized.toUpperCase()} SOURCE MATERIAL:
${truncateChapterContent(chapterContent)}

Output ONLY the final adapted text. No markdown fences, no commentary, no analysis.`;
}

export function buildPublicTeaserFromRecapPrompt({
  storyTitle,
  projectMode,
  modeConfig,
  fandom,
  customFandom,
  characters,
  tone,
  tropes,
  chapterNumber,
  chapterSummary,
  newsletterRecap,
  storyContext,
  planningContext,
}: BuildPublicTeaserFromRecapPromptInput): string {
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const projectContext = buildProjectContextBlock({
    storyTitle,
    projectMode,
    modeConfig,
    fandom,
    customFandom,
    characters,
    tone,
    tropes,
  });

  return `You are creating a public-facing teaser from an existing ${unitLabel} recap.

Use the recap as the immediate bridge text.
Use the story context as the source of truth for names, relationships, lore, and tone.
Use the planning layer as soft guidance for what this ${unitLabel} was trying to accomplish.
Keep spoilers light and preserve intrigue.

TARGET OUTPUT: Public Teaser
TARGET GOAL: Create a compact teaser that can travel outward from the project without losing its identity.

FORMAT INSTRUCTIONS:
- Write 2 short teaser paragraphs.
- End with one sharp hook line.
- Avoid giving away every key beat.
- Preserve the ${unitLabel}'s emotional flavor and the story's specific voice.

PROJECT CONTEXT:
${projectContext}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}
${unitLabelCapitalized.toUpperCase()} NUMBER:
${chapterNumber}

${chapterSummary ? `${unitLabelCapitalized.toUpperCase()} SUMMARY:\n${chapterSummary}\n\n` : ""}NEWSLETTER RECAP SOURCE:
${truncateAdaptationText(newsletterRecap, 5000)}

Output ONLY the final teaser text. No markdown fences, no commentary, no analysis.`;
}

export function buildChainedAdaptationPrompt({
  outputType,
  storyTitle,
  projectMode,
  modeConfig,
  fandom,
  customFandom,
  characters,
  tone,
  tropes,
  chapterNumber,
  chapterSummary,
  sourceLabel,
  sourceContent,
  storyContext,
  planningContext,
  existingOutputs,
  packageSelection,
  workflowLabel,
  currentStepLabel,
  immediateSourceLabel,
}: BuildChainedAdaptationPromptInput): string {
  const preset = getAdaptationPreset(outputType);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const projectContext = buildProjectContextBlock({
    storyTitle,
    projectMode,
    modeConfig,
    fandom,
    customFandom,
    characters,
    tone,
    tropes,
  });

  return `You are transforming one adaptation artifact into the next writing output.

Use the source artifact as the immediate bridge text.
Use the story context as the source of truth for names, relationships, lore, and tone.
Use the planning layer as soft guidance for emphasis, payoff logic, and active project threads.
Preserve identity and continuity. Do not invent unsupported plot points.

TARGET OUTPUT: ${preset.label}
TARGET GOAL: ${preset.description}

${buildFormatInstructions(outputType)}

PROJECT CONTEXT:
${projectContext}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}${buildWorkflowStateBlock({
    outputType,
    existingOutputs,
    packageSelection,
    workflowLabel,
    currentStepLabel,
    immediateSourceLabel,
  })}${unitLabelCapitalized.toUpperCase()} NUMBER:
${chapterNumber}

${chapterSummary ? `${unitLabelCapitalized.toUpperCase()} SUMMARY:\n${chapterSummary}\n\n` : ""}${sourceLabel.toUpperCase()}:
${truncateAdaptationText(sourceContent, 5000)}

Output ONLY the final adapted text. No markdown fences, no commentary, no analysis.`;
}

export function getAdaptationMaxTokens(
  outputType: AdaptationOutputType
): number {
  switch (outputType) {
    case "short_summary":
      return 350;
    case "public_teaser":
      return 450;
    case "issue_subject_line":
      return 300;
    case "issue_deck":
      return 350;
    case "issue_section_package":
      return 800;
    case "issue_cta_variants":
      return 450;
    case "issue_send_checklist":
      return 650;
    case "issue_hook_variants":
      return 650;
    case "newsletter_recap":
      return 800;
    case "screenplay_beat_sheet":
      return 1000;
    case "screenplay_scene_pages":
      return 1200;
    case "quest_handoff_sheet":
      return 1100;
    case "comic_page_beat_sheet":
      return 1000;
    case "argument_evidence_brief":
      return 1100;
    default:
      return 800;
  }
}

function buildFormatInstructions(outputType: AdaptationOutputType): string {
  switch (outputType) {
    case "short_summary":
      return `FORMAT INSTRUCTIONS:
- Write one tight paragraph of 120 to 170 words.
- Capture the key turn, emotional movement, and source-unit consequence.
- Keep it grounded and spoiler-aware, but do not become vague.`;
    case "newsletter_recap":
      return `FORMAT INSTRUCTIONS:
- Start with a short headline on its own line.
- Then write 2 to 3 short recap paragraphs in a lively newsletter voice.
- End with a brief "Why it matters:" line.
- Keep the prose readable and audience-facing.`;
    case "screenplay_beat_sheet":
      return `FORMAT INSTRUCTIONS:
- Write 6 to 9 numbered beats.
- Each beat should be one or two sentences focused on visual action and dramatic movement.
- Use screenplay-friendly cues and scene logic, but stay in beat-sheet form rather than full script pages.
- Preserve the source unit's emotional turns and sequence of revelations.`;
    case "screenplay_scene_pages":
      return `FORMAT INSTRUCTIONS:
- Write Fountain-compatible screenplay scene pages.
- Use scene headings where needed and keep action visual and concise.
- Render dialogue in screenplay form, not prose paragraphs.
- Preserve the source unit's dramatic turns, reveals, and continuity obligations.`;
    case "quest_handoff_sheet":
      return `FORMAT INSTRUCTIONS:
- Write a structured quest handoff with these headings:
  Premise
  Player Objective
  Core Stages
  Branch Highlights
  Key NPCs / Factions / Items
  Rewards / Consequences
  Open Implementation Notes
- Keep each section concise and production-facing.
- Preserve quest pressure, branch intent, and unresolved follow-up hooks.
- Do not turn this into pseudo-code or a full dialogue script.`;
    case "argument_evidence_brief":
      return `FORMAT INSTRUCTIONS:
- Write a structured non-fiction brief with these headings:
  Main argument
  Section claims
  Evidence used
  Cited sources
  Counterpoints / caveats
  Proof gaps / follow-up needs
- Keep each section concise and production-facing.
- Preserve the written section's actual support level instead of upgrading tentative claims into certainties.
- Use the planning layer as context for intent, but ground the brief in what the section really establishes.`;
    case "comic_page_beat_sheet":
      return `FORMAT INSTRUCTIONS:
- Write 4 to 8 numbered page beats.
- Focus on visual action, reveal placement, density shifts, and end-of-page pressure.
- Keep each beat to one or two sentences.
- Preserve the source page's continuity, not just its premise.`;
    case "public_teaser":
      return `FORMAT INSTRUCTIONS:
- Write 2 short teaser paragraphs for public-facing promotion.
- Keep spoilers light while preserving the source unit's emotional flavor.
- End with one sharp hook line that invites the reader onward.
- Prioritize intrigue, voice, and reader curiosity.`;
    case "issue_subject_line":
      return `FORMAT INSTRUCTIONS:
- Write exactly 5 numbered newsletter subject line options.
- Keep each option under 70 characters when possible.
- Make them specific, intelligent, and subscriber-facing.
- Avoid spammy urgency, generic creator-economy phrasing, or fake curiosity gaps.`;
    case "issue_deck":
      return `FORMAT INSTRUCTIONS:
- Write exactly 3 numbered issue deck or subtitle options.
- Each option should be one sentence of 12 to 24 words.
- Clarify the issue's angle and reader value quickly.
- Keep the tone aligned with the publication identity rather than sounding like generic marketing copy.`;
    case "issue_section_package":
      return `FORMAT INSTRUCTIONS:
- Build one short draft block for each recurring section listed in the project context.
- Use this structure for each section: a markdown heading with the section name, then 2 to 4 sentences of issue-ready copy.
- Make each section feel distinct and purposeful instead of repeating the same point.
- Keep every section aligned with the current issue angle and the publication's voice.
- If the publication has no recurring sections configured, say so briefly and recommend adding 2 or 3 named sections before packaging.`;
    case "issue_hook_variants":
      return `FORMAT INSTRUCTIONS:
- Write exactly 3 numbered opening-hook variants.
- Each hook should be 2 to 4 sentences.
- Make the angles meaningfully different while preserving the same issue truth.
- Open from a concrete creator moment, tension, or observation before widening into the issue argument.`;
    case "issue_cta_variants":
      return `FORMAT INSTRUCTIONS:
- Write exactly 3 numbered CTA options for the end of the issue.
- Each CTA should be 1 to 2 sentences.
- Favor a soft but specific invitation to reply, reflect, or carry the idea forward.
- Match the publication's stated CTA style and avoid hard-sell language.`;
    case "issue_send_checklist":
      return `FORMAT INSTRUCTIONS:
- Write a short internal preflight review for this newsletter issue.
- Use these headings in order: Send checklist, Ready, Needs attention, Missing pieces, Suggested next move.
- Under Ready, Needs attention, and Missing pieces, use flat bullet points.
- Refer concretely to the issue angle, recurring sections, hook approach, and CTA style.
- Check whether a recurring section package exists and whether it covers the configured sections.
- If a package artifact is missing from the provided artifact block, say so plainly instead of pretending it exists.
- Keep the checklist concise, practical, and under 220 words.`;
    default:
      return `FORMAT INSTRUCTIONS:
- Adapt the chapter faithfully into the requested format.`;
  }
}

function buildSupportingArtifactBlock(
  outputType: AdaptationOutputType,
  supportingArtifacts?: Array<{
    label: string;
    content: string;
  }>
) {
  if (outputType !== "issue_send_checklist") {
    return "";
  }

  const normalizedArtifacts =
    supportingArtifacts
      ?.map((artifact) => ({
        label: artifact.label.trim(),
        content: artifact.content.trim(),
      }))
      .filter((artifact) => artifact.label && artifact.content) ?? [];

  if (normalizedArtifacts.length === 0) {
    return `AVAILABLE ISSUE-PACKAGE ARTIFACTS:
- None saved yet. Review the issue against the publication profile and call out missing package elements explicitly.

`;
  }

  return `AVAILABLE ISSUE-PACKAGE ARTIFACTS:
${normalizedArtifacts
  .map(
    (artifact) =>
      `${artifact.label.toUpperCase()}:\n${truncateAdaptationText(artifact.content, 1400)}`
  )
  .join("\n\n")}

`;
}

function buildProjectContextBlock({
  storyTitle,
  projectMode,
  modeConfig,
  fandom,
  customFandom,
  characters,
  tone,
  tropes,
}: {
  storyTitle: string;
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
  fandom: string;
  customFandom?: string;
  characters: string[];
  tone: string[];
  tropes: string[];
}): string {
  const gameWritingConfig = getGameWritingModeConfig({
    projectMode,
    modeConfig,
  });
  const newsletterConfig = getNewsletterModeConfig({
    projectMode,
    modeConfig,
  });
  const nonFictionConfig = getNonFictionModeConfig({
    projectMode,
    modeConfig,
  });
  const comicsConfig = getComicsModeConfig({
    projectMode,
    modeConfig,
  });
  const screenplayConfig = getScreenplayModeConfig({
    projectMode,
    modeConfig,
  });

  return [
    `${projectMode === "newsletter" ? "SERIES" : "STORY"}: ${storyTitle}`,
    projectMode === "newsletter"
      ? `MODE: Newsletter`
      : projectMode === "screenplay"
        ? "MODE: Screenplay"
      : projectMode === "comics"
        ? "MODE: Comics"
      : projectMode === "game_writing"
        ? "MODE: Game Writing"
      : projectMode === "non_fiction"
        ? "MODE: Non-Fiction"
      : `FANDOM: ${customFandom?.trim() || fandom || "Original work"}`,
    nonFictionConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${nonFictionConfig.draftingPreference}`
      : "",
    nonFictionConfig?.pieceEngine
      ? `PIECE ENGINE: ${nonFictionConfig.pieceEngine}`
      : "",
    gameWritingConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${gameWritingConfig.draftingPreference}`
      : "",
    gameWritingConfig?.questEngine
      ? `QUEST ENGINE: ${gameWritingConfig.questEngine}`
      : "",
    newsletterConfig?.topic ? `TOPIC: ${newsletterConfig.topic}` : "",
    newsletterConfig?.audience ? `AUDIENCE: ${newsletterConfig.audience}` : "",
    newsletterConfig?.cadence ? `CADENCE: ${newsletterConfig.cadence}` : "",
    newsletterConfig?.issueAngle ? `CURRENT ANGLE: ${newsletterConfig.issueAngle}` : "",
    newsletterConfig?.subtitle ? `SUBTITLE: ${newsletterConfig.subtitle}` : "",
    newsletterConfig?.hookApproach ? `HOOK APPROACH: ${newsletterConfig.hookApproach}` : "",
    newsletterConfig?.ctaStyle ? `CTA STYLE: ${newsletterConfig.ctaStyle}` : "",
    newsletterConfig?.recurringSections?.length
      ? `RECURRING SECTIONS: ${newsletterConfig.recurringSections.join(", ")}`
      : "",
    comicsConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${comicsConfig.draftingPreference}`
      : "",
    comicsConfig?.seriesEngine
      ? `SERIES ENGINE: ${comicsConfig.seriesEngine}`
      : "",
    screenplayConfig?.draftingPreference
      ? `DRAFTING PREFERENCE: ${screenplayConfig.draftingPreference}`
      : "",
    screenplayConfig?.storyEngine
      ? `STORY ENGINE: ${screenplayConfig.storyEngine}`
      : "",
    characters.length > 0 ? `CORE CHARACTERS: ${characters.join(", ")}` : "",
    tone.length > 0 ? `TONE: ${tone.join(", ")}` : "",
    tropes.length > 0 ? `TROPES: ${tropes.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWorkflowStateBlock({
  outputType,
  existingOutputs,
  packageSelection,
  workflowLabel,
  currentStepLabel,
  immediateSourceLabel,
}: {
  outputType: AdaptationOutputType;
  existingOutputs?: ChapterAdaptationResult[];
  packageSelection?: NewsletterIssuePackageSelectionValues | null;
  workflowLabel?: string;
  currentStepLabel?: string;
  immediateSourceLabel?: string;
}): string {
  const preset = getAdaptationPreset(outputType);
  const stateSources = preset.stateSources
    .map((source) => `- ${formatAdaptationWorkflowStateSource(source)}`)
    .join("\n");
  const workflowStateLines = ["WORKFLOW STATE:"];

  if (workflowLabel) {
    workflowStateLines.push(`ACTIVE WORKFLOW: ${workflowLabel}`);
  }

  if (currentStepLabel) {
    workflowStateLines.push(`CURRENT STEP: ${currentStepLabel}`);
  }

  if (immediateSourceLabel) {
    workflowStateLines.push(`IMMEDIATE SOURCE: ${immediateSourceLabel}`);
  }

  workflowStateLines.push(`THIS OUTPUT SHOULD READ FROM:\n${stateSources}`);
  workflowStateLines.push("");
  workflowStateLines.push("ALIGNMENT RULES:");
  workflowStateLines.push("- Build on any saved workflow state instead of resetting from zero.");
  workflowStateLines.push("- Keep the new output aligned with project memory and planning context.");

  if (immediateSourceLabel) {
    workflowStateLines.push(
      "- Treat the immediate source as a bridge artifact, not permission to contradict original draft truth."
    );
    workflowStateLines.push(
      "- If the bridge artifact conflicts with the original draft truth, story context, or planning context, preserve the original facts instead of following the bridge artifact."
    );
  }

  const blocks: string[] = [workflowStateLines.join("\n")];

  const relevantSavedOutputs =
    preset.supportingOutputTypes
      ?.map((supportingOutputType) =>
        existingOutputs?.find(
          (output) =>
            output.outputType === supportingOutputType && output.content.trim().length > 0
        )
      )
      .filter((output): output is ChapterAdaptationResult => Boolean(output)) ?? [];

  if (relevantSavedOutputs.length > 0) {
    blocks.push(`RELEVANT SAVED OUTPUTS:
${relevantSavedOutputs
  .map(
    (output) =>
      `${getAdaptationPreset(output.outputType).label.toUpperCase()}:
${truncateAdaptationText(output.content, 900)}`
  )
  .join("\n\n")}`);
  }

  if (preset.usesOfficialPackageState) {
    const officialPackageLines = buildOfficialPackageStateLines(packageSelection);

    blocks.push(
      officialPackageLines.length > 0
        ? `OFFICIAL PACKAGE STATE:
${officialPackageLines.map((line) => `- ${line}`).join("\n")}

- Do not contradict official package choices that are already selected.`
        : `OFFICIAL PACKAGE STATE:
- No official package choices are selected yet. If you create strong options here, they may become the canonical package later.`
    );
  }

  return `${blocks.join("\n\n")}\n\n`;
}

function buildOfficialPackageStateLines(
  packageSelection?: NewsletterIssuePackageSelectionValues | null
): string[] {
  if (!packageSelection) {
    return [];
  }

  return [
    packageSelection.subjectLine.trim()
      ? `Subject line: ${packageSelection.subjectLine.trim()}`
      : null,
    packageSelection.deck.trim() ? `Deck: ${packageSelection.deck.trim()}` : null,
    packageSelection.hook.trim() ? `Hook: ${packageSelection.hook.trim()}` : null,
    packageSelection.cta.trim() ? `CTA: ${packageSelection.cta.trim()}` : null,
    packageSelection.sectionPackage.trim()
      ? `Recurring section package: ${truncateAdaptationText(
          packageSelection.sectionPackage,
          900
        )}`
      : null,
  ].filter((line): line is string => Boolean(line));
}

function truncateChapterContent(content: string): string {
  return truncateAdaptationText(content, 14000);
}

function truncateAdaptationText(content: string, limit: number): string {
  const normalized = content.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit)}\n\n[Source text truncated for adaptation prompt.]`;
}

function getNewsletterModeConfig({
  projectMode,
  modeConfig,
}: {
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}) {
  if (projectMode !== "newsletter" || !modeConfig) {
    return null;
  }

  return parseNewsletterModeConfig(modeConfig);
}

function getScreenplayModeConfig({
  projectMode,
  modeConfig,
}: {
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}) {
  if (projectMode !== "screenplay" || !modeConfig) {
    return null;
  }

  return parseScreenplayModeConfig(modeConfig);
}

function getComicsModeConfig({
  projectMode,
  modeConfig,
}: {
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}) {
  if (projectMode !== "comics" || !modeConfig) {
    return null;
  }

  return parseComicsModeConfig(modeConfig);
}

function getGameWritingModeConfig({
  projectMode,
  modeConfig,
}: {
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}) {
  if (projectMode !== "game_writing" || !modeConfig) {
    return null;
  }

  return parseGameWritingModeConfig(modeConfig);
}

function getNonFictionModeConfig({
  projectMode,
  modeConfig,
}: {
  projectMode: ProjectMode;
  modeConfig?: StoryModeConfig;
}) {
  if (projectMode !== "non_fiction" || !modeConfig) {
    return null;
  }

  return parseNonFictionModeConfig(modeConfig);
}

function getProjectUnitLabel(
  mode: ProjectMode,
  options: {
    capitalize?: boolean;
  } = {}
): string {
  const { capitalize = false } = options;

  if (mode === "non_fiction") {
    return capitalize ? "Section" : "section";
  }

  if (mode === "game_writing") {
    return capitalize ? "Quest" : "quest";
  }

  if (mode === "comics") {
    return capitalize ? "Page" : "page";
  }

  if (mode === "screenplay") {
    return capitalize ? "Scene" : "scene";
  }

  if (mode === "newsletter") {
    return capitalize ? "Issue" : "issue";
  }

  return capitalize ? "Chapter" : "chapter";
}

function parseNewsletterModeConfig(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<{
    topic: string;
    audience: string;
    issueAngle: string;
    cadence: "weekly" | "biweekly" | "monthly" | "irregular";
    subtitle?: string;
    hookApproach?: string;
    ctaStyle?: string;
    recurringSections?: string[];
  }>;

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
    cadence: candidate.cadence,
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

function parseScreenplayModeConfig(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<{
    draftingPreference: "script_pages" | "beat_draft";
    formatStyle: "fountain";
    storyEngine?: "feature" | "pilot" | "short";
  }>;

  if (
    (candidate.draftingPreference !== "script_pages"
      && candidate.draftingPreference !== "beat_draft")
    || candidate.formatStyle !== "fountain"
  ) {
    return null;
  }

  return {
    draftingPreference: candidate.draftingPreference,
    formatStyle: "fountain" as const,
    storyEngine:
      candidate.storyEngine === "feature"
      || candidate.storyEngine === "pilot"
      || candidate.storyEngine === "short"
        ? candidate.storyEngine
        : undefined,
  };
}

function parseComicsModeConfig(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<{
    draftingPreference: "comic_script_pages";
    formatStyle: "comic_script";
    seriesEngine?: "issue" | "one_shot" | "graphic_novel";
  }>;

  if (
    candidate.draftingPreference !== "comic_script_pages"
    || candidate.formatStyle !== "comic_script"
  ) {
    return null;
  }

  return {
    draftingPreference: "comic_script_pages" as const,
    formatStyle: "comic_script" as const,
    seriesEngine:
      candidate.seriesEngine === "issue"
      || candidate.seriesEngine === "one_shot"
      || candidate.seriesEngine === "graphic_novel"
        ? candidate.seriesEngine
        : undefined,
  };
}

function parseGameWritingModeConfig(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<{
    draftingPreference: "hybrid_quest_brief";
    formatStyle: "quest_brief";
    questEngine?: "main_quest" | "side_quest" | "questline";
  }>;

  if (
    candidate.draftingPreference !== "hybrid_quest_brief"
    || candidate.formatStyle !== "quest_brief"
  ) {
    return null;
  }

  return {
    draftingPreference: "hybrid_quest_brief" as const,
    formatStyle: "quest_brief" as const,
    questEngine:
      candidate.questEngine === "main_quest"
      || candidate.questEngine === "side_quest"
      || candidate.questEngine === "questline"
        ? candidate.questEngine
        : undefined,
  };
}

function parseNonFictionModeConfig(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const candidate = input as Partial<{
    draftingPreference: "hybrid_section_draft";
    formatStyle: "article_draft";
    pieceEngine?: "article" | "essay";
  }>;

  if (
    candidate.draftingPreference !== "hybrid_section_draft"
    || candidate.formatStyle !== "article_draft"
  ) {
    return null;
  }

  return {
    draftingPreference: "hybrid_section_draft" as const,
    formatStyle: "article_draft" as const,
    pieceEngine:
      candidate.pieceEngine === "article" || candidate.pieceEngine === "essay"
        ? candidate.pieceEngine
        : undefined,
  };
}
