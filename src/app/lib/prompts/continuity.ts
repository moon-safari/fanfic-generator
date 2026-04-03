import { getProjectUnitLabel } from "../projectMode";
import type { ProjectMode } from "../../types/story";

export function buildContinuityCheckPrompt(
  chapterContent: string,
  chapterNumber: number,
  storyContext: string,
  previousSummaries: { number: number; summary: string }[],
  projectMode: ProjectMode = "fiction",
  planningContext = ""
): string {
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelPlural = getProjectUnitLabel(projectMode, { count: 2 });
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });

  const summarySection =
    previousSummaries.length > 0
      ? `PREVIOUS ${unitLabelCapitalized.toUpperCase()} SUMMARIES:\n${previousSummaries
          .map((summary) => `${unitLabelCapitalized} ${summary.number}: ${summary.summary}`)
          .join("\n")}`
      : "";

  if (projectMode === "newsletter") {
    return `You are a newsletter continuity and editorial-drift checker. Identify genuine contradictions, broken reader promises, or planning drift in the current ${unitLabel} compared to the established newsletter memory, planning layer, and previous ${unitLabelPlural}.

Be CONSERVATIVE.

Only flag:
- clear contradictions with established facts, promises, or prior issue summaries
- clear drift from the planned issue intent or expected reveal
- clear break from the stored series promise or style guide
- an opening that clearly fails to tee up the promised issue angle
- a clear break from recurring sections or CTA patterns recorded in planning notes
- clearly overdue follow-ups the planning layer expected by now

Do NOT flag:
- healthy iteration of ideas
- small tonal variation that still fits the writer
- unresolved questions unless a payoff was explicitly due
- normal newsletter evolution that still honors the audience promise
- ordinary hook/style preference when the opening still works
- minor closing variation when the issue still lands cleanly

False positives are annoying to creators.
${storyContext ? `\n${storyContext}\n` : ""}
${planningContext ? `${planningContext}\n` : ""}
${summarySection ? `${summarySection}\n` : ""}
${unitLabelCapitalized.toUpperCase()} ${chapterNumber} TO CHECK:
${chapterContent}

Output ONLY a valid JSON object with this exact structure. No explanations, no markdown fences:

{
  "annotations": [
    {
      "text": "The exact text from the source unit that contains the issue (a short phrase or sentence)",
      "issue": "Clear description of the problem and what it conflicts with",
      "sourceChapter": 0,
      "severity": "warning",
      "annotationType": "planning_drift",
      "metadata": {
        "reasonType": "promise_drift",
        "targetSection": "synopsis",
        "targetLabel": "Series promise",
        "reasonDetail": "Optional short explanation the writer can act on immediately",
        "suggestedAction": "review_synopsis"
      }
    }
  ]
}

For sourceChapter:
- use 0 if the issue is with general project memory or project-wide planning
- use the earlier unit number where the original fact or promise was established when possible

For severity:
- use "error" for direct contradictions of established facts or explicit promises
- use "warning" for meaningful editorial drift or missed planned follow-up
- use "info" for softer but useful drift worth the creator's attention

For annotationType:
- use "continuity_warning" for contradictions with established facts or summaries
- use "planning_drift" for series-promise drift, style drift, hook/CTA/segment drift, missed issue intent, active-arc drift, or due tracked follow-ups

For metadata:
- include it when it helps the writer take action
- reasonType must be one of: "fact_contradiction", "intent_miss", "due_thread", "arc_drift", "promise_drift", "voice_drift", "hook_drift", "cta_drift", "segment_drift"
- targetSection should be:
  - "synopsis" for series-promise drift
  - "style_guide" for voice/style drift
  - "outline" for issue intent, reveal, or opening-hook drift
  - "notes" for arc/thread problems, recurring segments, or CTA/ending patterns
- targetLabel should name the specific promise, style concern, issue angle, segment, CTA pattern, arc, or thread when clear
- reasonDetail can be included as one short sentence for the tooltip if it helps
- suggestedAction should usually be "review_synopsis", "review_style_guide", "review_outline", or "review_notes"
- if the author may simply be diverging on purpose, use "dismiss_if_intentional"

If there are no issues, return: { "annotations": [] }`;
  }

  return `You are a continuity and planning checker for serialized writing. Identify genuine contradictions, inconsistencies, or planning drift in the current ${unitLabel} compared to the established story context, planning layer, and previous ${unitLabelPlural}.

Be CONSERVATIVE.

Only flag:
- clear contradictions with established facts
- clear planning drift where the current ${unitLabel} obviously fails its stated intent, misses an explicitly due payoff, or conflicts with the planning layer

Do NOT flag:
- stylistic choices
- unresolved mysteries
- ordinary discovery writing that evolves away from a loose plan
- threads that are still open unless the planning layer says they should land by now

False positives are annoying to authors.
${storyContext ? `\n${storyContext}\n` : ""}
${planningContext ? `${planningContext}\n` : ""}
${summarySection ? `${summarySection}\n` : ""}
${unitLabelCapitalized.toUpperCase()} ${chapterNumber} TO CHECK:
${chapterContent}

Output ONLY a valid JSON object with this exact structure. No explanations, no markdown fences:

{
  "annotations": [
    {
      "text": "The exact text from the source unit that contains the issue (a short phrase or sentence)",
      "issue": "Clear description of the continuity problem and what it contradicts",
      "sourceChapter": 0,
      "severity": "warning",
      "annotationType": "continuity_warning",
      "metadata": {
        "reasonType": "fact_contradiction",
        "targetSection": "outline",
        "targetLabel": "Specific arc, thread, intent, or reveal name when relevant",
        "reasonDetail": "Optional short explanation the writer can act on immediately",
        "suggestedAction": "review_outline"
      }
    }
  ]
}

For sourceChapter:
- use 0 if the issue is with general project context or project-wide planning
- use the earlier unit number where the original fact or planned payoff was established when possible

For severity:
- use "error" for direct contradictions of established facts
- use "warning" for clear inconsistencies or meaningful planning drift
- use "info" for softer but useful planning drift worth the author's attention

For annotationType:
- use "continuity_warning" for contradictions with established facts or summaries
- use "planning_drift" for issues against unit intent, expected reveal/turn, active arcs, or due tracked threads

For metadata:
- include it when it helps the writer take action
- reasonType must be one of: "fact_contradiction", "intent_miss", "reveal_drift", "due_thread", "arc_drift"
- targetSection should be "outline" for unit intent/reveal problems and "notes" for arc/thread problems
- targetLabel should name the specific intent, reveal, arc, or thread if one is clear
- reasonDetail can be included as one short sentence for the tooltip if it helps
- suggestedAction should usually be "review_outline" or "review_notes"
- if the author may simply be diverging on purpose, use "dismiss_if_intentional"

If there are no issues, return: { "annotations": [] }`;
}
