import { hasArcContent, hasThreadContent, normalizeNotesContent } from "../planning.ts";
import { getProjectUnitLabel } from "../projectMode.ts";
import type { BiblePlanningThread } from "../../types/bible.ts";
import type { ModePlanningPromptArgs } from "./types.ts";

interface PlanningPromptCopy {
  activeHeading: string;
  dueHeadingPrefix: string;
  openHeading: string;
  notesHeading: string;
  keyRevealLabel: string;
  openLoopsLabel: (unitLabelLowercase: string) => string;
}

const SHARED_PLANNING_DISCLAIMER =
  "Treat this as project guidance, not rigid law. Follow it when specific, but do not contradict established project truth or the actual source draft.";

export function buildFictionPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "ACTIVE ARCS TO HONOR:",
    dueHeadingPrefix: "THREADS DUE BY",
    openHeading: "OTHER OPEN THREADS TO KEEP CONSISTENT:",
    notesHeading: "PLANNING NOTES",
    keyRevealLabel: "Expected reveal or turn",
    openLoopsLabel: (unitLabelLowercase) =>
      `Threads meant to stay open after this ${unitLabelLowercase}`,
  });
}

export function buildNewsletterPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "EDITORIAL THROUGHLINES TO HONOR:",
    dueHeadingPrefix: "OPEN PROMISES DUE BY",
    openHeading: "OTHER OPEN PROMISES TO KEEP CONSISTENT:",
    notesHeading: "EDITORIAL NOTES",
    keyRevealLabel: "Expected reveal, turn, or audience promise",
    openLoopsLabel: (unitLabelLowercase) =>
      `Promises meant to stay open after this ${unitLabelLowercase}`,
  });
}

export function buildScreenplayPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "CHARACTER AND ACT PRESSURE TO HONOR:",
    dueHeadingPrefix: "SETUP-PAYOFF THREADS DUE BY",
    openHeading: "OTHER OPEN SETUP-PAYOFF THREADS:",
    notesHeading: "STORY NOTES",
    keyRevealLabel: "Expected turn or reveal",
    openLoopsLabel: (unitLabelLowercase) =>
      `Threads meant to stay open after this ${unitLabelLowercase}`,
  });
}

export function buildComicsPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "VISUAL AND STORY PRESSURE TO HONOR:",
    dueHeadingPrefix: "REVEALS DUE BY",
    openHeading: "OTHER OPEN PAGE-TURN OBLIGATIONS:",
    notesHeading: "VISUAL NOTES",
    keyRevealLabel: "Expected page-turn or reveal",
    openLoopsLabel: (unitLabelLowercase) =>
      `Reveals meant to stay open after this ${unitLabelLowercase}`,
  });
}

export function buildGameWritingPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "QUEST PRESSURE TO HONOR:",
    dueHeadingPrefix: "OUTCOMES DUE BY",
    openHeading: "OTHER OPEN QUEST DEPENDENCIES:",
    notesHeading: "DESIGN NOTES",
    keyRevealLabel: "Expected branch turn or consequence",
    openLoopsLabel: (unitLabelLowercase) =>
      `Consequences meant to stay open after this ${unitLabelLowercase}`,
  });
}

export function buildNonFictionPlanningPrompt(
  args: ModePlanningPromptArgs
): string {
  return buildStructuredPlanningPrompt(args, {
    activeHeading: "ARGUMENT PRESSURE TO HONOR:",
    dueHeadingPrefix: "EVIDENCE DUE BY",
    openHeading: "OTHER OPEN PROOF GAPS:",
    notesHeading: "EDITORIAL NOTES",
    keyRevealLabel: "Expected claim, turn, or section move",
    openLoopsLabel: (unitLabelLowercase) =>
      `Claims or proof questions meant to stay open after this ${unitLabelLowercase}`,
  });
}

