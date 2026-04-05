"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "../lib/request";
import type {
  Memory,
  MemoryCustomType,
  MemoryEntry,
  MemoryProgression,
  MemoryRelationship,
  CreateMemoryCustomTypeInput,
  CreateMemoryEntryInput,
  CreateMemoryProgressionInput,
  CreateMemoryRelationshipInput,
  UpdateMemoryEntryInput,
  UpdateMemoryProgressionInput,
} from "../types/memory";

const EMPTY_MEMORY: Memory = {
  entries: [],
  relationships: [],
  customTypes: [],
};

export function useMemory(storyId: string) {
  const [memory, setMemory] = useState<Memory>(EMPTY_MEMORY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMemory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestJson<Memory>(`/api/memory/${storyId}`);
      setMemory({
        entries: sortEntries(data.entries ?? []),
        relationships: sortRelationships(data.relationships ?? []),
        customTypes: sortCustomTypes(data.customTypes ?? []),
      });
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load Memory"));
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    void fetchMemory();
  }, [fetchMemory]);

  const createEntry = useCallback(
    async (input: CreateMemoryEntryInput): Promise<MemoryEntry> => {
      setSaving(true);
      try {
        const data = await requestJson<{ entry: MemoryEntry }>(
          `/api/memory/${storyId}/entries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setMemory((prev) => ({
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
    async (entryId: string, updates: UpdateMemoryEntryInput): Promise<MemoryEntry> => {
      setSaving(true);
      try {
        const data = await requestJson<{ entry: MemoryEntry }>(
          `/api/memory/${storyId}/entries/${entryId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        setMemory((prev) => ({
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
          `/api/memory/${storyId}/entries/${entryId}`,
          { method: "DELETE" }
        );

        setMemory((prev) => ({
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
    async (input: CreateMemoryRelationshipInput): Promise<MemoryRelationship> => {
      setSaving(true);
      try {
        const data = await requestJson<{ relationship: MemoryRelationship }>(
          `/api/memory/${storyId}/relationships`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setMemory((prev) => ({
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
          `/api/memory/${storyId}/relationships/${relationshipId}`,
          { method: "DELETE" }
        );

        setMemory((prev) => ({
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
      input: CreateMemoryProgressionInput
    ): Promise<MemoryProgression> => {
      setSaving(true);
      try {
        const data = await requestJson<{ progression: MemoryProgression }>(
          `/api/memory/${storyId}/entries/${entryId}/progressions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setMemory((prev) => ({
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
      updates: UpdateMemoryProgressionInput
    ): Promise<MemoryProgression> => {
      setSaving(true);
      try {
        const data = await requestJson<{ progression: MemoryProgression }>(
          `/api/memory/${storyId}/entries/${entryId}/progressions/${progressionId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        setMemory((prev) => ({
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
          `/api/memory/${storyId}/entries/${entryId}/progressions/${progressionId}`,
          { method: "DELETE" }
        );

        setMemory((prev) => ({
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
    async (input: CreateMemoryCustomTypeInput): Promise<MemoryCustomType> => {
      setSaving(true);
      try {
        const data = await requestJson<{ customType: MemoryCustomType }>(
          `/api/memory/${storyId}/custom-types`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        setMemory((prev) => ({
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
      await requestJson<{ entries: MemoryEntry[]; relationships: MemoryRelationship[] }>(
        "/api/memory/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId }),
        }
      );

      await fetchMemory();
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to generate Memory");
      setError(message);
      throw new Error(message);
    } finally {
      setGenerating(false);
    }
  }, [fetchMemory, storyId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    memory,
    entries: memory.entries,
    relationships: memory.relationships,
    customTypes: memory.customTypes,
    loading,
    saving,
    generating,
    error,
    fetchMemory,
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

function sortEntries(entries: MemoryEntry[]): MemoryEntry[] {
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

function sortRelationships(relationships: MemoryRelationship[]): MemoryRelationship[] {
  return [...relationships].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function sortCustomTypes(customTypes: MemoryCustomType[]): MemoryCustomType[] {
  return [...customTypes].sort((a, b) => a.name.localeCompare(b.name));
}

function sortProgressions(progressions: MemoryProgression[]): MemoryProgression[] {
  return [...progressions].sort((a, b) => a.chapterNumber - b.chapterNumber);
}
