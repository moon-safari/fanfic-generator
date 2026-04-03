"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage, requestJson } from "../lib/request";
import type { AdaptationOutputType } from "../types/adaptation";
import type { BibleSection } from "../types/bible";
import type {
  PlanningArtifact,
  PlanningArtifactContent,
  ProjectArtifact,
} from "../types/artifact";
import type { ProjectMode } from "../types/story";
import { toPlanningArtifact } from "../lib/artifacts";

export function useArtifacts(storyId: string, projectMode: ProjectMode) {
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingArtifactId, setDeletingArtifactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadArtifacts = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await requestJson<{ artifacts: ProjectArtifact[] }>(
          `/api/artifacts/${storyId}`
        );
        setArtifacts(data.artifacts ?? []);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load project artifacts"));
      } finally {
        if (mode === "initial") {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [storyId]
  );

  useEffect(() => {
    void loadArtifacts("initial");
  }, [loadArtifacts]);

  const deleteArtifact = useCallback(
    async (artifact: ProjectArtifact) => {
      if (artifact.kind !== "adaptation") {
        throw new Error("Unsupported artifact kind");
      }

      setDeletingArtifactId(artifact.id);

      try {
        await requestJson<{ success: boolean }>(
          `/api/adapt/${artifact.storyId}/outputs/${artifact.subtype}?chapterId=${artifact.chapterId}`,
          {
            method: "DELETE",
          }
        );

        setArtifacts((prev) => prev.filter((item) => item.id !== artifact.id));
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to delete artifact");
        setError(message);
        throw new Error(message);
      } finally {
        setDeletingArtifactId(null);
      }
    },
    []
  );

  const artifactTypes = useMemo(
    () =>
      Array.from(new Set(artifacts.map((artifact) => artifact.subtype))).sort(),
    [artifacts]
  );
  const chapterNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          artifacts
            .filter(
              (artifact): artifact is Extract<ProjectArtifact, { kind: "adaptation" }> =>
                artifact.kind === "adaptation"
            )
            .map((artifact) => artifact.chapterNumber)
        )
      ).sort((a, b) => b - a),
    [artifacts]
  );

  const savePlanningArtifact = useCallback(
    async (
      artifact: PlanningArtifact,
      rawContent: PlanningArtifactContent
    ): Promise<PlanningArtifact> => {
      const data = await requestJson<{ section: BibleSection }>(
        `/api/story-bible/${artifact.storyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType: artifact.sectionType,
            content: rawContent,
          }),
        }
      );

      const nextArtifact = toPlanningArtifact(
        artifact.storyId,
        data.section,
        artifact.sectionType,
        projectMode
      );

      setArtifacts((prev) =>
        prev.map((item) =>
          item.kind === "planning" && item.sectionType === artifact.sectionType
            ? nextArtifact
            : item
        )
      );
      setError(null);

      return nextArtifact;
    },
    [projectMode]
  );

  return {
    artifacts,
    artifactTypes: artifactTypes as AdaptationOutputType[],
    chapterNumbers,
    loading,
    refreshing,
    deletingArtifactId,
    error,
    refresh: () => loadArtifacts("refresh"),
    deleteArtifact,
    savePlanningArtifact,
    clearError: () => setError(null),
  };
}
