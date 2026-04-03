import { getAdaptationPreset } from "./adaptations";
import type {
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../types/adaptation";

const ISSUE_PACKAGE_SUPPORT_TYPES: AdaptationOutputType[] = [
  "issue_subject_line",
  "issue_deck",
  "issue_section_package",
  "issue_hook_variants",
  "issue_cta_variants",
];

export function getIssuePackageSupportingArtifacts(
  results: ChapterAdaptationResult[]
) {
  return results
    .filter(
      (result) =>
        ISSUE_PACKAGE_SUPPORT_TYPES.includes(result.outputType)
        && result.content.trim().length > 0
    )
    .map((result) => ({
      label: getAdaptationPreset(result.outputType).label,
      content: result.content.trim(),
    }));
}
