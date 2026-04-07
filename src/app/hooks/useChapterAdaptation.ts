"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getErrorMessage,
  requestJson,
  requestJsonWithTimeout,
} from "../lib/request";
import { getProjectUnitLabel } from "../lib/projectMode";
import {
  getDefaultAdaptationChainId as getDefaultChainId,
  getDefaultAdaptationOutputType as getDefaultOutputType,
  getSelectableAdaptationOutputTypes,
  isAdaptationChainIdEnabled as isChainIdEnabled,
} from "../lib/adaptations";
import type {
  AdaptationChainId,
  AdaptationChainResult,
  AdaptationOutputType,
  ChapterAdaptationResult,
} from "../types/adaptation";
import type { ProjectMode, StoryModeConfig } from "../types/story";

type AdaptationResultMap = Partial<
  Record<AdaptationOutputType, ChapterAdaptationResult>
>;

export function useChapterAdaptation(
  storyId: string,
  projectMode: ProjectMode,
  modeConfig?: StoryModeConfig,
  chapterId?: string
) {
  const unitLabel = getProjectUnitLabel(projectMode);
  const [activeOutputType, setActiveOutputType] =
    useState<AdaptationOutputType>(() =>
      getDefaultOutputType(projectMode, modeConfig)
    );
  const [selectedChainId, setSelectedChainId] =
    useState<AdaptationChainId>(() => getDefaultChainId(projectMode));
  const [resultsByType, setResultsByType] = useState<AdaptationResultMap>({});
  const [loadingOutputType, setLoadingOutputType] =
    useState<AdaptationOutputType | null>(null);
  const [deletingOutputType, setDeletingOutputType] =
    useState<AdaptationOutputType | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectableOutputTypes = useMemo(
    () =>
      getSelectableAdaptationOutputTypes({
        projectMode,
        modeConfig,
        selectedChainId,
        savedOutputTypes: Object.keys(resultsByType) as AdaptationOutputType[],
      }),
    [modeConfig, projectMode, resultsByType, selectedChainId]
  );

  useEffect(() => {
    if (!selectableOutputTypes.includes(activeOutputType)) {
      setActiveOutputType(getDefaultOutputType(projectMode, modeConfig));
    }

    if (!isChainIdEnabled(selectedChainId, projectMode)) {
      setSelectedChainId(getDefaultChainId(projectMode));
    }
  }, [
    activeOutputType,
    modeConfig,
    projectMode,
    selectableOutputTypes,
    selectedChainId,
  ]);

  useEffect(() => {
    setResultsByType({});
    setError(null);
    setLoadingOutputType(null);
    setDeletingOutputType(null);
    setChainLoading(false);

    if (!chapterId) {
      return;
    }

    let cancelled = false;

    const loadSavedOutputs = async () => {
      try {
        const data = await requestJson<{ results: ChapterAdaptationResult[] }>(
          `/api/adapt/${storyId}/outputs?chapterId=${chapterId}`
        );

        if (cancelled) {
          return;
        }

        const nextResultsByType = (data.results ?? []).reduce<AdaptationResultMap>(
          (accumulator, result) => {
            accumulator[result.outputType] = result;
            return accumulator;
          },
          {}
        );

        setResultsByType(nextResultsByType);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(getErrorMessage(err, "Failed to load saved adaptations"));
      }
    };

    void loadSavedOutputs();

    return () => {
      cancelled = true;
    };
  }, [chapterId, storyId]);

  const generate = useCallback(
    async (outputType: AdaptationOutputType): Promise<ChapterAdaptationResult> => {
      if (!chapterId) {
        throw new Error(`Save the ${unitLabel} before adapting it.`);
      }

      setActiveOutputType(outputType);
      setLoadingOutputType(outputType);

      try {
        const data = await requestJsonWithTimeout<{
          result: ChapterAdaptationResult;
        }>(
          "/api/adapt/chapter",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyId,
              chapterId,
              outputType,
            }),
          },
          45000,
          "Adaptation timed out. Try again in a moment."
        );

        setResultsByType((prev) => ({
          ...prev,
          [outputType]: data.result,
        }));
        setError(null);
        return data.result;
      } catch (err) {
        const message = getErrorMessage(err, `Failed to adapt ${unitLabel}`);
        setError(message);
        throw new Error(message);
      } finally {
        setLoadingOutputType(null);
      }
    },
    [chapterId, storyId, unitLabel]
  );

  const generateChain = useCallback(async (): Promise<AdaptationChainResult> => {
    if (!chapterId) {
      throw new Error(`Save the ${unitLabel} before running the workflow chain.`);
    }

    setChainLoading(true);

    try {
      const data = await requestJsonWithTimeout<AdaptationChainResult>(
        "/api/adapt/chain",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId,
            chapterId,
            chainId: selectedChainId,
          }),
        },
        60000,
        "Workflow chain timed out. Try again in a moment."
      );

      setResultsByType((prev) => {
        const next = { ...prev };
        for (const result of data.results) {
          next[result.outputType] = result;
        }
        return next;
      });
      const finalResult = data.results[data.results.length - 1];
      if (finalResult) {
        setActiveOutputType(finalResult.outputType);
      }
      setError(null);
      return data;
    } catch (err) {
      const message = getErrorMessage(err, "Failed to run workflow chain");
      setError(message);
      throw new Error(message);
    } finally {
      setChainLoading(false);
    }
  }, [chapterId, selectedChainId, storyId, unitLabel]);

  const deleteOutput = useCallback(
    async (outputType: AdaptationOutputType): Promise<void> => {
      if (!chapterId) {
        throw new Error(`Save the ${unitLabel} before deleting an adaptation.`);
      }

      setDeletingOutputType(outputType);

      try {
        await requestJson<{ success: boolean }>(
          `/api/adapt/${storyId}/outputs/${outputType}?chapterId=${chapterId}`,
          {
            method: "DELETE",
          }
        );

        let nextActiveOutputType: AdaptationOutputType | null = null;

        setResultsByType((prev) => {
          const next = { ...prev };
          delete next[outputType];

          nextActiveOutputType = (
            Object.keys(next) as AdaptationOutputType[]
          )[0] ?? null;

          return next;
        });

        if (activeOutputType === outputType) {
          if (nextActiveOutputType) {
            setActiveOutputType(nextActiveOutputType);
          }
        }

        setError(null);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to delete adaptation");
        setError(message);
        throw new Error(message);
      } finally {
        setDeletingOutputType(null);
      }
    },
    [activeOutputType, chapterId, storyId, unitLabel]
  );

  const currentResult = useMemo(
    () => resultsByType[activeOutputType] ?? null,
    [activeOutputType, resultsByType]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    activeOutputType,
    setActiveOutputType,
    selectedChainId,
    setSelectedChainId,
    resultsByType,
    currentResult,
    loadingOutputType,
    deletingOutputType,
    chainLoading,
    error,
    generate,
    generateChain,
    deleteOutput,
    clearError,
  };
}
