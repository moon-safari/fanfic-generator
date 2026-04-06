import { getGameWritingModeConfig } from "../projectMode.ts";
import type {
  GameWritingStoryFormData,
  Story,
} from "../../types/story.ts";

export function buildGameWritingQuest1Prompt(
  form: GameWritingStoryFormData
): string {
  const tone = form.tone.join(" + ");

  return `You are a game narrative writer building the opening quest of a game-writing project.

TITLE: ${form.title}
TONE: ${tone}
${form.questEngine ? `QUEST ENGINE: ${form.questEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: hybrid_quest_brief

Write Quest 1 as a hybrid quest brief with embedded dialogue choices.
- Keep the draft readable, collaborator-friendly, and systems-aware without turning it into implementation pseudo-code.
- Make player intent, quest pressure, NPC leverage, and follow-up consequences explicit in prose.
- Use a stable quest-brief structure with clear headings.

QUEST 1 GOALS:
1. Establish the quest premise and immediate pressure quickly.
2. Give the player a clear objective and reason to care.
3. Introduce the most important NPC, faction, or world-state pressure.
4. Include at least one meaningful dialogue choice with intended outcomes.
5. End with momentum, escalation, or a follow-up hook.

RECOMMENDED HEADING SHAPE:
- Premise:
- Player Goal:
- Key Stages:
- Dialogue Choices:
- Outcomes / Follow-up Hooks:

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Quest 1 text only]`;
}

export function buildGameWritingContinuationPrompt(
  story: Story,
  questNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getGameWritingModeConfig(story);
  const questHistory = story.chapters
    .map((quest, index) => {
      const label = `Quest ${index + 1}`;
      const isRecent = index >= story.chapters.length - 2;

      if (isRecent) {
        return `--- ${label} ---\n${quest.content}`;
      }

      if (quest.summary) {
        return `--- ${label} (Summary) ---\n${quest.summary}`;
      }

      return `--- ${label} ---\n${quest.content}`;
    })
    .join("\n\n");

  return `You are continuing a game-writing project as a quest-first narrative designer.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: hybrid_quest_brief
${modeConfig?.questEngine ? `QUEST ENGINE: ${modeConfig.questEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS QUESTS:
${questHistory}

QUEST ${questNumber} INSTRUCTIONS:
1. Continue directly from the prior quest's pressure, consequences, and unresolved follow-up.
2. Write the next quest as a hybrid quest brief with embedded dialogue choices.
3. Keep player objective, blockers, rewards, faction pressure, and NPC leverage coherent with what is already true.
4. Use planning guidance to sharpen intent and dependency handling, but do not force outcomes the written quests have not earned.
5. Keep the draft structured, readable, and collaborator-friendly rather than prose-fictional or implementation-coded.
6. End with a consequence, reveal, escalation, or handoff hook that makes the next quest feel necessary.

Write Quest ${questNumber} now (quest text only):`;
}
