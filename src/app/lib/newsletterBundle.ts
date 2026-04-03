import { getAdaptationPreset } from "./adaptations";
import { formatNewsletterCadence } from "./projectMode";
import type {
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../types/adaptation";
import {
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS,
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS,
  type NewsletterIssuePackageSelectionField,
  type NewsletterIssuePackageSelectionValues,
} from "../types/newsletter";
import type { NewsletterModeConfig } from "../types/story";

const ISSUE_BUNDLE_OUTPUT_ORDER: AdaptationOutputType[] = [
  "issue_subject_line",
  "issue_deck",
  "issue_section_package",
  "issue_hook_variants",
  "issue_cta_variants",
  "issue_send_checklist",
  "newsletter_recap",
  "public_teaser",
];

export function buildNewsletterIssueBundle(params: {
  storyTitle: string;
  chapterNumber: number;
  chapterContent: string;
  chapterSummary?: string | null;
  modeConfig: NewsletterModeConfig;
  outputs: ChapterAdaptationResult[];
  packageSelection?: NewsletterIssuePackageSelectionValues | null;
}) {
  const {
    storyTitle,
    chapterNumber,
    chapterContent,
    chapterSummary,
    modeConfig,
    outputs,
    packageSelection,
  } = params;
  const outputMap = new Map(
    outputs.map((output) => [output.outputType, output])
  );
  const missingOutputs = ISSUE_BUNDLE_OUTPUT_ORDER.filter(
    (outputType) => !outputMap.get(outputType)?.content.trim()
  );
  const requiredSelectionFields = getRequiredSelectionFields(modeConfig);
  const missingSelections = requiredSelectionFields.filter(
    (field) => !packageSelection?.[field]?.trim()
  );
  const sections: string[] = [];

  sections.push(`# ${storyTitle}`);
  sections.push(`## Issue ${chapterNumber} Bundle`);
  sections.push("");
  sections.push("### Publication Profile");
  sections.push(`- Topic: ${modeConfig.topic || "Not set"}`);
  sections.push(`- Audience: ${modeConfig.audience || "Not set"}`);
  sections.push(`- Cadence: ${formatNewsletterCadence(modeConfig.cadence)}`);
  sections.push(`- Current angle: ${modeConfig.issueAngle || "Not set"}`);

  if (modeConfig.subtitle) {
    sections.push(`- Subtitle: ${modeConfig.subtitle}`);
  }

  if (modeConfig.hookApproach) {
    sections.push(`- Hook approach: ${modeConfig.hookApproach}`);
  }

  if (modeConfig.ctaStyle) {
    sections.push(`- CTA style: ${modeConfig.ctaStyle}`);
  }

  sections.push(
    `- Recurring sections: ${
      modeConfig.recurringSections?.length
        ? modeConfig.recurringSections.join(", ")
        : "Not set"
    }`
  );

  if (chapterSummary?.trim()) {
    sections.push("");
    sections.push("### Issue Summary");
    sections.push(chapterSummary.trim());
  }

  sections.push("");
  sections.push("### Canonical Issue Package");

  for (const field of NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS) {
    sections.push("");
    sections.push(`#### ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[field]}`);

    if (field === "sectionPackage" && !modeConfig.recurringSections?.length) {
      sections.push("_Not required until recurring sections are configured._");
      continue;
    }

    sections.push(packageSelection?.[field]?.trim() || "_Not selected yet._");
  }

  sections.push("");
  sections.push("### Saved Option Sets");

  for (const outputType of ISSUE_BUNDLE_OUTPUT_ORDER) {
    const output = outputMap.get(outputType);
    sections.push("");
    sections.push(`#### ${getAdaptationPreset(outputType).label}`);
    sections.push(output?.content.trim() || "_Not generated yet._");
  }

  sections.push("");
  sections.push("### Issue Body");
  sections.push(chapterContent.trim());

  const safeTitle = storyTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return {
    filename: `${safeTitle || "newsletter"}-issue-${chapterNumber}-bundle.md`,
    content: sections.join("\n"),
    missingOutputs,
    missingSelections,
  };
}

function getRequiredSelectionFields(
  modeConfig: NewsletterModeConfig
): NewsletterIssuePackageSelectionField[] {
  return modeConfig.recurringSections?.length
    ? NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS
    : NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS.filter(
        (field) => field !== "sectionPackage"
      );
}
