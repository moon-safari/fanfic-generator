import { getProjectUnitLabel } from "./projectMode";
import type {
  BibleNotesContent,
  BibleOutlineContent,
  BiblePlanningArc,
  BiblePlanningThread,
} from "../types/bible";
import type { ProjectMode } from "../types/story";

export function normalizeNotesContent(
  content?: BibleNotesContent | null
): Required<BibleNotesContent> {
  return {
    text: content?.text ?? "",
    arcs: content?.arcs ?? [],
    threads: content?.threads ?? [],
  };
}

export function hasArcContent(arc: BiblePlanningArc) {
  return Boolean(
    arc.title.trim()
      || arc.intent.trim()
      || arc.horizon?.trim()
      || arc.notes?.trim()
  );
}

export function hasThreadContent(thread: BiblePlanningThread) {
  return Boolean(
    thread.title.trim()
      || thread.owner?.trim()
      || thread.introducedIn
      || thread.targetUnit
      || thread.notes?.trim()
  );
}

export function buildPlanningContinuityContext({
  outline,
  notes,
  unitNumber,
  projectMode,
}: {
  outline?: BibleOutlineContent | null;
  notes?: BibleNotesContent | null;
  unitNumber: number;
  projectMode: ProjectMode;
}) {
  const sections: string[] = [];
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const normalizedNotes = normalizeNotesContent(notes);
  const currentUnit = outline?.chapters.find((chapter) => chapter.number === unitNumber) ?? null;
  const activeArcs = normalizedNotes.arcs.filter(hasArcContent).filter(
    (arc) => arc.status !== "landed"
  );
  const trackedThreads = normalizedNotes.threads
    .filter(hasThreadContent)
    .filter((thread) => !thread.introducedIn || thread.introducedIn <= unitNumber);
  const dueThreads = trackedThreads.filter(
    (thread) => thread.status !== "resolved"
      && typeof thread.targetUnit === "number"
      && thread.targetUnit <= unitNumber
  );
  const nonDueThreads = trackedThreads.filter(
    (thread) => !dueThreads.some((dueThread) => dueThread.id === thread.id)
  );

  if (currentUnit) {
    const currentSection = [
      `CURRENT ${unitLabelCapitalized.toUpperCase()} PLAN:`,
      `- Title: ${currentUnit.title.trim() || "Untitled"}`,
      currentUnit.summary.trim()
        ? `- Summary: ${currentUnit.summary.trim()}`
        : "",
      currentUnit.intent?.trim()
        ? `- Intent: ${currentUnit.intent.trim()}`
        : "",
      currentUnit.keyReveal?.trim()
        ? `- Expected reveal or turn: ${currentUnit.keyReveal.trim()}`
        : "",
      currentUnit.openLoops && currentUnit.openLoops.length > 0
        ? `- Threads meant to stay open after this ${unitLabelCapitalized.toLowerCase()}: ${currentUnit.openLoops.join("; ")}`
        : "",
      `- Status: ${capitalize(currentUnit.status)}`,
    ]
      .filter(Boolean)
      .join("\n");
    sections.push(currentSection);
  }

  if (activeArcs.length > 0) {
    sections.push(
      [
        "ACTIVE ARCS:",
        ...activeArcs.map((arc) => {
          const lines = [
            `- ${arc.title.trim() || "Untitled arc"} [${capitalize(arc.status)}]`,
          ];

          if (arc.intent.trim()) {
            lines.push(`  Intent: ${arc.intent.trim()}`);
          }

          if (arc.horizon?.trim()) {
            lines.push(`  Horizon: ${arc.horizon.trim()}`);
          }

          if (arc.notes?.trim()) {
            lines.push(`  Notes: ${arc.notes.trim()}`);
          }

          return lines.join("\n");
        }),
      ].join("\n")
    );
  }

  if (dueThreads.length > 0) {
    sections.push(
      [
        `THREADS DUE BY ${unitLabelCapitalized.toUpperCase()} ${unitNumber}:`,
        ...dueThreads.map((thread) => formatThread(thread, unitLabelCapitalized)),
      ].join("\n")
    );
  }

  if (nonDueThreads.length > 0) {
    sections.push(
      [
        "OTHER OPEN TRACKED THREADS:",
        ...nonDueThreads.map((thread) =>
          formatThread(thread, unitLabelCapitalized)
        ),
      ].join("\n")
    );
  }

  if (normalizedNotes.text.trim()) {
    sections.push(`PLANNING NOTES:\n${normalizedNotes.text.trim()}`);
  }

  if (sections.length === 0) {
    return "";
  }

  return ["=== PLANNING LAYER ===", ...sections].join("\n\n");
}

