"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "../lib/request";
import type { CodexMention } from "../types/codex";

interface UseCodexMentionsOptions {
  storyId: string;
  chapterId?: string;
  entryId?: string;
  refreshKey?: number;
  enabled?: boolean;
}

export function useCodexMentions({
  storyId,
  chapterId,
  entryId,
  refreshKey = 0,
  enabled = true,
}: UseCodexMentionsOptions) {
  const [mentions, setMentions] = useState<CodexMention[]>([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMentions = useCallback(async () => {
    if (!enabled) {
      setMentions([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (chapterId) {
        searchParams.set("chapterId", chapterId);
      }
      if (entryId) {
        searchParams.set("entryId", entryId);
      }

      const data = await requestJson<{ mentions: CodexMention[] }>(
        `/api/codex/${storyId}/mentions${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`
      );
      const nextMentions = data.mentions ?? [];
      setMentions(nextMentions);
      setError(null);
      return nextMentions;
    } catch (err) {
      const message = getErrorMessage(err, "Failed to load Codex mentions");
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [chapterId, enabled, entryId, storyId]);

  useEffect(() => {
    void fetchMentions().catch(() => {});
  }, [fetchMentions, refreshKey]);

  const generateMentions = useCallback(
    async (targetChapterId: string): Promise<CodexMention[]> => {
      setSyncing(true);
      try {
        const data = await requestJson<{ mentions: CodexMention[] }>(
          "/api/codex/mentions/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyId,
              chapterId: targetChapterId,
            }),
          }
        );

        if (!chapterId || chapterId === targetChapterId) {
          setMentions(data.mentions ?? []);
        } else {
          await fetchMentions();
        }

        setError(null);
        return data.mentions ?? [];
      } catch (err) {
        const message = getErrorMessage(err, "Failed to sync Codex mentions");
        setError(message);
        throw new Error(message);
      } finally {
        setSyncing(false);
      }
    },
    [chapterId, fetchMentions, storyId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    mentions,
    loading,
    syncing,
    error,
    fetchMentions,
    generateMentions,
    clearError,
  };
}
