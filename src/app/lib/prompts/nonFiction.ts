import { getNonFictionModeConfig } from "../projectMode.ts";
import type {
  NonFictionStoryFormData,
  Story,
} from "../../types/story.ts";

export function buildNonFictionSection1Prompt(
  form: NonFictionStoryFormData
): string {
  const tone = form.tone.join(" + ");

  return `You are a rigorous non-fiction writer building the opening section of an article or essay project.

TITLE: ${form.title}
TONE: ${tone}
${form.pieceEngine ? `PIECE ENGINE: ${form.pieceEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: hybrid_section_draft

Write Section 1 as a hybrid section draft with inline claim/evidence cues.
- The draft should read like a real article or essay section, not an outline dump.
- Keep the section readable and collaborator-friendly while making support burdens explicit.
- Use concrete, source-aware phrasing without pretending unproven claims are settled.

RECOMMENDED HEADING SHAPE:
- Purpose:
- Claim cue:
- Evidence cue:
- Draft:
- Counterpoint / caveat:
- Transition:

SECTION 1 GOALS:
1. Establish the article's opening problem or frame quickly.
2. Land one clear claim or thesis move.
3. Name the strongest available evidence cue without fabricating support.
4. Leave a live transition into Section 2.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Section 1 text only]`;
}

export function buildNonFictionContinuationPrompt(
  story: Story,
  sectionNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getNonFictionModeConfig(story);
  const sectionHistory = story.chapters
    .map((section, index) => {
      const label = `Section ${index + 1}`;
      const isRecent = index >= story.chapters.length - 2;

      if (isRecent) {
        return `--- ${label} ---\n${section.content}`;
      }

      if (section.summary) {
        return `--- ${label} (Summary) ---\n${section.summary}`;
      }

      return `--- ${label} ---\n${section.content}`;
    })
    .join("\n\n");

  return `You are continuing a non-fiction project as an evidence-aware writer.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: hybrid_section_draft
${modeConfig?.pieceEngine ? `PIECE ENGINE: ${modeConfig.pieceEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS SECTIONS:
${sectionHistory}

SECTION ${sectionNumber} INSTRUCTIONS:
1. Continue directly from the prior section's argument flow and proof burden.
2. Write the next section as a hybrid section draft with inline claim/evidence cues.
3. Keep claims proportional to the evidence actually established so far.
4. Preserve source continuity, counterpoints, and unresolved proof gaps already in the project.
5. Use planning guidance to sharpen section intent, but do not canonize planned evidence that is not in the draft.
6. End with transition pressure that makes the next section feel necessary.

Write Section ${sectionNumber} now (section text only):`;
}
