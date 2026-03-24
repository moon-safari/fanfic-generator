export function buildRewritePrompt(
  selectedText: string,
  direction: string,
  context: string,
  bibleContext: string
): string {
  return `You are a skilled fiction editor. Rewrite the selected passage following the given direction.
${bibleContext ? `\n${bibleContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
REWRITE DIRECTION: ${direction}

SELECTED TEXT TO REWRITE:
${selectedText}

Output ONLY the rewritten text. No explanations, no commentary, no headers.`;
}

export function buildExpandPrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a skilled fiction writer. Expand the selected passage with rich sensory detail, deeper emotion, and vivid description. Target approximately double the original length while preserving all original meaning and events.
${bibleContext ? `\n${bibleContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT TO EXPAND:
${selectedText}

Output ONLY the expanded text. No explanations, no commentary, no headers.`;
}

export function buildDescribePrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a skilled fiction writer. Generate 4 alternative descriptions for the selected passage. Each alternative should approach the same content from a different angle — different sensory focus, different emotional register, or different stylistic approach.
${bibleContext ? `\n${bibleContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT:
${selectedText}

Output ONLY a valid JSON array of 4 strings, each a complete alternative description. No explanations, no markdown fences.

Example format: ["First alternative...", "Second alternative...", "Third alternative...", "Fourth alternative..."]`;
}

export function buildBrainstormPrompt(
  selectedText: string,
  context: string,
  bibleContext: string
): string {
  return `You are a creative story planner. Generate 5 compelling plot directions that could follow from the selected passage. Each direction should be distinct, dramatically interesting, and feel earned by the story so far.
${bibleContext ? `\n${bibleContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT / CURRENT MOMENT:
${selectedText}

Output ONLY a valid JSON array of 5 objects with this exact structure. No explanations, no markdown fences:

[
  {
    "title": "Short evocative title for this direction",
    "description": "2-3 sentence description of what happens in this direction",
    "preview": "1-2 sentence opening that sets up this direction"
  }
]`;
}
