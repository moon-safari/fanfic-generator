"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getErrorMessage,
  requestJson,
  requestJsonWithTimeout,
} from "../lib/request";
import type { MemoryChangeSuggestion } from "../types/memory";

export function useMemorySuggestions(storyId: string, refreshKey = 0) {
  const [suggestions, setSuggestions] = useState<MemoryChangeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson<{ suggestions: MemoryChangeSuggestion[] }>(
        `/api/memory/${storyId}/suggestions`
      );
      setSuggestions(sortSuggestions(data.suggestions ?? []));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load Memory suggestions"));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions, refreshKey]);

  const generateSuggestions = useCallback(
    async (chapterId: string): Promise<MemoryChangeSuggestion[]> => {
      setDetecting(true);
      try {
        const data = await requestJsonWithTimeout<{
          suggestions: MemoryChangeSuggestion[];
        }>(
          "/api/memory/suggestions/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storyId, chapterId }),
          },
          30000,
          "Memory change detection timed out. Try again in a moment."
        );

        await fetchSuggestions();
        setError(null);
        return sortSuggestions(data.suggestions ?? []);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to detect Memory changes");
        setError(message);
        throw new Error(message);
      } finally {
        setDetecting(false);
      }
    },
    [fetchSuggestions, storyId]
  );

  const acceptSuggestion = useCallback(
    async (suggestionId: string): Promise<MemoryChangeSuggestion> => {
      setProcessingId(suggestionId);
      try {
        const data = await requestJson<{ suggestion: MemoryChangeSuggestion }>(
          `/api/memory/suggestions/${suggestionId}/accept`,
          { method: "POST" }
        );

        setSuggestions((prev) =>
          sortSuggestions(
            prev.map((suggestion) =>
              suggestion.id === suggestionId ? data.suggestion : suggestion
            )
          )
        );
        setError(null);
        return data.suggestion;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to accept suggestion");
        setError(message);
        throw new Error(message);
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const rejectSuggestion = useCallback(
    async (suggestionId: string): Promise<MemoryChangeSuggestion> => {
      setProcessingId(suggestionId);
      try {
        const data = await requestJson<{ suggestion: MemoryChangeSuggestion }>(
          `/api/memory/suggestions/${suggestionId}/reject`,
          { method: "POST" }
        );

        setSuggestions((prev) =>
          sortSuggestions(
            prev.map((suggestion) =>
              suggestion.id === suggestionId ? data.suggestion : suggestion
            )
          )
        );
        setError(null);
        return data.suggestion;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to reject suggestion");
        setError(message);
        throw new Error(message);
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    detecting,
    processingId,
    error,
    fetchSuggestions,
    generateSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    clearError,
  };
}

function sortSuggestions(
  suggestions: MemoryChangeSuggestion[]
): MemoryChangeSuggestion[] {
  return [...suggestions].sort((a, b) => {
    const aPending = a.status === "pending" ? 0 : 1;
    const bPending = b.status === "pending" ? 0 : 1;

    if (aPending !== bPending) {
      return aPending - bPending;
    }

    if (a.chapterNumber !== b.chapterNumber) {
      return b.chapterNumber - a.chapterNumber;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}
