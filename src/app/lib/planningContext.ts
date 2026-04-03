import type { SupabaseClient } from "@supabase/supabase-js";
import { getProjectUnitLabel } from "./projectMode";
import {
  hasArcContent,
  hasThreadContent,
  normalizeNotesContent,
} from "./planning";
import type {
  BibleNotesContent,
  BibleOutlineContent,
} from "../types/bible";
import type { ProjectMode } from "../types/story";

export async function resolvePlanningPromptContext(
  supabase: SupabaseClient,
  storyId: string,
  unitNumber: number,
  projectMode: ProjectMode
): Promise<string> {
  const { data, error } = await supabase
    .from("story_bibles")
    .select("section_type, content")
    .eq("story_id", storyId)
    .in("section_type", ["outline", "notes"]);

  if (error) {
    console.error("Failed to resolve planning prompt context:", error);
    return "";
  }

  const outline = (data ?? []).find(
    (section) => section.section_type === "outline"
  )?.content as BibleOutlineContent | undefined;
  const notes = (data ?? []).find(
    (section) => section.section_type === "notes"
  )?.content as BibleNotesContent | undefined;

  return buildPlanningPromptContext({
    outline,
    notes,
    unitNumber,
    projectMode,
  });
}

export function buildPlanningPromptContext({
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
  const sections: string[] = [
    "=== PLANNING GUIDANCE ===",
    "Treat this as project guidance, not rigid law. Follow it when specific, but do not contradict established project truth or the actual source draft.",
  ];
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const targetUnit = outline?.chapters.find((chapter) => chapter.number === unitNumber) ?? null;
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
          ? `- Expected reveal or turn: ${targetUnit.keyReveal.trim()}`
          : "",
        targetUnit.openLoops && targetUnit.openLoops.length > 0
          ? `- Threads meant to stay open after this ${unitLabelCapitalized.toLowerCase()}: ${targetUnit.openLoops.join("; ")}`
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
        "ACTIVE ARCS TO HONOR:",
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
        `THREADS DUE BY ${unitLabelCapitalized.toUpperCase()} ${unitNumber}:`,
        ...dueThreads.slice(0, 5).map((thread) =>
          formatThread(thread, unitLabelCapitalized)
        ),
      ].join("\n")
    );
  }

  if (openThreads.length > 0) {
    sections.push(
      [
        "OTHER OPEN THREADS TO KEEP CONSISTENT:",
        ...openThreads.slice(0, 4).map((thread) =>
          formatThread(thread, unitLabelCapitalized)
        ),
      ].join("\n")
    );
  }

  if (normalizedNotes.text.trim()) {
    sections.push(`PLANNING NOTES:\n${normalizedNotes.text.trim()}`);
  }

  return sections.length > 2 ? sections.join("\n\n") : "";
}

function formatThread(
  thread: Required<BibleNotesContent>["threads"][number],
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
