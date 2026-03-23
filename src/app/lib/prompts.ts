import { StoryFormData, Story, Rating, RelationshipType } from "../types/story";
import { getFandomContext } from "./fandoms";

function getRatingInstructions(rating: Rating): string {
  switch (rating) {
    case "general":
      return "CONTENT RATING: General. Keep content suitable for all ages. No violence, sexual content, or strong language.";
    case "teen":
      return "CONTENT RATING: Teen. Mild violence and implied romance are acceptable. No explicit sexual content.";
    case "mature":
      return "CONTENT RATING: Mature. Adult themes, moderate violence, sexual tension allowed. Fade to black for sexual content.";
    case "explicit":
      return "CONTENT RATING: Explicit. No restrictions. Graphic sexual content, violence, and dark themes are fully permitted. Do NOT fade to black.";
  }
}

function getRelationshipInstructions(type: RelationshipType, characters: string[]): string {
  const char1 = characters[0] || "Character 1";
  const char2 = characters[1] || "Character 2";
  switch (type) {
    case "gen":
      return "RELATIONSHIP: Gen (no romantic focus). Focus on plot, friendship, and character dynamics rather than romance.";
    case "mm":
      return `RELATIONSHIP: M/M. Write romantic and/or sexual tension between ${char1} and ${char2} as a male/male pairing.`;
    case "fm":
      return `RELATIONSHIP: F/M. Write romantic and/or sexual tension between ${char1} and ${char2} as a female/male pairing.`;
    case "ff":
      return `RELATIONSHIP: F/F. Write romantic and/or sexual tension between ${char1} and ${char2} as a female/female pairing.`;
    case "multi":
      return `RELATIONSHIP: Multi/Polyamorous. Write romantic dynamics involving multiple characters: ${characters.filter(Boolean).join(", ")}.`;
    case "other":
      return `RELATIONSHIP: Other. Write the relationship between ${char1} and ${char2} as the story demands, without assumptions about gender.`;
  }
}

export function buildChapter1Prompt(form: StoryFormData): string {
  const fandomCtx = getFandomContext(form.fandom);
  const fandomName = form.customFandom || form.fandom || "Original";
  const toneStr = form.tone.join(" + ");

  return `You are a skilled creative fiction writer specializing in ${fandomName} stories. You write vivid, emotionally gripping fiction.

${getRatingInstructions(form.rating)}

${getRelationshipInstructions(form.relationshipType, form.characters)}

${fandomCtx ? fandomCtx : "This is an original story. Build an immersive world from the user's inputs."}

Write Chapter 1 for a new story with these specifications:

STORY CONFIGURATION:
- Characters: ${form.characters.filter(Boolean).join(", ")}
${form.setting ? `- Setting: ${form.setting}` : ""}
- Tone: ${toneStr}
${form.tropes.length > 0 ? `- Tropes: ${form.tropes.join(", ")}` : ""}

TITLE GENERATION:
First, generate a compelling story title that:
- Captures the essence of the story
- Reflects the ${toneStr} tone
- Is memorable and evocative
- Is 2-6 words long

CHAPTER 1 INSTRUCTIONS:
1. Write approximately 3-4 paragraphs (400-600 words)
2. Start with a compelling hook — the first sentence should grab
3. Introduce characters naturally through action and dialogue
4. Establish setting vividly using sensory detail
5. Create tension, desire, or intrigue
6. End with a cliffhanger or irresistible hook for Chapter 2
7. Match the "${toneStr}" tone throughout
8. Show, don't tell — use action, dialogue, and body language
${fandomCtx ? `9. Stay true to ${fandomName} canon` : "9. Build an immersive world"}
10. Incorporate selected tropes naturally — weave them in, don't announce them
11. Do NOT hold back on intensity. If the tone calls for heat, write heat. If it calls for darkness, write darkness.

OUTPUT FORMAT (follow exactly):
Title: [Generated Title]

[Chapter 1 text — no "Chapter 1" header, just the story text]`;
}

export function buildContinuationPrompt(story: Story, chapterNum: number): string {
  const fandomCtx = getFandomContext(story.fandom);
  const fandomName = story.customFandom || story.fandom || "Original";
  const toneStr = story.tone.join(" + ");
  const rating = story.rating ?? "mature";
  const relationshipType = story.relationshipType ?? "gen";

  const chapterHistory = story.chapters
    .map((ch, i) => `--- Chapter ${i + 1} ---\n${ch}`)
    .join("\n\n");

  return `You are continuing a serialised ${fandomName} story. You write vivid, emotionally gripping fiction.

${getRatingInstructions(rating)}

${getRelationshipInstructions(relationshipType, story.characters)}

${fandomCtx}

STORY DETAILS:
- Title: "${story.title}"
- Characters: ${story.characters.filter(Boolean).join(", ")}
${story.setting ? `- Setting: ${story.setting}` : ""}
- Tone: ${toneStr}
${story.tropes.length > 0 ? `- Tropes: ${story.tropes.join(", ")}` : ""}

PREVIOUS CHAPTERS:
${chapterHistory}

CHAPTER ${chapterNum} INSTRUCTIONS:
1. Continue DIRECTLY from where Chapter ${chapterNum - 1} ended
2. Remember and reference previous events — continuity is sacred
3. Maintain character voices and consistency
4. Advance the plot meaningfully — something must change or deepen
5. Maintain the established tone
6. End with a compelling hook or cliffhanger — make them NEED to click Continue
7. Write approximately 3-4 paragraphs (400-600 words)
8. Show character growth or shift in dynamics
9. Do NOT summarise previous chapters — jump straight into the action
10. Do NOT hold back on intensity. Match or escalate the established tone.

Write Chapter ${chapterNum} now (just the story text, no chapter header):`;
}
