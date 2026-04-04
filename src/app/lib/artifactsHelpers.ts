"use client";

import { useEffect, useState } from "react";
import { getArtifactSubtypeLabel } from "./artifacts";
import { getProjectUnitLabel } from "./projectMode";
import { getErrorMessage } from "./request";
import type { AdaptationOutputType } from "../types/adaptation";
import type {
  ProjectArtifact,
} from "../types/artifact";
import type {
  NewsletterIssuePackageSelectionField,
  NewsletterIssueReadinessCheck,
  NewsletterIssueReadinessReport,
  NewsletterIssueReadinessStatus,
} from "../types/newsletter";
import type { ProjectMode } from "../types/story";

// ---------------------------------------------------------------------------
// Type aliases & interfaces
// ---------------------------------------------------------------------------

export type ScopeFilter = "all" | "project" | "current" | number;

export interface FilterOption<T extends string | number> {
  key: T;
  label: string;
}

export interface ScopeOption extends FilterOption<ScopeFilter> {
  count: number;
}

export interface ReadinessGroupSummary {
  key: "setup" | "official_package" | "final_send";
  label: string;
  status: NewsletterIssueReadinessStatus;
  detail: string;
  recommendedOutputType?: AdaptationOutputType;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const READINESS_GROUPS: Array<{
  key: ReadinessGroupSummary["key"];
  label: string;
  readyDetail: string;
  keys: NewsletterIssueReadinessCheck["key"][];
}> = [
  {
    key: "setup",
    label: "Setup",
    readyDetail: "Publication profile and issue summary are in place.",
    keys: ["profile", "summary"],
  },
  {
    key: "official_package",
    label: "Official package",
    readyDetail: "The official framing, hook, CTA, and section package are aligned.",
    keys: ["package", "selection", "framing", "hook", "sections", "cta"],
  },
  {
    key: "final_send",
    label: "Final send",
    readyDetail: "The send checklist and export bundle are ready.",
    keys: ["checklist", "bundle"],
  },
];

// ---------------------------------------------------------------------------
// Pure utility functions
// ---------------------------------------------------------------------------

export function getNewsletterSelectionFieldForOutputType(
  outputType: AdaptationOutputType
): NewsletterIssuePackageSelectionField | null {
  switch (outputType) {
    case "issue_subject_line":
      return "subjectLine";
    case "issue_deck":
      return "deck";
    case "issue_hook_variants":
      return "hook";
    case "issue_cta_variants":
      return "cta";
    case "issue_section_package":
      return "sectionPackage";
    default:
      return null;
  }
}

export function parseNumberedOptions(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) {
    return [];
  }

  const optionBlocks = trimmed
    .split(/\n+(?=\d+\.\s+)/)
    .map((block) => block.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return optionBlocks.length > 0 ? optionBlocks : [trimmed];
}

export function summarizeSelectionValue(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "No official value chosen yet.";
  }

  if (trimmed.length <= 320) {
    return trimmed;
  }

  return `${trimmed.slice(0, 317)}...`;
}

export function formatArtifactListMeta(
  artifact: ProjectArtifact,
  unitLabelAbbreviated: string
) {
  return [
    labelArtifactKind(artifact.kind),
    getArtifactSubtypeLabel(artifact.subtype),
    artifact.kind === "adaptation"
      ? `${unitLabelAbbreviated} ${artifact.chapterNumber}`
      : artifact.persisted
        ? "Saved"
        : "Draft",
  ].join(" | ");
}

export function labelContextSource(contextSource: ProjectArtifact["contextSource"]) {
  switch (contextSource) {
    case "codex":
      return "Using memory context";
    case "story_bible":
      return "Using plan context";
    default:
      return "Using current draft only";
  }
}

export function labelArtifactKind(kind: ProjectArtifact["kind"]) {
  return kind === "adaptation" ? "Output" : "Plan";
}

export function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function getReadinessStatusLabel(
  status: NewsletterIssueReadinessStatus
): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "needs_attention":
      return "Needs attention";
    case "missing":
      return "Missing pieces";
    default:
      return status;
  }
}

export function getReadinessStatusClasses(
  status: NewsletterIssueReadinessStatus
): string {
  switch (status) {
    case "ready":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "needs_attention":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "missing":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

export function getReadinessErrorMessage(error: unknown): string {
  const message = getErrorMessage(error, "");

  if (!message || message === "Failed to fetch") {
    return "The check could not talk to the server. Refresh the page and try again.";
  }

  if (message.startsWith("Request failed with status 5")) {
    return "The check hit a temporary server problem. Try again.";
  }

  return message;
}

export function buildReadinessGroups(
  report: NewsletterIssueReadinessReport | null
): ReadinessGroupSummary[] {
  if (!report) {
    return [];
  }

  return READINESS_GROUPS.map((group) => {
    const checks = report.checks.filter((check) => group.keys.includes(check.key));
    const nonReadyChecks = checks.filter((check) => check.status !== "ready");
    const recommendedOutputType =
      nonReadyChecks.find(
        (check) =>
          check.status === "missing" && check.recommendedOutputType !== undefined
      )?.recommendedOutputType
      ?? nonReadyChecks.find((check) => check.recommendedOutputType !== undefined)
        ?.recommendedOutputType;

    if (checks.length === 0) {
      return {
        key: group.key,
        label: group.label,
        status: "ready" as NewsletterIssueReadinessStatus,
        detail: group.readyDetail,
        recommendedOutputType,
      };
    }

    return {
      key: group.key,
      label: group.label,
      status: getAggregateReadinessStatus(checks),
      detail:
        nonReadyChecks.length === 0
          ? group.readyDetail
          : `Still to review: ${nonReadyChecks
              .map((check) => check.label.toLowerCase())
              .join(", ")}.`,
      recommendedOutputType,
    };
  });
}

export function getAggregateReadinessStatus(
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

export function formatScopeLabel(
  scope: ScopeFilter,
  currentChapter: number,
  projectMode: ProjectMode
) {
  const unitLabel = getProjectUnitLabel(projectMode);
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const unitLabelAbbreviated = getProjectUnitLabel(projectMode, {
    abbreviated: true,
  });

  if (scope === "all") {
    return "All scopes";
  }

  if (scope === "project") {
    return "Project-wide";
  }

  if (scope === "current") {
    return `Current ${unitLabel} (${unitLabelAbbreviated} ${currentChapter})`;
  }

  return `${unitLabelCapitalized} ${scope}`;
}

// ---------------------------------------------------------------------------
// DOM hooks (general-purpose, not ArtifactsTab-specific)
// ---------------------------------------------------------------------------

export function useMinWidth(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const update = (event?: MediaQueryListEvent) => {
      setMatches(event ? event.matches : mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, [query]);

  return matches;
}

export function useElementSize<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
