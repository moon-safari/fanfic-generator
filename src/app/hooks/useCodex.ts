"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "../lib/request";
import type {
  Codex,
  CodexCustomType,
  CodexEntry,
  CodexProgression,
  CodexRelationship,
  CreateCodexCustomTypeInput,
  CreateCodexEntryInput,
  CreateCodexProgressionInput,
  CreateCodexRelationshipInput,
  UpdateCodexEntryInput,
  UpdateCodexProgressionInput,
} from "../types/codex";

const EMPTY_CODEX: Codex = {
  entries: [],
  relationships: [],
  customTypes: [],
};

export function useCodex(storyId: string) {
  const [codex, setCodex] = useState<Codex>(EMPTY_CODEX);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCodex = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson<Codex>(`/api/codex/${storyId}`);
      setCodex({
        entries: sortEntries(data.entries ?? []),
        relationships: sortRelationships(data.relationships ?? []),
        customTypes: sortCustomTypes(data.customTypes ?? []),
      });
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load Codex"));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void fetchCodex();
  }, [fetchCodex]);

  const createEntry = useCallback(
    async (input: CreateCodexEntryInput): Promise<CodexEntry> => {
      setSaving(true);
      try {
        const data = await requestJson<{ entry: CodexEntry }>(
          `/api/codex/${storyId}/entries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setCodex((prev) => ({
          ...prev,
          entries: sortEntries([...prev.entries, data.entry]),
        }));
        setError(null);
        return data.entry;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to create entry");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const updateEntry = useCallback(
    async (entryId: string, updates: UpdateCodexEntryInput): Promise<CodexEntry> => {
      setSaving(true);
      try {
        const data = await requestJson<{ entry: CodexEntry }>(
          `/api/codex/${storyId}/entries/${entryId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        setCodex((prev) => ({
          ...prev,
          entries: sortEntries(
            prev.entries.map((entry) => (entry.id === entryId ? data.entry : entry))
          ),
        }));
        setError(null);
        return data.entry;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update entry");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      setSaving(true);
      try {
        await requestJson<{ success: boolean }>(
          `/api/codex/${storyId}/entries/${entryId}`,
          { method: "DELETE" }
        );

        setCodex((prev) => ({
          entries: prev.entries.filter((entry) => entry.id !== entryId),
          relationships: prev.relationships.filter(
            (relationship) =>
              relationship.sourceEntryId !== entryId &&
              relationship.targetEntryId !== entryId
          ),
          customTypes: prev.customTypes,
        }));
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to delete entry");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const createRelationship = useCallback(
    async (input: CreateCodexRelationshipInput): Promise<CodexRelationship> => {
      setSaving(true);
      try {
        const data = await requestJson<{ relationship: CodexRelationship }>(
          `/api/codex/${storyId}/relationships`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setCodex((prev) => ({
          ...prev,
          relationships: sortRelationships([...prev.relationships, data.relationship]),
        }));
        setError(null);
        return data.relationship;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to create relationship");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const deleteRelationship = useCallback(
    async (relationshipId: string) => {
      setSaving(true);
      try {
        await requestJson<{ success: boolean }>(
          `/api/codex/${storyId}/relationships/${relationshipId}`,
          { method: "DELETE" }
        );

        setCodex((prev) => ({
          ...prev,
          relationships: prev.relationships.filter(
            (relationship) => relationship.id !== relationshipId
          ),
        }));
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to delete relationship");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const createProgression = useCallback(
    async (
      entryId: string,
      input: CreateCodexProgressionInput
    ): Promise<CodexProgression> => {
      setSaving(true);
      try {
        const data = await requestJson<{ progression: CodexProgression }>(
          `/api/codex/${storyId}/entries/${entryId}/progressions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setCodex((prev) => ({
          ...prev,
          entries: prev.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  progressions: sortProgressions([...entry.progressions, data.progression]),
                }
              : entry
          ),
        }));
        setError(null);
        return data.progression;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to create progression");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const updateProgression = useCallback(
    async (
      entryId: string,
      progressionId: string,
      updates: UpdateCodexProgressionInput
    ): Promise<CodexProgression> => {
      setSaving(true);
      try {
        const data = await requestJson<{ progression: CodexProgression }>(
          `/api/codex/${storyId}/entries/${entryId}/progressions/${progressionId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        setCodex((prev) => ({
          ...prev,
          entries: prev.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  progressions: sortProgressions(
                    entry.progressions.map((progression) =>
                      progression.id === progressionId ? data.progression : progression
                    )
                  ),
                }
              : entry
          ),
        }));
        setError(null);
        return data.progression;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to update progression");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const deleteProgression = useCallback(
    async (entryId: string, progressionId: string) => {
      setSaving(true);
      try {
        await requestJson<{ success: boolean }>(
          `/api/codex/${storyId}/entries/${entryId}/progressions/${progressionId}`,
          { method: "DELETE" }
        );

        setCodex((prev) => ({
          ...prev,
          entries: prev.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  progressions: entry.progressions.filter(
                    (progression) => progression.id !== progressionId
                  ),
                }
              : entry
          ),
        }));
        setError(null);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to delete progression");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const createCustomType = useCallback(
    async (input: CreateCodexCustomTypeInput): Promise<CodexCustomType> => {
      setSaving(true);
      try {
        const data = await requestJson<{ customType: CodexCustomType }>(
          `/api/codex/${storyId}/custom-types`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setCodex((prev) => ({
          ...prev,
          customTypes: sortCustomTypes([...prev.customTypes, data.customType]),
        }));
        setError(null);
        return data.customType;
      } catch (err) {
        const message = getErrorMessage(err, "Failed to create custom type");
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [storyId]
  );

  const generateFromChapter1 = useCallback(async () => {
    setGenerating(true);
    try {
      await requestJson<{ entries: CodexEntry[]; relationships: CodexRelationship[] }>(
        "/api/codex/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId }),
        }
      );

      await fetchCodex();
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to generate Codex");
      setError(message);
      throw new Error(message);
    } finally {
      setGenerating(false);
    }
  }, [fetchCodex, storyId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    codex,
    entries: codex.entries,
    relationships: codex.relationships,
    customTypes: codex.customTypes,
    loading,
    saving,
    generating,
    error,
    fetchCodex,
    clearError,
    createEntry,
    updateEntry,
    deleteEntry,
    createRelationship,
    deleteRelationship,
    createProgression,
    updateProgression,
    deleteProgression,
    createCustomType,
    generateFromChapter1,
  };
}

function sortEntries(entries: CodexEntry[]): CodexEntry[] {
  return [...entries].sort((a, b) => {
    if (a.entryType !== b.entryType) {
      return a.entryType.localeCompare(b.entryType);
    }

    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

function sortRelationships(relationships: CodexRelationship[]): CodexRelationship[] {
  return [...relationships].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function sortCustomTypes(customTypes: CodexCustomType[]): CodexCustomType[] {
  return [...customTypes].sort((a, b) => a.name.localeCompare(b.name));
}

function sortProgressions(progressions: CodexProgression[]): CodexProgression[] {
  return [...progressions].sort((a, b) => a.chapterNumber - b.chapterNumber);
}
