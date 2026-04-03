"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getErrorMessage,
  requestJson,
  requestJsonWithTimeout,
} from "../lib/request";
import type { CodexChangeSuggestion } from "../types/codex";

export function useCodexSuggestions(storyId: string, refreshKey = 0) {
  const [suggestions, setSuggestions] = useState<CodexChangeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson<{ suggestions: CodexChangeSuggestion[] }>(
        `/api/codex/${storyId}/suggestions`
      );
      setSuggestions(sortSuggestions(data.suggestions ?? []));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load Codex suggestions"));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions, refreshKey]);

  const generateSuggestions = useCallback(
    async (chapterId: string): Promise<CodexChangeSuggestion[]> => {
      setDetecting(true);
      try {
        const data = await requestJsonWithTimeout<{
          suggestions: CodexChangeSuggestion[];
        }>(
          "/api/codex/suggestions/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storyId, chapterId }),
          },
          30000,
          "Codex change detection timed out. Try again in a moment."
        );

        await fetchSuggestions();
        setError(null);
        return sortSuggestions(data.suggestions ?? []);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to detect Codex changes");
        setError(message);
        throw new Error(message);
      } finally {
        setDetecting(false);
      }
    },
    [fetchSuggestions, storyId]
  );

  const acceptSuggestion = useCallback(
    async (suggestionId: string): Promise<CodexChangeSuggestion> => {
      setProcessingId(suggestionId);
      try {
        const data = await requestJson<{ suggestion: CodexChangeSuggestion }>(
          `/api/codex/suggestions/${suggestionId}/accept`,
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
    async (suggestionId: string): Promise<CodexChangeSuggestion> => {
      setProcessingId(suggestionId);
      try {
        const data = await requestJson<{ suggestion: CodexChangeSuggestion }>(
          `/api/codex/suggestions/${suggestionId}/reject`,
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
  suggestions: CodexChangeSuggestion[]
): CodexChangeSuggestion[] {
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
