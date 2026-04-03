export function buildRewritePrompt(
  selectedText: string,
  direction: string,
  context: string,
  storyContext: string
): string {
  return `You are a skilled fiction editor. Rewrite the selected passage following the given direction.
${storyContext ? `\n${storyContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
REWRITE DIRECTION: ${direction}

SELECTED TEXT TO REWRITE:
${selectedText}

Output ONLY the rewritten text. No explanations, no commentary, no headers.`;
}

export function buildExpandPrompt(
  selectedText: string,
  context: string,
  storyContext: string
): string {
  return `You are a skilled fiction writer. Expand the selected passage with rich sensory detail, deeper emotion, and vivid description. Target approximately double the original length while preserving all original meaning and events.
${storyContext ? `\n${storyContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT TO EXPAND:
${selectedText}

Output ONLY the expanded text. No explanations, no commentary, no headers.`;
}

export function buildDescribePrompt(
  selectedText: string,
  context: string,
  storyContext: string
): string {
  return `You are a skilled fiction writer. Generate vivid sensory descriptions for the selected passage.

For each relevant sense (sight, smell, sound, touch, taste), write a 2-3 sentence description. Skip senses that don't naturally apply. Then write a "blend" that combines the best elements from all senses into one cohesive passage.
${storyContext ? `\n${storyContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT:
${selectedText}

Output ONLY valid JSON with this exact structure. No explanations, no markdown fences:

{
  "blend": "A combined passage weaving together the most vivid sensory details...",
  "senses": [
    { "type": "sight", "text": "Visual description..." },
    { "type": "sound", "text": "Auditory description..." }
  ]
}

Only include senses that are relevant. Always include "blend".`;
}

export function buildBrainstormPrompt(
  selectedText: string,
  context: string,
  storyContext: string
): string {
  return `You are a creative story planner. Generate 5 compelling plot directions that could follow from the selected passage. Each direction should be distinct, dramatically interesting, and feel earned by the story so far.
${storyContext ? `\n${storyContext}\n` : ""}
${context ? `SURROUNDING CONTEXT:\n${context}\n` : ""}
SELECTED TEXT / CURRENT MOMENT:
${selectedText}

Output ONLY a valid JSON array of 5 objects with this exact structure. No explanations, no markdown fences:

[
  {
    "title": "Short evocative title for this direction",
    "description": "2-3 sentence description of what happens in this direction",
    "prose": "1-2 sentence opening paragraph showing how this direction would read in the story"
  }
]`;
}
