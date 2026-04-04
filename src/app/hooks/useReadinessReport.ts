"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { requestJson } from "../lib/request";
import {
  buildReadinessGroups,
  getReadinessErrorMessage,
} from "../lib/artifactsHelpers";
import { getAdaptationPreset } from "../lib/adaptations";
import type { ProjectArtifact } from "../types/artifact";
import type { NewsletterIssueReadinessReport } from "../types/newsletter";
import type { ProjectMode } from "../types/story";

interface UseReadinessReportOptions {
  storyId: string;
  currentChapterId?: string;
  currentChapter: number;
  projectMode: ProjectMode;
  artifacts: ProjectArtifact[];
}

export function useReadinessReport({
  storyId,
  currentChapterId,
  currentChapter,
  projectMode,
  artifacts,
}: UseReadinessReportOptions) {
  const [readinessReport, setReadinessReport] =
    useState<NewsletterIssueReadinessReport | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [readinessRefreshNonce, setReadinessRefreshNonce] = useState(0);
  const [showReadinessDetails, setShowReadinessDetails] = useState(false);

  const newsletterArtifactRefreshToken = useMemo(
    () =>
      artifacts
        .filter(
          (artifact) =>
            artifact.kind === "adaptation"
            && artifact.chapterNumber === currentChapter
        )
        .map((artifact) => `${artifact.id}:${artifact.updatedAt}`)
        .join("|"),
    [artifacts, currentChapter]
  );

  useEffect(() => {
    if (projectMode !== "newsletter" || !currentChapterId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset derived state when chapter/mode conditions are not met
      setReadinessReport(null);
      setReadinessError(null);
      setReadinessLoading(false);
      return;
    }

    let cancelled = false;
    setReadinessLoading(true);
    setReadinessError(null);

    void requestJson<{ report: NewsletterIssueReadinessReport }>(
      `/api/newsletter/${storyId}/preflight?chapterId=${currentChapterId}`
    )
      .then((data) => {
        if (!cancelled) {
          setReadinessReport(data.report);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReadinessError(getReadinessErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReadinessLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentChapterId,
    newsletterArtifactRefreshToken,
    projectMode,
    readinessRefreshNonce,
    storyId,
  ]);

  const visibleReadinessChecks = useMemo(() => {
    if (!readinessReport) {
      return [];
    }

    const nonReadyChecks = readinessReport.checks.filter(
      (check) => check.status !== "ready"
    );

    return nonReadyChecks.length > 0 ? nonReadyChecks : readinessReport.checks;
  }, [readinessReport]);

  const hiddenReadyCheckCount = readinessReport
    ? readinessReport.checks.length - visibleReadinessChecks.length
    : 0;

  const readinessGroups = useMemo(
    () => buildReadinessGroups(readinessReport),
    [readinessReport]
  );

  const nextRecommendedPreset = readinessReport?.nextRecommendedOutputType
    ? getAdaptationPreset(readinessReport.nextRecommendedOutputType)
    : null;

  const refreshReadiness = useCallback(
    () => setReadinessRefreshNonce((prev) => prev + 1),
    []
  );

  const toggleReadinessDetails = useCallback(
    () => setShowReadinessDetails((prev) => !prev),
    []
  );

  return {
    readinessReport,
    readinessLoading,
    readinessError,
    readinessGroups,
    visibleReadinessChecks,
    hiddenReadyCheckCount,
    nextRecommendedPreset,
    showReadinessDetails,
    refreshReadiness,
    toggleReadinessDetails,
  };
}