function buildStructuredPlanningPrompt(
  { outline, notes, unitNumber, projectMode }: ModePlanningPromptArgs,
  copy: PlanningPromptCopy
) {
  const sections: string[] = [
    "=== PLANNING GUIDANCE ===",
    SHARED_PLANNING_DISCLAIMER,
  ];
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const targetUnit = outline?.chapters.find((chapter) => chapter.number === unitNumber)
    ?? null;
  const normalizedNotes = normalizeNotesContent(notes);
  const activeArcs = normalizedNotes.arcs.filter(hasArcContent).filter(
    (arc) => arc.status !== "landed"
  );
  const dueThreads = normalizedNotes.threads
    .filter(hasThreadContent)
    .filter(
      (thread) =>
        thread.status !== "resolved"
        && typeof thread.targetUnit === "number"
        && thread.targetUnit <= unitNumber
    );
  const openThreads = normalizedNotes.threads
    .filter(hasThreadContent)
    .filter((thread) => thread.status !== "resolved")
    .filter((thread) => !dueThreads.some((dueThread) => dueThread.id === thread.id));

  if (targetUnit) {
    sections.push(
      [
        `TARGET ${unitLabelCapitalized.toUpperCase()} PLAN:`,
        `- Title: ${targetUnit.title.trim() || "Untitled"}`,
        targetUnit.summary.trim() ? `- Summary: ${targetUnit.summary.trim()}` : "",
        targetUnit.intent?.trim() ? `- Intent: ${targetUnit.intent.trim()}` : "",
        targetUnit.keyReveal?.trim()
          ? `- ${copy.keyRevealLabel}: ${targetUnit.keyReveal.trim()}`
          : "",
        targetUnit.openLoops && targetUnit.openLoops.length > 0
          ? `- ${copy.openLoopsLabel(unitLabelCapitalized.toLowerCase())}: ${targetUnit.openLoops.join("; ")}`
          : "",
        `- Status: ${capitalize(targetUnit.status)}`,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  if (activeArcs.length > 0) {
    sections.push(
      [
        copy.activeHeading,
        ...activeArcs.slice(0, 4).map((arc) => {
          const lines = [
            `- ${arc.title.trim() || "Untitled arc"} [${capitalize(arc.status)}]`,
          ];

          if (arc.intent.trim()) {
            lines.push(`  Intent: ${arc.intent.trim()}`);
          }

          if (arc.horizon?.trim()) {
            lines.push(`  Horizon: ${arc.horizon.trim()}`);
          }

          return lines.join("\n");
        }),
      ].join("\n")
    );
  }

  if (dueThreads.length > 0) {
    sections.push(
      [
        `${copy.dueHeadingPrefix} ${unitLabelCapitalized.toUpperCase()} ${unitNumber}:`,
        ...dueThreads.slice(0, 5).map((thread) =>
          formatThread(thread, unitLabelCapitalized)
        ),
      ].join("\n")
    );
  }

  if (openThreads.length > 0) {
    sections.push(
      [
        copy.openHeading,
        ...openThreads.slice(0, 4).map((thread) =>
          formatThread(thread, unitLabelCapitalized)
        ),
      ].join("\n")
    );
  }

  if (normalizedNotes.text.trim()) {
    sections.push(`${copy.notesHeading}:\n${normalizedNotes.text.trim()}`);
  }

  return sections.length > 2 ? sections.join("\n\n") : "";
}

function formatThread(
  thread: BiblePlanningThread,
  unitLabelCapitalized: string
) {
  const lines = [
    `- ${thread.title.trim() || "Untitled thread"} [${capitalize(thread.status)}]`,
  ];

  if (thread.owner?.trim()) {
    lines.push(`  Owner: ${thread.owner.trim()}`);
  }

  if (thread.targetUnit) {
    lines.push(`  Target payoff: ${unitLabelCapitalized} ${thread.targetUnit}`);
  }

  if (thread.notes?.trim()) {
    lines.push(`  Notes: ${thread.notes.trim()}`);
  }

  return lines.join("\n");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
