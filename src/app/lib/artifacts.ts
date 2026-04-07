import {
  getAdaptationDerivedMode,
  getAdaptationPreset,
} from "./adaptations.ts";
import { getModeConfig } from "./modes/registry.ts";
import { hasArcContent, hasThreadContent, normalizeNotesContent } from "./planning.ts";
import { getProjectUnitLabel } from "./projectMode.ts";
import type { ChapterAdaptationResult } from "../types/adaptation";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleSection,
  BibleStyleGuideContent,
  BibleSynopsisContent,
} from "../types/bible.ts";
import type {
  AdaptationArtifact,
  PlanningArtifact,
  PlanningArtifactContent,
  PlanningArtifactSubtype,
  ProjectArtifact,
} from "../types/artifact.ts";
import type { ProjectMode } from "../types/story.ts";

export function getPlanningArtifactConfig(projectMode: ProjectMode): Record<
  PlanningArtifactSubtype,
  {
    title: string;
    description: string;
    emptyLabel: string;
    openLoopsLabel?: string;
    arcsHeading?: string;
    threadsHeading?: string;
  }
> {
  const { planningSchema } = getModeConfig(projectMode);

  return {
    synopsis: planningSchema.synopsis,
    style_guide: planningSchema.styleGuide,
    outline: planningSchema.outline,
    notes: planningSchema.notes,
  };
}

export const PLANNING_ARTIFACT_TYPES: PlanningArtifactSubtype[] = [
  "synopsis",
  "style_guide",
  "outline",
  "notes",
];

export function toAdaptationArtifact(
  result: ChapterAdaptationResult,
  projectMode: ProjectMode = "fiction"
): AdaptationArtifact {
  const preset = getAdaptationPreset(result.outputType);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });

  return {
    id: result.id ?? `${result.chapterId}:${result.outputType}`,
    kind: "adaptation",
    subtype: result.outputType,
    storyId: result.storyId,
    chapterId: result.chapterId,
    chapterNumber: result.chapterNumber,
    title: `${unitLabelCapitalized} ${result.chapterNumber} ${preset.label}`,
    description: preset.description,
    content: result.content,
    contextSource: result.contextSource,
    createdAt: result.generatedAt,
    updatedAt: result.updatedAt,
    persisted: result.persisted,
    derivedMode: getAdaptationDerivedMode(result.outputType),
    chainId: result.chainId ?? null,
    chainStepIndex: result.chainStepIndex ?? null,
    sourceOutputId: result.sourceOutputId ?? null,
    sourceOutputType: result.sourceOutputType ?? null,
  };
}

export function toPlanningArtifact(
  storyId: string,
  section:
    | Pick<BibleSection, "id" | "sectionType" | "content" | "createdAt" | "updatedAt">
    | null,
  sectionType: PlanningArtifactSubtype,
  projectMode: ProjectMode = "fiction"
): PlanningArtifact {
  const configMap = getPlanningArtifactConfig(projectMode);
  const config = configMap[sectionType];
  const rawContent =
    (section?.content as PlanningArtifactContent | undefined)
    ?? getEmptyPlanningArtifactContent(sectionType);

  return {
    id: section?.id ?? `planning:${storyId}:${sectionType}`,
    kind: "planning",
    subtype: sectionType,
    sectionType,
    storyId,
    title: config.title,
    description: config.description,
    content: formatPlanningArtifactContent(
      sectionType,
      rawContent,
      config.emptyLabel,
      projectMode
    ),
    rawContent,
    contextSource: "story_bible",
    createdAt: section?.createdAt ?? "",
    updatedAt: section?.updatedAt ?? "",
    persisted: Boolean(section?.id),
  };
}

export function getArtifactSubtypeLabel(
  subtype: ProjectArtifact["subtype"],
  projectMode: ProjectMode = "fiction"
) {
  if (isPlanningArtifactSubtype(subtype)) {
    return getPlanningArtifactConfig(projectMode)[subtype].title;
  }

  return getAdaptationPreset(subtype).label;
}

export function getArtifactKindLabel(kind: ProjectArtifact["kind"]) {
  return kind === "planning" ? "Planning" : "Adaptation";
}

export function getEmptyPlanningArtifactContent(
  subtype: PlanningArtifactSubtype
): PlanningArtifactContent {
  switch (subtype) {
    case "synopsis":
      return { text: "" };
    case "style_guide":
      return {
        pov: "",
        tense: "",
        proseStyle: "",
        dialogueStyle: "",
        pacing: "",
      };
    case "outline":
      return { chapters: [] };
    case "notes":
      return { text: "", arcs: [], threads: [] };
  }
}

