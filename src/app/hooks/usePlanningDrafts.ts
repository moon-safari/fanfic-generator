import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PlanningArtifact,
  PlanningArtifactContent,
} from "../types/artifact";

interface UsePlanningDraftsOptions {
  savePlanningArtifact: (
    artifact: PlanningArtifact,
    rawContent: PlanningArtifactContent
  ) => Promise<PlanningArtifact>;
  onSaved?: (savedArtifact: PlanningArtifact) => void;
}

export function usePlanningDrafts({
  savePlanningArtifact,
  onSaved,
}: UsePlanningDraftsOptions) {
  const [planningDrafts, setPlanningDrafts] = useState<
    Partial<Record<PlanningArtifact["sectionType"], PlanningArtifactContent>>
  >({});
  const [savingSections, setSavingSections] = useState<
    PlanningArtifact["sectionType"][]
  >([]);
  const saveTimersRef = useRef<
    Partial<Record<PlanningArtifact["sectionType"], ReturnType<typeof setTimeout>>>
  >({});

  const updateSavingState = useCallback(
    (sectionType: PlanningArtifact["sectionType"], saving: boolean) => {
      setSavingSections((prev) => {
        if (saving) {
          return prev.includes(sectionType) ? prev : [...prev, sectionType];
        }
        return prev.filter((item) => item !== sectionType);
      });
    },
    []
  );

  const handlePlanningChange = useCallback(
    (
      selectedArtifact: PlanningArtifact | null,
      nextContent: PlanningArtifactContent
    ) => {
      if (!selectedArtifact) {
        return;
      }

      const artifact = selectedArtifact;
      setPlanningDrafts((prev) => ({
        ...prev,
        [artifact.sectionType]: nextContent,
      }));

      const existingTimer = saveTimersRef.current[artifact.sectionType];
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      saveTimersRef.current[artifact.sectionType] = setTimeout(() => {
        updateSavingState(artifact.sectionType, true);
        void savePlanningArtifact(artifact, nextContent)
          .then((savedArtifact) => {
            onSaved?.(savedArtifact);
            setPlanningDrafts((prev) => ({
              ...prev,
              [savedArtifact.sectionType]: savedArtifact.rawContent,
            }));
          })
          .catch(() => {
            // Hook already surfaces the error state.
          })
          .finally(() => {
            updateSavingState(artifact.sectionType, false);
          });
      }, 700);
    },
    [savePlanningArtifact, onSaved, updateSavingState]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      for (const timer of Object.values(timers)) {
        if (timer) {
          clearTimeout(timer);
        }
      }
    };
  }, []);

  return {
    planningDrafts,
    savingSections,
    handlePlanningChange,
  };
}
