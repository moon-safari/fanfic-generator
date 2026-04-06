import { buildNonFictionPlanningPrompt } from "./planning.ts";
import type { ModeConfig, PlanningSchema } from "./types.ts";

function buildNonFictionMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[]
): string {
  const existingNames = existingEntries.map((entry) => entry.name).join(", ");

  return `You are a non-fiction research assistant. Read the following section draft and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW sources, claims, topics, arguments, evidence, counterpoints, or quotes.\n` : ""}For each entry, output JSON with: name, type (one of: source, claim, topic, argument, evidence, counterpoint, quote), description, and optionally aliases and customFields.

Section draft:
${content}`;
}

function buildNonFictionSuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  contentUnitNumber: number,
  planningContext = ""
): string {
  const entrySummary = existingEntries
    .map(
      (entry) =>
        `- ${entry.name} (${entry.entryType})${entry.description ? `: ${entry.description.slice(0, 100)}` : ""}`
    )
    .join("\n");

  return `You are reviewing Section ${contentUnitNumber} of a non-fiction project. Suggest updates to structured memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use planning as context for section intent, evidence obligations, and open proof gaps.
Only suggest memory updates for sources, claims, topics, arguments, evidence, counterpoints, or quotes actually established in the section draft.
Do not suggest a memory change solely because it was planned.

Section draft:
${content}`;
}

const nonFictionPlanningSchema: PlanningSchema = {
  synopsis: {
    title: "Project Synopsis",
    description:
      "The working thesis and high-level promise of the non-fiction project.",
    emptyLabel: "Add a short project synopsis...",
  },
  styleGuide: {
    title: "Style Guide",
    description: "Voice, framing, and evidence guardrails for the piece.",
    emptyLabel: "Define voice, framing, and evidence guardrails...",
  },
  outline: {
    title: "Outline",
    description: "Section-by-section argument structure and status map.",
    emptyLabel: "Add planned section beats...",
    openLoopsLabel: "Open proof gaps",
  },
  notes: {
    title: "Editorial Notes",
    description:
      "Proof gaps, source follow-ups, counterpoints, and framing guidance.",
    emptyLabel: "Capture unresolved evidence gaps and editorial notes...",
    arcsHeading: "Argument pressure",
    threadsHeading: "Open proof gaps",
  },
};

export const nonFictionMode: ModeConfig = {
  id: "non_fiction",
  label: "Non-Fiction",
  memoryLabel: "Sources & Claims",
  coreTypes: [
    "source",
    "claim",
    "topic",
    "argument",
    "evidence",
    "counterpoint",
    "quote",
  ],
  typeLabels: {
    source: "Source",
    claim: "Claim",
    topic: "Topic",
    argument: "Argument",
    evidence: "Evidence",
    counterpoint: "Counterpoint",
    quote: "Quote",
  },
  typeIcons: {
    source: "BookOpen",
    claim: "ScrollText",
    topic: "Hash",
    argument: "Scale",
    evidence: "FileCheck",
    counterpoint: "AlertTriangle",
    quote: "Quote",
  },
  fieldSuggestions: {
    source: [
      "author",
      "publication",
      "published_at",
      "source_type",
      "credibility_notes",
      "relevance",
    ],
    claim: ["section_role", "support_status", "linked_sources", "caveat"],
    topic: ["scope", "framing", "audience_relevance", "related_claims"],
    argument: ["thesis_role", "section_span", "intended_effect", "dependencies"],
    evidence: [
      "evidence_type",
      "supports_claim",
      "source_link",
      "confidence",
      "notes",
    ],
    counterpoint: ["target_claim", "response_strategy", "severity"],
    quote: ["speaker", "source", "usage_context", "attribution"],
  },
  contentUnitSingular: "section",
  contentUnitPlural: "sections",
  buildMemoryGenerationPrompt: buildNonFictionMemoryPrompt,
  buildSuggestionPrompt: buildNonFictionSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for non-fiction piece "${title}":`,
  planningUnitLabel: "section beat",
  planningSchema: nonFictionPlanningSchema,
  buildPlanningPrompt: buildNonFictionPlanningPrompt,
  supportsAutoGeneration: true,
  supportsSuggestions: true,
};
