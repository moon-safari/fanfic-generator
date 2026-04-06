import type {
  FictionStoryFormData,
  NewsletterStoryFormData,
  Rating,
  RelationshipType,
  Story,
  StoryFormData,
} from "../../types/story.ts";
import { getFandomContext } from "../fandoms/index.ts";
import {
  getNewsletterModeConfig,
  isComicsFormData,
  isGameWritingFormData,
  isNewsletterFormData,
  isScreenplayFormData,
} from "../projectMode.ts";
import {
  buildComicsContinuationPrompt,
  buildComicsPage1Prompt,
} from "./comics.ts";
import {
  buildGameWritingContinuationPrompt,
  buildGameWritingQuest1Prompt,
} from "./gameWriting.ts";
import {
  buildScreenplayContinuationPrompt,
  buildScreenplayScene1Prompt,
} from "./screenplay.ts";

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

function buildFictionChapter1Prompt(form: FictionStoryFormData): string {
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

function buildNewsletterIssue1Prompt(form: NewsletterStoryFormData): string {
  const toneStr = form.tone.join(" + ");

  return `You are a sharp, thoughtful newsletter writer building the first issue of a serialized creator newsletter.

Write with clarity, momentum, specificity, and a distinct human voice.
Do not sound corporate, vague, or generic.

NEWSLETTER CONFIGURATION:
- Newsletter title: ${form.title}
- Topic: ${form.newsletterTopic}
- Audience: ${form.audience}
- Current issue angle: ${form.issueAngle}
- Cadence: ${form.cadence}
- Voice: ${toneStr}

ISSUE 1 INSTRUCTIONS:
1. Write approximately 500 to 800 words.
2. Open with a strong, immediate lead that earns attention quickly.
3. Stay tightly focused on the current issue angle.
4. Deliver at least one concrete insight, observation, or useful frame.
5. Keep the prose readable, crisp, and audience-facing.
6. End with a forward-looking close that makes the next issue feel alive.
7. Do not add markdown headings, bullet lists, or explanatory notes unless the prose naturally calls for a very short list.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Issue 1 text — no separate issue header, just the newsletter text]`;
}

export function buildChapter1Prompt(form: StoryFormData): string {
  if (isNewsletterFormData(form)) {
    return buildNewsletterIssue1Prompt(form);
  }

  if (isScreenplayFormData(form)) {
    return buildScreenplayScene1Prompt(form);
  }

  if (isComicsFormData(form)) {
    return buildComicsPage1Prompt(form);
  }

  if (isGameWritingFormData(form)) {
    return buildGameWritingQuest1Prompt(form);
  }

  return buildFictionChapter1Prompt(form);
}

export function buildContinuationPrompt(
  story: Story,
  chapterNum: number,
  storyContext?: string,
  planningContext?: string
): string {
  if (story.projectMode === "newsletter") {
    return buildNewsletterContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  if (story.projectMode === "screenplay") {
    return buildScreenplayContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  if (story.projectMode === "comics") {
    return buildComicsContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  if (story.projectMode === "game_writing") {
    return buildGameWritingContinuationPrompt(
      story,
      chapterNum,
      storyContext,
      planningContext
    );
  }

  return buildFictionContinuationPrompt(
    story,
    chapterNum,
    storyContext,
    planningContext
  );
}

function buildFictionContinuationPrompt(
  story: Story,
  chapterNum: number,
  storyContext?: string,
  planningContext?: string
): string {
  const fandomCtx = getFandomContext(story.fandom);
  const fandomName = story.customFandom || story.fandom || "Original";
  const toneStr = story.tone.join(" + ");
  const rating = story.rating ?? "mature";
  const relationshipType = story.relationshipType ?? "gen";

  // Smart context budget: last 2 chapters full text, earlier chapters use summary if available
  const chapterHistory = story.chapters
    .map((ch, i) => {
      const chapNum = i + 1;
      const isRecent = i >= story.chapters.length - 2;
      if (isRecent) {
        return `--- Chapter ${chapNum} ---\n${ch.content}`;
      }
      // Use summary if available, otherwise fall back to full text
      if (ch.summary) {
        return `--- Chapter ${chapNum} (Summary) ---\n${ch.summary}`;
      }
      return `--- Chapter ${chapNum} ---\n${ch.content}`;
    })
    .join("\n\n");

  return `You are continuing a serialised ${fandomName} story. You write vivid, emotionally gripping fiction.

${getRatingInstructions(rating)}

${getRelationshipInstructions(relationshipType, story.characters)}

${fandomCtx}
${storyContext ? `\n${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}
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
11. Use the planning guidance when it is specific, but never force beats that contradict established story truth.

Write Chapter ${chapterNum} now (just the story text, no chapter header):`;
}

function buildNewsletterContinuationPrompt(
  story: Story,
  chapterNum: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getNewsletterModeConfig(story);
  const toneStr = story.tone.join(" + ");
  const issueHistory = story.chapters
    .map((chapter, index) => {
      const issueNumber = index + 1;
      const isRecent = index >= story.chapters.length - 2;

      if (isRecent) {
        return `--- Issue ${issueNumber} ---\n${chapter.content}`;
      }

      if (chapter.summary) {
        return `--- Issue ${issueNumber} (Summary) ---\n${chapter.summary}`;
      }

      return `--- Issue ${issueNumber} ---\n${chapter.content}`;
    })
    .join("\n\n");

  return `You are continuing a serialized newsletter project.

Keep the same audience promise, voice, and series identity while making the next issue feel worth opening.
Do not drift into generic blog filler.

NEWSLETTER DETAILS:
- Title: "${story.title}"
${modeConfig ? `- Topic: ${modeConfig.topic}` : ""}
${modeConfig ? `- Audience: ${modeConfig.audience}` : ""}
${modeConfig ? `- Current issue angle: ${modeConfig.issueAngle}` : ""}
${modeConfig ? `- Cadence: ${modeConfig.cadence}` : ""}
${modeConfig?.subtitle ? `- Subtitle: ${modeConfig.subtitle}` : ""}
${modeConfig?.hookApproach ? `- Hook approach: ${modeConfig.hookApproach}` : ""}
${modeConfig?.ctaStyle ? `- CTA style: ${modeConfig.ctaStyle}` : ""}
${modeConfig?.recurringSections?.length ? `- Recurring sections: ${modeConfig.recurringSections.join(", ")}` : ""}
${toneStr ? `- Voice: ${toneStr}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS ISSUES:
${issueHistory}

ISSUE ${chapterNum} INSTRUCTIONS:
1. Continue the series naturally from what has already been established.
2. Reference earlier issues only where it sharpens context or continuity.
3. Stay focused on one clear angle or promise for this issue.
4. Write approximately 500 to 800 words.
5. Keep the prose crisp, specific, and audience-facing.
6. End with a closing line or final paragraph that leaves useful momentum for the next issue.
7. Do not include markdown fences or meta commentary.
8. Use the planning guidance when it is specific, but do not let it flatten the issue into generic outline-following prose.

Write Issue ${chapterNum} now (just the issue text, no issue header):`;
}
