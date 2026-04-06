import { getScreenplayModeConfig } from "../projectMode.ts";
import type {
  ScreenplayStoryFormData,
  Story,
} from "../../types/story.ts";

export function buildScreenplayScene1Prompt(
  form: ScreenplayStoryFormData
): string {
  const tone = form.tone.join(" + ");
  const formatSection =
    form.draftingPreference === "script_pages"
      ? `Write Scene 1 as Fountain-compatible screenplay pages.
- Use a clear slug line.
- Keep action visual and concise.
- Use dialogue only when it sharpens the dramatic turn.
- Output screenplay text, not prose paragraphs.`
      : `Write Scene 1 as a scene-beat draft.
- Focus on objective, pressure, turn, and scene-end propulsion.
- Keep it visual and playable.
- Do not write full screenplay pages yet.`;

  return `You are a sharp screenwriter building the opening scene of a screenplay project.

TITLE: ${form.title}
TONE: ${tone}
${form.storyEngine ? `STORY ENGINE: ${form.storyEngine}` : ""}
DEFAULT DRAFTING PREFERENCE: ${form.draftingPreference}

${formatSection}

SCENE 1 GOALS:
1. Start with an immediate visual hook.
2. Establish pressure quickly.
3. End the scene with a turn, reveal, or propulsion beat.
4. Keep the writing lean, specific, and screenable.

OUTPUT FORMAT (follow exactly):
Title: ${form.title}

[Scene 1 text only]`;
}

export function buildScreenplayContinuationPrompt(
  story: Story,
  sceneNumber: number,
  storyContext?: string,
  planningContext?: string
): string {
  const modeConfig = getScreenplayModeConfig(story);
  const draftingPreference = modeConfig?.draftingPreference ?? "script_pages";
  const sceneHistory = story.chapters
    .map((scene, index) => {
      const isRecent = index >= story.chapters.length - 2;
      const label = `Scene ${index + 1}`;
      if (isRecent) {
        return `--- ${label} ---\n${scene.content}`;
      }
      if (scene.summary) {
        return `--- ${label} (Summary) ---\n${scene.summary}`;
      }
      return `--- ${label} ---\n${scene.content}`;
    })
    .join("\n\n");

  const formatInstruction =
    draftingPreference === "script_pages"
      ? "Write the next scene as Fountain-compatible screenplay pages."
      : "Write the next scene as a scene-beat draft that can later convert cleanly into screenplay pages.";

  return `You are continuing a screenplay project.

TITLE: "${story.title}"
DEFAULT DRAFTING PREFERENCE: ${draftingPreference}
${modeConfig?.storyEngine ? `STORY ENGINE: ${modeConfig.storyEngine}` : ""}
${story.tone.length > 0 ? `TONE: ${story.tone.join(", ")}` : ""}

${storyContext ? `${storyContext}\n` : ""}${planningContext ? `${planningContext}\n` : ""}PREVIOUS SCENES:
${sceneHistory}

SCENE ${sceneNumber} INSTRUCTIONS:
1. Continue directly from the prior scene's dramatic pressure.
2. Keep scene logic, blocking consequences, and payoff obligations coherent.
3. ${formatInstruction}
4. End with momentum into the next scene rather than summary.

Write Scene ${sceneNumber} now (scene text only):`;
}
