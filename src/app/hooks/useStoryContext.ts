"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "../lib/request";
import type {
  CodexContextMode,
  CodexContextRule,
  StoryContextSnapshot,
} from "../types/codex";

const EMPTY_CONTEXT: StoryContextSnapshot = {
  source: "none",
  resolvedThroughChapter: 1,
  generationChapter: 2,
  text: "",
  entryCount: 0,
  includedEntryCount: 0,
  priorityEntryCount: 0,
  pinnedEntryCount: 0,
  excludedEntryCount: 0,
  relationshipCount: 0,
  focusEntries: [],
  groups: [],
};

export function useStoryContext(
  storyId: string,
  chapterNumber: number,
  refreshKey = 0
) {
  const [context, setContext] = useState<StoryContextSnapshot>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await requestJson<{ context: StoryContextSnapshot }>(
          `/api/codex/${storyId}/context?chapterNumber=${chapterNumber}`
        );
        setContext(data.context ?? EMPTY_CONTEXT);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load story context"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [chapterNumber, storyId]
  );

  useEffect(() => {
    void fetchContext("initial");
  }, [fetchContext, refreshKey]);

  return {
    context,
    loading,
    refreshing,
    updatingEntryId,
    error,
    refresh: async () => {
      await fetchContext("refresh");
    },
    setEntryMode: async (
      entryId: string,
      mode: CodexContextMode
    ): Promise<CodexContextRule | null> => {
      setUpdatingEntryId(entryId);
      try {
        const data = await requestJson<{ rule: CodexContextRule | null }>(
          `/api/codex/${storyId}/context-rules/${entryId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode }),
          }
        );
        setError(null);
        await fetchContext("refresh");
        return data.rule ?? null;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update story context");
        setError(message);
        throw new Error(message);
      } finally {
        setUpdatingEntryId(null);
      }
    },
  };
}
