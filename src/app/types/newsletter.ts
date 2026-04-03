import type { AdaptationOutputType } from "./adaptation";

export type NewsletterIssueReadinessStatus =
  | "ready"
  | "needs_attention"
  | "missing";

export type NewsletterIssuePackageSelectionField =
  | "subjectLine"
  | "deck"
  | "hook"
  | "cta"
  | "sectionPackage";

export const NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELDS: NewsletterIssuePackageSelectionField[] =
  ["subjectLine", "deck", "hook", "cta", "sectionPackage"];

export interface NewsletterIssuePackageSelectionValues {
  subjectLine: string;
  deck: string;
  hook: string;
  cta: string;
  sectionPackage: string;
}

export interface NewsletterIssuePackageSelection
  extends NewsletterIssuePackageSelectionValues {
  id?: string;
  storyId: string;
  chapterId: string;
  chapterNumber: number;
  updatedAt: string;
  persisted: boolean;
}

export const EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES: NewsletterIssuePackageSelectionValues =
  {
    subjectLine: "",
    deck: "",
    hook: "",
    cta: "",
    sectionPackage: "",
  };

export const NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS: Record<
  NewsletterIssuePackageSelectionField,
  string
> = {
  subjectLine: "Subject line",
  deck: "Deck",
  hook: "Hook",
  cta: "CTA",
  sectionPackage: "Recurring section package",
};

export const NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_TO_OUTPUT_TYPE: Record<
  NewsletterIssuePackageSelectionField,
  AdaptationOutputType
> = {
  subjectLine: "issue_subject_line",
  deck: "issue_deck",
  hook: "issue_hook_variants",
  cta: "issue_cta_variants",
  sectionPackage: "issue_section_package",
};

export interface NewsletterIssueReadinessCheck {
  key:
    | "profile"
    | "summary"
    | "package"
    | "selection"
    | "framing"
    | "hook"
    | "sections"
    | "cta"
    | "checklist"
    | "bundle";
  label: string;
  status: NewsletterIssueReadinessStatus;
  detail: string;
  recommendedOutputType?: AdaptationOutputType;
}

export interface NewsletterIssueReadinessReport {
  status: NewsletterIssueReadinessStatus;
  readyCount: number;
  attentionCount: number;
  blockerCount: number;
  totalCount: number;
  missingOutputs: AdaptationOutputType[];
  bundleFilename: string;
  nextRecommendedOutputType?: AdaptationOutputType;
  checks: NewsletterIssueReadinessCheck[];
}
