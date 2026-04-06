// src/app/lib/modes/newsletter.ts
import type { ModeConfig } from "./types";

function buildNewsletterMemoryPrompt(
  content: string,
  existingEntries: { name: string; entryType: string }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context?: { fandom?: string }
): string {
  const existingNames = existingEntries.map((e) => e.name).join(", ");

  // NOTE: Prompt uses "type" (not "entryType") to match parseGeneratedEntries() parser.
  return `You are a publication analyst. Read the following newsletter issue and extract structured project memory entries.

${existingNames ? `Already known entries: ${existingNames}\nOnly create entries for NEW topics, sources, audience segments, etc. not already listed.\n` : ""}
For each entry, output JSON with: name, type (one of: topic, source, audience, theme, format), description, and optionally aliases and customFields.

Issue text:
${content}`;
}

export function buildNewsletterSuggestionPrompt(
  content: string,
  existingEntries: { name: string; entryType: string; description?: string }[],
  contentUnitNumber: number,
  planningContext = ""
): string {
  const entrySummary = existingEntries
    .map((e) => `- ${e.name} (${e.entryType})${e.description ? ": " + e.description.slice(0, 100) : ""}`)
    .join("\n");

  return `You are a publication analyst reviewing issue ${contentUnitNumber}. Based on this issue, suggest updates to the project memory.

Current memory entries:
${entrySummary || "(none)"}

${planningContext ? `${planningContext}\n\n` : ""}Use the planning guidance as context for what this issue was trying to establish or advance.
Only suggest memory updates for topics, sources, relationships, aliases, or state changes that are actually established in the issue text.
Do not suggest a memory change solely because it was planned, implied by the issue outline, or still due but absent from the draft.

Suggest: new entries to create (topics, sources, audience segments), alias updates, new relationships between entries, and stale entries to flag.

Issue text:
${content}`;
}

export const newsletterMode: ModeConfig = {
  id: "newsletter",
  label: "Newsletter",
  memoryLabel: "Memory",
  coreTypes: ["topic", "source", "audience", "theme", "format"],
  typeLabels: {
    topic: "Topic",
    source: "Source",
    audience: "Audience Segment",
    theme: "Recurring Theme",
    format: "Format Element",
  },
  typeIcons: {
    topic: "Hash",
    source: "Link",
    audience: "Users",
    theme: "Repeat",
    format: "Layout",
  },
  fieldSuggestions: {
    topic: ["description", "related topics", "last covered"],
    source: ["description", "url", "credibility", "contact"],
    audience: ["description", "interests", "pain points"],
    theme: ["description", "frequency", "examples"],
    format: ["description", "placement", "tone"],
  },
  contentUnitSingular: "issue",
  contentUnitPlural: "issues",
  buildMemoryGenerationPrompt: buildNewsletterMemoryPrompt,
  buildSuggestionPrompt: buildNewsletterSuggestionPrompt,
  buildContextPreamble: (title) => `Project memory for "${title}":`,
  supportsAutoGeneration: false,
  supportsSuggestions: true,
};