export function markThreadResolved(
  notes: BibleNotesContent | null | undefined,
  targetLabel: string,
  unitNumber: number,
  timestampLabel: string
) {
  const normalizedNotes = normalizeNotesContent(notes);
  const targetKey = normalizeLabel(targetLabel);
  let matched = false;

  const threads = normalizedNotes.threads.map((thread) => {
    if (normalizeLabel(thread.title) !== targetKey) {
      return thread;
    }

    matched = true;
    const nextNotes = appendUniquePlanningNote(
      thread.notes,
      `Marked resolved from continuity review in unit ${unitNumber} on ${timestampLabel}.`
    );

    return {
      ...thread,
      status: "resolved" as const,
      notes: nextNotes,
    };
  });

  return matched
    ? {
        matched: true,
        content: {
          ...normalizedNotes,
          threads,
        } satisfies BibleNotesContent,
      }
    : { matched: false, content: normalizedNotes satisfies BibleNotesContent };
}

export function markArcActive(
  notes: BibleNotesContent | null | undefined,
  targetLabel: string,
  unitNumber: number,
  timestampLabel: string
) {
  const normalizedNotes = normalizeNotesContent(notes);
  const targetKey = normalizeLabel(targetLabel);
  let matched = false;

  const arcs = normalizedNotes.arcs.map((arc) => {
    if (normalizeLabel(arc.title) !== targetKey) {
      return arc;
    }

    matched = true;
    return {
      ...arc,
      status: "active" as const,
      notes: appendUniquePlanningNote(
        arc.notes,
        `Marked active from continuity review in unit ${unitNumber} on ${timestampLabel}.`
      ),
    };
  });

  return matched
    ? {
        matched: true,
        content: {
          ...normalizedNotes,
          arcs,
        } satisfies BibleNotesContent,
      }
    : { matched: false, content: normalizedNotes satisfies BibleNotesContent };
}

export function alignOutlineToDraft(
  outline: BibleOutlineContent | null | undefined,
  unitNumber: number,
  params: {
    reasonType?: "intent_miss" | "reveal_drift";
    chapterSummary?: string;
    chapterContent: string;
    targetLabel?: string;
    timestampLabel: string;
  }
) {
  const normalizedOutline: BibleOutlineContent = {
    chapters: [...(outline?.chapters ?? [])],
  };

  let index = normalizedOutline.chapters.findIndex(
    (chapter) => chapter.number === unitNumber
  );

  if (index === -1) {
    normalizedOutline.chapters.push({
      number: unitNumber,
      title: "",
      summary: "",
      intent: "",
      keyReveal: "",
      openLoops: [],
      status: "written",
    });
    normalizedOutline.chapters.sort((left, right) => left.number - right.number);
    index = normalizedOutline.chapters.findIndex(
      (chapter) => chapter.number === unitNumber
    );
  }

  const current = normalizedOutline.chapters[index];
  const distilled = distillDraftIntent(params.chapterSummary, params.chapterContent);
  const next = { ...current };

  if (params.reasonType === "reveal_drift") {
    const updatedReveal =
      params.chapterSummary?.trim()
      || params.targetLabel?.trim()
      || distilled;
    next.keyReveal = updatedReveal;
  } else {
    next.intent = params.chapterSummary?.trim() || distilled;
  }

  next.summary = appendUniquePlanningNote(
    next.summary,
    `Plan adjusted after continuity review on ${params.timestampLabel}.`
  );
  next.status = current.status === "written" ? "revised" : current.status;

  normalizedOutline.chapters[index] = next;

  return { matched: true, content: normalizedOutline };
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

  if (thread.introducedIn) {
    lines.push(`  Introduced in ${unitLabelCapitalized} ${thread.introducedIn}`);
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

function distillDraftIntent(chapterSummary: string | undefined, chapterContent: string) {
  const summary = chapterSummary?.trim();
  if (summary) {
    return summary;
  }

  const firstSentence = chapterContent
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)[0];

  if (firstSentence && firstSentence.length <= 220) {
    return firstSentence;
  }

  return chapterContent.replace(/\s+/g, " ").trim().slice(0, 220).trim();
}

function normalizeLabel(value: string) {
  return value.trim().toLowerCase();
}

function appendUniquePlanningNote(existing: string | undefined, addition: string) {
  const trimmedExisting = existing?.trim() ?? "";
  const trimmedAddition = addition.trim();

  if (!trimmedAddition) {
    return trimmedExisting;
  }

  if (trimmedExisting.includes(trimmedAddition)) {
    return trimmedExisting;
  }

  return [trimmedExisting, trimmedAddition].filter(Boolean).join(" ");
}
