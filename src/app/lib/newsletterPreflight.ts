import { getAdaptationPreset } from "./adaptations";
import { buildNewsletterIssueBundle } from "./newsletterBundle";
import type {
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../types/adaptation";
import {
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS,
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_TO_OUTPUT_TYPE,
} from "../types/newsletter";
import type {
  NewsletterIssuePackageSelectionValues,
  NewsletterIssueReadinessCheck,
  NewsletterIssueReadinessReport,
  NewsletterIssueReadinessStatus,
} from "../types/newsletter";
import type { NewsletterModeConfig } from "../types/story";

const CORE_PACKAGE_OUTPUTS: AdaptationOutputType[] = [
  "issue_subject_line",
  "issue_deck",
  "issue_hook_variants",
  "issue_cta_variants",
];

export function buildNewsletterIssueReadinessReport(params: {
  storyTitle: string;
  chapterNumber: number;
  chapterContent: string;
  chapterSummary?: string | null;
  modeConfig: NewsletterModeConfig;
  outputs: ChapterAdaptationResult[];
  packageSelection?: NewsletterIssuePackageSelectionValues | null;
}): NewsletterIssueReadinessReport {
  const {
    storyTitle,
    chapterNumber,
    chapterContent,
    chapterSummary,
    modeConfig,
    outputs,
    packageSelection,
  } =
    params;
  const outputMap = new Map(
    outputs.map((output) => [output.outputType, output])
  );
  const bundle = buildNewsletterIssueBundle({
    storyTitle,
    chapterNumber,
    chapterContent,
    chapterSummary,
    modeConfig,
    outputs,
    packageSelection,
  });
  const checks: NewsletterIssueReadinessCheck[] = [];
  const profileMissingFields: string[] = [];

  if (!modeConfig.topic.trim()) {
    profileMissingFields.push("topic");
  }
  if (!modeConfig.audience.trim()) {
    profileMissingFields.push("audience");
  }
  if (!modeConfig.issueAngle.trim()) {
    profileMissingFields.push("issue angle");
  }
  if (!modeConfig.hookApproach?.trim()) {
    profileMissingFields.push("hook approach");
  }
  if (!modeConfig.ctaStyle?.trim()) {
    profileMissingFields.push("CTA style");
  }
  if (!modeConfig.recurringSections?.length) {
    profileMissingFields.push("recurring sections");
  }

  checks.push({
    key: "profile",
    label: "Publication profile",
    status:
      profileMissingFields.length === 0
        ? "ready"
        : profileMissingFields.length <= 2
          ? "needs_attention"
          : "missing",
    detail:
      profileMissingFields.length === 0
        ? "Publication identity, issue angle, and section memory are configured."
        : `Still missing: ${profileMissingFields.join(", ")}.`,
  });

  checks.push({
    key: "summary",
    label: "Issue summary",
    status: chapterSummary?.trim() ? "ready" : "needs_attention",
    detail: chapterSummary?.trim()
      ? "This issue already has a saved summary for packaging and continuity."
      : "Save or regenerate an issue summary so the package has a compact editorial anchor.",
  });

  const missingCoreOutputs = CORE_PACKAGE_OUTPUTS.filter(
    (outputType) => !outputMap.get(outputType)?.content.trim()
  );
  checks.push({
    key: "package",
    label: "Core package assets",
    status: missingCoreOutputs.length === 0 ? "ready" : "missing",
    detail:
      missingCoreOutputs.length === 0
        ? "Subject lines, deck, hooks, and CTA variants are all saved."
        : `Still missing ${missingCoreOutputs
            .map((outputType) => getAdaptationPreset(outputType).label)
            .join(", ")}.`,
    recommendedOutputType: missingCoreOutputs[0],
  });

  checks.push({
    key: "selection",
    label: "Canonical package",
    status: bundle.missingSelections.length === 0 ? "ready" : "needs_attention",
    detail:
      bundle.missingSelections.length === 0
        ? "The official subject line, deck, hook, CTA, and section package are selected."
        : `Still choose: ${bundle.missingSelections
            .map((field) => NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[field])
            .join(", ")}.`,
    recommendedOutputType: bundle.missingSelections[0]
      ? NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_TO_OUTPUT_TYPE[
          bundle.missingSelections[0]
        ]
      : undefined,
  });

  const framingCheck = buildCanonicalFramingCheck(
    packageSelection,
    chapterSummary,
    chapterContent
  );
  if (framingCheck) {
    checks.push(framingCheck);
  }

  const hookCheck = buildCanonicalHookCheck(packageSelection, chapterContent);
  if (hookCheck) {
    checks.push(hookCheck);
  }

  const recurringSections = modeConfig.recurringSections ?? [];
  const sectionPackage =
    packageSelection?.sectionPackage?.trim()
    || outputMap.get("issue_section_package")?.content.trim();
  const chapterContentLower = chapterContent.toLowerCase();
  const sectionLabels = getCanonicalSectionLabels(
    recurringSections,
    sectionPackage ?? ""
  );
  const bodyMissingSections = sectionLabels.filter(
    (section) => !chapterContentLower.includes(section.toLowerCase())
  );
  checks.push({
    key: "sections",
    label: "Recurring sections",
    status:
      recurringSections.length === 0
        ? "missing"
        : !sectionPackage
          ? "missing"
          : bodyMissingSections.length === 0
            ? "ready"
            : "needs_attention",
    detail:
      recurringSections.length === 0
        ? "Add named recurring sections before packaging the issue."
        : !sectionPackage
          ? "Choose or save the official recurring section package so the issue has a canonical section structure."
          : bodyMissingSections.length === 0
            ? "The official recurring sections are visibly present in the issue body."
            : `The issue body does not yet visibly honor the official recurring section package: ${bodyMissingSections.join(", ")}.`,
    recommendedOutputType:
      recurringSections.length > 0 && (!sectionPackage || bodyMissingSections.length > 0)
        ? "issue_section_package"
        : undefined,
  });

  const ctaCheck = buildCanonicalCtaCheck(packageSelection, chapterContent);
  if (ctaCheck) {
    checks.push(ctaCheck);
  }

  const sendChecklist = outputMap.get("issue_send_checklist")?.content.trim();
  checks.push({
    key: "checklist",
    label: "Send checklist",
    status: sendChecklist ? "ready" : "missing",
    detail: sendChecklist
      ? "A saved preflight review exists for this issue."
      : "Generate the send checklist before final export so the issue has one last readiness pass.",
    recommendedOutputType: sendChecklist ? undefined : "issue_send_checklist",
  });

  checks.push({
    key: "bundle",
    label: "Bundle export",
    status:
      bundle.missingOutputs.length === 0
      && bundle.missingSelections.length === 0
        ? "ready"
        : "needs_attention",
    detail:
      bundle.missingOutputs.length === 0
      && bundle.missingSelections.length === 0
        ? "The issue bundle is fully populated and ready to copy or download."
        : `Bundle export already works, but it will ship with placeholders for ${describeBundleGaps(
            bundle.missingOutputs,
            bundle.missingSelections
          )}.`,
    recommendedOutputType:
      bundle.missingOutputs[0]
      ?? (
        bundle.missingSelections[0]
          ? NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_TO_OUTPUT_TYPE[
              bundle.missingSelections[0]
            ]
          : undefined
      ),
  });

  const overallStatus = deriveOverallStatus(checks);
  const blockerCount = checks.filter((check) => check.status === "missing").length;
  const attentionCount = checks.filter(
    (check) => check.status === "needs_attention"
  ).length;
  const nextRecommendedOutputType =
    checks.find(
      (check) =>
        check.status === "missing" && check.recommendedOutputType !== undefined
    )?.recommendedOutputType
    ?? checks.find(
      (check) =>
        check.status === "needs_attention"
        && check.recommendedOutputType !== undefined
    )?.recommendedOutputType;

  return {
    status: overallStatus,
    readyCount: checks.filter((check) => check.status === "ready").length,
    attentionCount,
    blockerCount,
    totalCount: checks.length,
    missingOutputs: bundle.missingOutputs,
    bundleFilename: bundle.filename,
    nextRecommendedOutputType,
    checks,
  };
}

function describeBundleGaps(
  missingOutputs: AdaptationOutputType[],
  missingSelections: Array<keyof NewsletterIssuePackageSelectionValues>
): string {
  const parts: string[] = [];

  if (missingOutputs.length > 0) {
    parts.push(
      missingOutputs
        .map((outputType) => getAdaptationPreset(outputType).label)
        .join(", ")
    );
  }

  if (missingSelections.length > 0) {
    parts.push(
      missingSelections
        .map((field) => NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[field])
        .join(", ")
    );
  }

  return parts.join(", ");
}

function buildCanonicalFramingCheck(
  packageSelection: NewsletterIssuePackageSelectionValues | null | undefined,
  chapterSummary: string | null | undefined,
  chapterContent: string
): NewsletterIssueReadinessCheck | null {
  const framing = [packageSelection?.subjectLine, packageSelection?.deck]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  if (!framing) {
    return null;
  }

  const comparisonText = chapterSummary?.trim() || extractOpeningExcerpt(chapterContent);
  const alignment = measureTextAlignment(framing, comparisonText);
  const aligned = alignment.sharedTerms.length >= 2 || alignment.score >= 0.18;

  return {
    key: "framing",
    label: "Canonical framing",
    status: aligned ? "ready" : "needs_attention",
    detail: aligned
      ? "The official subject line and deck still match the issue's actual framing."
      : `The official subject line or deck is drifting from the issue body. Shared language is thin${formatSharedTerms(
          alignment.sharedTerms
        )}.`,
    recommendedOutputType:
      packageSelection?.subjectLine?.trim() && !packageSelection?.deck?.trim()
        ? "issue_deck"
        : "issue_subject_line",
  };
}

function buildCanonicalHookCheck(
  packageSelection: NewsletterIssuePackageSelectionValues | null | undefined,
  chapterContent: string
): NewsletterIssueReadinessCheck | null {
  const hook = packageSelection?.hook?.trim();
  if (!hook) {
    return null;
  }

  const openingExcerpt = extractOpeningExcerpt(chapterContent);
  const alignment = measureTextAlignment(hook, openingExcerpt);
  const aligned = alignment.sharedTerms.length >= 2 || alignment.score >= 0.2;

  return {
    key: "hook",
    label: "Official hook alignment",
    status: aligned ? "ready" : "needs_attention",
    detail: aligned
      ? "The issue opening still honors the official hook you chose."
      : `The current opening no longer strongly matches the official hook${formatSharedTerms(
          alignment.sharedTerms
        )}.`,
    recommendedOutputType: "issue_hook_variants",
  };
}

function buildCanonicalCtaCheck(
  packageSelection: NewsletterIssuePackageSelectionValues | null | undefined,
  chapterContent: string
): NewsletterIssueReadinessCheck | null {
  const cta = packageSelection?.cta?.trim();
  if (!cta) {
    return null;
  }

  const closingExcerpt = extractClosingExcerpt(chapterContent);
  const alignment = measureTextAlignment(cta, closingExcerpt);
  const ctaAsksQuestion = cta.includes("?");
  const closingAsksQuestion = closingExcerpt.includes("?");
  const aligned =
    alignment.sharedTerms.length >= 2
    || alignment.score >= 0.2
    || (
      ctaAsksQuestion
      && closingAsksQuestion
      && (
        alignment.sharedTerms.length >= 1
        || alignment.score >= 0.12
      )
    );

  return {
    key: "cta",
    label: "Official CTA alignment",
    status: aligned ? "ready" : "needs_attention",
    detail: aligned
      ? "The issue close still supports the official CTA you chose."
      : ctaAsksQuestion && !closingAsksQuestion
        ? "The official CTA ends with a pointed reader question, but the issue close no longer does."
        : `The current close no longer strongly matches the official CTA${formatSharedTerms(
            alignment.sharedTerms
          )}.`,
    recommendedOutputType: "issue_cta_variants",
  };
}

function extractOpeningExcerpt(content: string): string {
  const paragraphs = splitIntoParagraphs(content);
  return paragraphs.slice(0, 2).join("\n\n");
}

function extractClosingExcerpt(content: string): string {
  const paragraphs = splitIntoParagraphs(content);
  return paragraphs.slice(-2).join("\n\n");
}

function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getCanonicalSectionLabels(
  recurringSections: string[],
  sectionPackage: string
): string[] {
  const labels = sectionPackage
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.replace(/^#{1,6}\s+/, "").trim())
    .filter(Boolean);

  if (labels.length > 0) {
    return labels;
  }

  return recurringSections
    .map((section) => section.trim())
    .filter(Boolean);
}

function measureTextAlignment(source: string, target: string) {
  const sourceTokens = fingerprintTokens(source);
  const targetTokens = new Set(fingerprintTokens(target));
  const sharedTerms = sourceTokens.filter((token) => targetTokens.has(token));
  const score =
    sourceTokens.length === 0 ? 0 : sharedTerms.length / sourceTokens.length;

  return {
    sharedTerms,
    score,
  };
}

function fingerprintTokens(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/['\u2019]/g, "")
        .split(/[^a-z0-9]+/)
        .map((token) => normalizeToken(token))
        .filter((token) => token.length >= 3 && !NEWSLETTER_STOPWORDS.has(token))
    )
  );
}

function normalizeToken(token: string) {
  let value = token.trim();

  for (const suffix of [
    "worthy",
    "ation",
    "ments",
    "ment",
    "ness",
    "ingly",
    "edly",
    "ingly",
    "ing",
    "edly",
    "edly",
    "ers",
    "ies",
    "ied",
    "ed",
    "ly",
    "es",
    "s",
  ]) {
    if (value.length > suffix.length + 2 && value.endsWith(suffix)) {
      value = `${value.slice(0, -suffix.length)}${suffix === "ies" ? "y" : ""}`;
      break;
    }
  }

  return value.length > 6 ? value.slice(0, 6) : value;
}

function formatSharedTerms(sharedTerms: string[]) {
  if (sharedTerms.length === 0) {
    return "";
  }

  return ` (shared language: ${sharedTerms.slice(0, 4).join(", ")})`;
}

const NEWSLETTER_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "before",
  "being",
  "build",
  "close",
  "creat",
  "every",
  "first",
  "from",
  "have",
  "into",
  "more",
  "most",
  "need",
  "next",
  "over",
  "reader",
  "seri",
  "still",
  "that",
  "their",
  "them",
  "then",
  "this",
  "through",
  "with",
  "your",
]);

function deriveOverallStatus(
  checks: NewsletterIssueReadinessCheck[]
): NewsletterIssueReadinessStatus {
  if (checks.some((check) => check.status === "missing")) {
    return "missing";
  }

  if (checks.some((check) => check.status === "needs_attention")) {
    return "needs_attention";
  }

  return "ready";
}
