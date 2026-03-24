export function buildContinuityCheckPrompt(
  chapterContent: string,
  chapterNumber: number,
  bibleContext: string,
  previousSummaries: { number: number; summary: string }[]
): string {
  const summarySection =
    previousSummaries.length > 0
      ? `PREVIOUS CHAPTER SUMMARIES:\n${previousSummaries
          .map((s) => `Chapter ${s.number}: ${s.summary}`)
          .join("\n")}`
      : "";

  return `You are a continuity checker for serialised fiction. Identify genuine contradictions, inconsistencies, or continuity errors in the current chapter compared to the story bible and previous chapters.

Be CONSERVATIVE — only flag clear contradictions. Do NOT flag stylistic choices, unresolved mysteries, or things that are simply new information. False positives are annoying to authors.
${bibleContext ? `\n${bibleContext}\n` : ""}
${summarySection ? `${summarySection}\n` : ""}
CHAPTER ${chapterNumber} TO CHECK:
${chapterContent}

Output ONLY a valid JSON object with this exact structure. No explanations, no markdown fences:

{
  "annotations": [
    {
      "text": "The exact text from the chapter that contains the issue (a short phrase or sentence)",
      "issue": "Clear description of the continuity problem and what it contradicts",
      "sourceChapter": 0,
      "severity": "warning"
    }
  ]
}

For sourceChapter: use 0 if the contradiction is with the story bible, or the chapter number where the original fact was established.
For severity: use "error" for direct contradictions of established facts, "warning" for potential inconsistencies.
If there are no issues, return: { "annotations": [] }`;
}
