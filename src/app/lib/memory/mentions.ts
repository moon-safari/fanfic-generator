import { resolveMemoryEntryAtChapter } from "../prompts/memory";
import type { MemoryEntry } from "../../types/memory";

export interface DetectedMemoryMention {
  entryId: string;
  matchedText: string;
  matchedAlias?: string;
  startIndex: number;
  endIndex: number;
}

interface MentionCandidate {
  entryId: string;
  text: string;
  lowerText: string;
  matchedAlias?: string;
  priority: number;
}

export function detectMemoryMentions(
  chapterContent: string,
  entries: MemoryEntry[],
  chapterNumber: number
): DetectedMemoryMention[] {
  const content = chapterContent.trim();
  if (!content) {
    return [];
  }

  const candidates = buildMentionCandidates(entries, chapterNumber);
  if (candidates.length === 0) {
    return [];
  }

  const lowerContent = content.toLowerCase();
  const occupiedRanges: Array<{ startIndex: number; endIndex: number }> = [];
  const mentions: DetectedMemoryMention[] = [];

  for (const candidate of candidates) {
    let searchIndex = 0;

    while (searchIndex < lowerContent.length) {
      const foundIndex = lowerContent.indexOf(candidate.lowerText, searchIndex);
      if (foundIndex === -1) {
        break;
      }

      const endIndex = foundIndex + candidate.lowerText.length;
      const nextSearchIndex = foundIndex + candidate.lowerText.length;

      if (
        hasTokenBoundary(content, foundIndex, endIndex) &&
        !hasOverlap(occupiedRanges, foundIndex, endIndex)
      ) {
        mentions.push({
          entryId: candidate.entryId,
          matchedText: content.slice(foundIndex, endIndex),
          matchedAlias: candidate.matchedAlias,
          startIndex: foundIndex,
          endIndex,
        });
        occupiedRanges.push({ startIndex: foundIndex, endIndex });
      }

      searchIndex = nextSearchIndex;
    }
  }

  return mentions.sort(
    (a, b) =>
      a.startIndex - b.startIndex ||
      a.endIndex - b.endIndex ||
      a.entryId.localeCompare(b.entryId)
  );
}

function buildMentionCandidates(
  entries: MemoryEntry[],
  chapterNumber: number
): MentionCandidate[] {
  const rawCandidates: MentionCandidate[] = [];
  const phraseOwners = new Map<string, Set<string>>();

  for (const entry of entries) {
    const resolved = resolveMemoryEntryAtChapter(entry, chapterNumber);
    const seenPhrases = new Set<string>();

    const phrases = [
      { text: resolved.name, matchedAlias: undefined, priority: 0 },
      ...resolved.aliases.map((alias) => ({
        text: alias,
        matchedAlias: alias,
        priority: 1,
      })),
    ];

    for (const phrase of phrases) {
      const normalized = normalizeMentionPhrase(phrase.text);
      if (!isViableMentionPhrase(normalized, Boolean(phrase.matchedAlias))) {
        continue;
      }

      const lowerPhrase = normalized.toLowerCase();
      if (seenPhrases.has(lowerPhrase)) {
        continue;
      }

      seenPhrases.add(lowerPhrase);
      rawCandidates.push({
        entryId: entry.id,
        text: normalized,
        lowerText: lowerPhrase,
        matchedAlias: phrase.matchedAlias,
        priority: phrase.priority,
      });

      const owners = phraseOwners.get(lowerPhrase) ?? new Set<string>();
      owners.add(entry.id);
      phraseOwners.set(lowerPhrase, owners);
    }
  }

  return rawCandidates
    .filter((candidate) => (phraseOwners.get(candidate.lowerText)?.size ?? 0) === 1)
    .sort((a, b) => {
      if (a.text.length !== b.text.length) {
        return b.text.length - a.text.length;
      }

      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      return a.text.localeCompare(b.text);
    });
}

function normalizeMentionPhrase(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isViableMentionPhrase(value: string, isAlias: boolean): boolean {
  if (!value) {
    return false;
  }

  if (!/[A-Za-z]/.test(value)) {
    return false;
  }

  if (value.length >= 3) {
    return true;
  }

  return !isAlias && value.length >= 2;
}

function hasTokenBoundary(value: string, startIndex: number, endIndex: number): boolean {
  const before = startIndex === 0 ? "" : value[startIndex - 1];
  const after = endIndex >= value.length ? "" : value[endIndex];
  return isBoundaryChar(before) && isBoundaryChar(after);
}

function isBoundaryChar(value: string): boolean {
  return !value || !/[A-Za-z0-9]/.test(value);
}

function hasOverlap(
  occupiedRanges: Array<{ startIndex: number; endIndex: number }>,
  startIndex: number,
  endIndex: number
): boolean {
  return occupiedRanges.some(
    (range) => startIndex < range.endIndex && endIndex > range.startIndex
  );
}
