import { hasArcContent, hasThreadContent, normalizeNotesContent } from "./planning";
import { formatNewsletterCadence, getProjectUnitLabel } from "./projectMode";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleStyleGuideContent,
  BibleSynopsisContent,
} from "../types/bible";
import type { NewsletterModeConfig } from "../types/story";

export interface NewsletterMemorySnapshot {
  title: string;
  subtitle: string;
  topic: string;
  audience: string;
  cadence: string;
  currentAngle: string;
  seriesPromise: string;
  hookApproach: string;
  ctaStyle: string;
  recurringSections: string[];
  voiceGuides: string[];
  currentUnitPlan: string[];
  activeArcs: string[];
  dueThreads: string[];
  editorialNotes: string[];
}

export function buildNewsletterMemorySnapshot({
  storyTitle,
  modeConfig,
  synopsis,
  styleGuide,
  outline,
  notes,
  currentUnitNumber,
}: {
  storyTitle: string;
  modeConfig: NewsletterModeConfig | null;
  synopsis?: BibleSynopsisContent | null;
  styleGuide?: BibleStyleGuideContent | null;
  outline?: BibleOutlineContent | null;
  notes?: BibleNotesContent | null;
  currentUnitNumber?: number;
}): NewsletterMemorySnapshot {
  const normalizedNotes = normalizeNotesContent(notes ?? null);
  const unitLabelCapitalized = getProjectUnitLabel("newsletter", {
    capitalize: true,
  });
  const currentUnitPlan = currentUnitNumber
    ? outline?.chapters.find((chapter) => chapter.number === currentUnitNumber) ?? null
    : null;
  const seriesPromise = synopsis?.text?.trim() || modeConfig?.issueAngle?.trim() || "";
  const voiceGuides = [
    styleGuide?.proseStyle?.trim()
      ? `Prose: ${styleGuide.proseStyle.trim()}`
      : "",
    styleGuide?.dialogueStyle?.trim()
      ? `References and quotes: ${styleGuide.dialogueStyle.trim()}`
      : "",
    styleGuide?.pacing?.trim()
      ? `Pacing: ${styleGuide.pacing.trim()}`
      : "",
    styleGuide?.pov?.trim() ? `Perspective: ${styleGuide.pov.trim()}` : "",
    styleGuide?.tense?.trim() ? `Tense: ${styleGuide.tense.trim()}` : "",
  ].filter(Boolean);
  const activeArcs = normalizedNotes.arcs
    .filter(hasArcContent)
    .filter((arc) => arc.status !== "landed")
    .slice(0, 4)
    .map((arc) => {
      const parts = [`${arc.title.trim() || "Untitled arc"} (${capitalize(arc.status)})`];

      if (arc.intent.trim()) {
        parts.push(arc.intent.trim());
      }

      if (arc.horizon?.trim()) {
        parts.push(`Horizon: ${arc.horizon.trim()}`);
      }

      return parts.join(" | ");
    });
  const dueThreads = normalizedNotes.threads
    .filter(hasThreadContent)
    .filter((thread) => thread.status !== "resolved")
    .filter((thread) =>
      typeof currentUnitNumber === "number"
        ? typeof thread.targetUnit === "number" && thread.targetUnit <= currentUnitNumber
        : true
    )
    .sort((left, right) => (left.targetUnit ?? Number.MAX_SAFE_INTEGER) - (right.targetUnit ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 4)
    .map((thread) => {
      const parts = [
        `${thread.title.trim() || "Untitled thread"} (${capitalize(thread.status)})`,
      ];

      if (typeof thread.targetUnit === "number") {
        parts.push(`Due by ${unitLabelCapitalized} ${thread.targetUnit}`);
      }

      if (thread.owner?.trim()) {
        parts.push(`Owner: ${thread.owner.trim()}`);
      }

      return parts.join(" | ");
    });
  const editorialNotes = normalizedNotes.text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  return {
    title: storyTitle.trim(),
    subtitle: modeConfig?.subtitle?.trim() || "",
    topic: modeConfig?.topic?.trim() || "",
    audience: modeConfig?.audience?.trim() || "",
    cadence: modeConfig ? formatNewsletterCadence(modeConfig.cadence) : "",
    currentAngle: modeConfig?.issueAngle?.trim() || "",
    seriesPromise,
    hookApproach: modeConfig?.hookApproach?.trim() || "",
    ctaStyle: modeConfig?.ctaStyle?.trim() || "",
    recurringSections:
      modeConfig?.recurringSections?.map((section) => section.trim()).filter(Boolean) ?? [],
    voiceGuides,
    currentUnitPlan: currentUnitPlan
      ? [
          currentUnitPlan.summary.trim(),
          currentUnitPlan.intent?.trim() || "",
          currentUnitPlan.keyReveal?.trim() || "",
          ...(currentUnitPlan.openLoops ?? [])
            .map((loop) => loop.trim())
            .filter(Boolean)
            .slice(0, 3),
        ].filter(Boolean)
      : [],
    activeArcs,
    dueThreads,
    editorialNotes,
  };
}

export function formatNewsletterMemoryForPrompt(
  snapshot: NewsletterMemorySnapshot,
  options: {
    currentUnitNumber?: number;
  } = {}
) {
  const sections = [
    "=== NEWSLETTER MEMORY ===",
    snapshot.title ? `SERIES: ${snapshot.title}` : "",
    snapshot.subtitle ? `SUBTITLE: ${snapshot.subtitle}` : "",
    snapshot.topic ? `TOPIC: ${snapshot.topic}` : "",
    snapshot.audience ? `AUDIENCE: ${snapshot.audience}` : "",
    snapshot.cadence ? `CADENCE: ${snapshot.cadence}` : "",
    snapshot.currentAngle ? `CURRENT ANGLE: ${snapshot.currentAngle}` : "",
    snapshot.seriesPromise ? `SERIES PROMISE:\n${snapshot.seriesPromise}` : "",
    snapshot.hookApproach ? `HOOK APPROACH:\n${snapshot.hookApproach}` : "",
    snapshot.ctaStyle ? `CTA STYLE:\n${snapshot.ctaStyle}` : "",
    snapshot.recurringSections.length > 0
      ? `RECURRING SECTIONS:\n${snapshot.recurringSections
          .map((section) => `- ${section}`)
          .join("\n")}`
      : "",
    snapshot.voiceGuides.length > 0
      ? `VOICE GUARDRAILS:\n${snapshot.voiceGuides.map((guide) => `- ${guide}`).join("\n")}`
      : "",
    snapshot.currentUnitPlan.length > 0
      ? `CURRENT ${getProjectUnitLabel("newsletter", {
          capitalize: true,
        }).toUpperCase()} ${options.currentUnitNumber ?? ""} PLAN:\n${snapshot.currentUnitPlan
          .map((line) => `- ${line}`)
          .join("\n")}`
      : "",
    snapshot.activeArcs.length > 0
      ? `ACTIVE THROUGHLINES:\n${snapshot.activeArcs.map((arc) => `- ${arc}`).join("\n")}`
      : "",
    snapshot.dueThreads.length > 0
      ? `FOLLOW-UPS DUE NOW:\n${snapshot.dueThreads
          .map((thread) => `- ${thread}`)
          .join("\n")}`
      : "",
    snapshot.editorialNotes.length > 0
      ? `EDITORIAL NOTES:\n${snapshot.editorialNotes
          .map((note) => `- ${note}`)
          .join("\n")}`
      : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
