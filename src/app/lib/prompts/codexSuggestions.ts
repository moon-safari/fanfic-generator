import type { Codex } from "../../types/codex";
import { formatCodexForPrompt } from "./codex";

export function buildCodexSuggestionPrompt(
  chapterContent: string,
  chapterSummary: string,
  chapterNumber: number,
  codex: Codex
): string {
  const priorChapterNumber = Math.max(chapterNumber - 1, 1);
  const codexContext =
    codex.entries.length > 0
      ? formatCodexForPrompt(codex.entries, codex.relationships, priorChapterNumber)
      : "No existing Codex truth.";

  return `You are a careful story analyst.

Your job is to detect structured Codex updates suggested by the latest chapter.

Return ONLY valid JSON with this exact shape:

{
  "createEntries": [
    {
      "name": "Entry name",
      "entryType": "character|location|lore|object|faction|event|custom",
      "description": "Grounded summary",
      "aliases": ["Optional alias"],
      "tags": ["Optional tag"],
      "customFields": [
        { "key": "role", "value": "Optional value" }
      ],
      "evidenceText": "Short exact snippet from chapter",
      "rationale": "Why this should be added",
      "confidence": "low|medium|high"
    }
  ],
  "updateAliases": [
    {
      "entryName": "Existing entry name",
      "aliases": ["New alias"],
      "evidenceText": "Short exact snippet from chapter",
      "rationale": "Why this alias should be added",
      "confidence": "low|medium|high"
    }
  ],
  "createRelationships": [
    {
      "sourceName": "Existing source entry",
      "targetName": "Existing target entry",
      "forwardLabel": "mentors",
      "reverseLabel": "mentored by",
      "evidenceText": "Short exact snippet from chapter",
      "rationale": "Why this relationship should exist",
      "confidence": "low|medium|high"
    }
  ],
  "createProgressions": [
    {
      "entryName": "Existing entry name",
      "descriptionOverride": "Optional updated chapter-aware description",
      "fieldOverrides": {
        "status": "New status"
      },
      "notes": "Optional note",
      "evidenceText": "Short exact snippet from chapter",
      "rationale": "Why this is a meaningful state change",
      "confidence": "low|medium|high"
    }
  ],
  "flagStaleEntries": [
    {
      "entryName": "Existing entry name",
      "reason": "Why the current Codex may now be outdated",
      "suspectedFields": ["status"],
      "evidenceText": "Short exact snippet from chapter",
      "rationale": "Why this should be reviewed",
      "confidence": "low|medium|high"
    }
  ]
}

Rules:
- Only suggest grounded, explicit, reviewable changes.
- Prefer omission over speculation.
- Do not restate facts already present in the Codex unless the chapter materially changes them.
- Only create progressions for meaningful changes in state, role, allegiance, condition, ownership, or similar chapter-aware truth.
- Only add aliases when the chapter clearly uses a real nickname, title, alternate name, or identity label.
- Only create relationships when the chapter gives a clear basis for the connection.
- Keep evidenceText short and exact.
- Keep rationale concise.
- If no suggestions fit a bucket, return an empty array for that bucket.

EXISTING CODEX TRUTH BEFORE THIS CHAPTER:
${codexContext}

CHAPTER NUMBER:
${chapterNumber}

CHAPTER SUMMARY:
${chapterSummary || "No summary available yet."}

CHAPTER TEXT:
${chapterContent}`;
}