export function formatPlanningArtifactContent(
  subtype: PlanningArtifactSubtype,
  content: PlanningArtifactContent,
  emptyLabel?: string,
  projectMode: ProjectMode = "fiction"
) {
  const planningConfig = getPlanningArtifactConfig(projectMode);

  switch (subtype) {
    case "synopsis": {
      const value = (content as BibleSynopsisContent).text.trim();
      return value || emptyLabel || "";
    }
    case "style_guide": {
      const styleGuide = content as BibleStyleGuideContent;
      const lines = [
        ["POV", styleGuide.pov],
        ["Tense", styleGuide.tense],
        ["Prose Style", styleGuide.proseStyle],
        ["Dialogue Style", styleGuide.dialogueStyle],
        ["Pacing", styleGuide.pacing],
      ]
        .filter(([, value]) => value.trim())
        .map(([label, value]) => `${label}: ${value}`);

      return lines.length > 0 ? lines.join("\n") : emptyLabel || "";
    }
    case "outline": {
      const outline = content as BibleOutlineContent;
      const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
        capitalize: true,
      });
      const lines = outline.chapters.map((chapter) => {
        const title = chapter.title.trim() || "Untitled";
        const summary = chapter.summary.trim();
        const intent = chapter.intent?.trim() ?? "";
        const keyReveal = chapter.keyReveal?.trim() ?? "";
        const openLoops = (chapter.openLoops ?? [])
          .map((item) => item.trim())
          .filter(Boolean);
        const status = chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1);
        const sections = [
          `${unitLabelCapitalized} ${chapter.number}: ${title} (${status})`,
        ];

        if (summary) {
          sections.push(summary);
        }

        if (intent) {
          sections.push(`Intent: ${intent}`);
        }

        if (keyReveal) {
          sections.push(`Key reveal: ${keyReveal}`);
        }

        if (openLoops.length > 0) {
          sections.push(
            `${planningConfig.outline.openLoopsLabel ?? "Open threads"}: ${openLoops.join("; ")}`
          );
        }

        return sections.join("\n");
      });

      return lines.length > 0 ? lines.join("\n\n") : emptyLabel || "";
    }
    case "notes": {
      const notes = normalizeNotesContent(content as BibleNotesContent);
      const sections: string[] = [];
      const value = notes.text.trim();
      const arcs = notes.arcs.filter(hasArcContent);
      const threads = notes.threads.filter(hasThreadContent);
      const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
        capitalize: true,
      });

      if (value) {
        sections.push(value);
      }

      if (arcs.length > 0) {
        sections.push(
          [
            `${planningConfig.notes.arcsHeading ?? "Active arcs"}:`,
            ...arcs.map((arc) => {
              const details = [
                `${arc.title.trim() || "Untitled arc"} (${capitalize(arc.status)})`,
              ];

              if (arc.intent.trim()) {
                details.push(`Intent: ${arc.intent.trim()}`);
              }

              if (arc.horizon?.trim()) {
                details.push(`Horizon: ${arc.horizon.trim()}`);
              }

              if (arc.notes?.trim()) {
                details.push(`Notes: ${arc.notes.trim()}`);
              }

              return `- ${details.join(" | ")}`;
            }),
          ].join("\n")
        );
      }

      if (threads.length > 0) {
        sections.push(
          [
            `${planningConfig.notes.threadsHeading ?? "Open threads"}:`,
            ...threads.map((thread) => {
              const details = [
                `${thread.title.trim() || "Untitled thread"} (${capitalize(thread.status)})`,
              ];

              if (thread.owner?.trim()) {
                details.push(`Owner: ${thread.owner.trim()}`);
              }

              if (thread.introducedIn) {
                details.push(
                  `Introduced: ${unitLabelCapitalized} ${thread.introducedIn}`
                );
              }

              if (thread.targetUnit) {
                details.push(
                  `Target payoff: ${unitLabelCapitalized} ${thread.targetUnit}`
                );
              }

              if (thread.notes?.trim()) {
                details.push(`Notes: ${thread.notes.trim()}`);
              }

              return `- ${details.join(" | ")}`;
            }),
          ].join("\n")
        );
      }

      return sections.length > 0 ? sections.join("\n\n") : emptyLabel || "";
    }
  }
}

function isPlanningArtifactSubtype(
  subtype: ProjectArtifact["subtype"]
): subtype is PlanningArtifactSubtype {
  return PLANNING_ARTIFACT_TYPES.includes(subtype as PlanningArtifactSubtype);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
