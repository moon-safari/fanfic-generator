import { useState, useCallback } from "react";
import type { PlanningArtifactSubtype } from "../types/artifact";

export interface MemoryFocusRequest {
  entryId: string;
  nonce: number;
}

export interface ArtifactFocusRequest {
  sectionType: PlanningArtifactSubtype;
  targetLabel?: string;
  nonce: number;
}

export function useMemoryFocus() {
  const [memoryFocusRequest, setMemoryFocusRequest] =
    useState<MemoryFocusRequest | null>(null);
  const [artifactFocusRequest, setArtifactFocusRequest] =
    useState<ArtifactFocusRequest | null>(null);

  const focusMemoryEntry = useCallback((entryId: string) => {
    setMemoryFocusRequest({ entryId, nonce: Date.now() });
  }, []);

  const focusArtifact = useCallback(
    (sectionType: PlanningArtifactSubtype, targetLabel?: string) => {
      setArtifactFocusRequest({ sectionType, targetLabel, nonce: Date.now() });
    },
    []
  );

  const handleMentionClick = useCallback(
    (e: React.MouseEvent): boolean => {
      const target = e.target as HTMLElement;
      const mentionEl = target.closest("[data-memory-entry-id]");
      if (mentionEl) {
        const entryId = mentionEl.getAttribute("data-memory-entry-id");
        if (entryId) {
          focusMemoryEntry(entryId);
          return true;
        }
      }
      return false;
    },
    [focusMemoryEntry]
  );

  const clearFocus = useCallback(() => {
    setMemoryFocusRequest(null);
    setArtifactFocusRequest(null);
  }, []);

  return {
    memoryFocusRequest,
    artifactFocusRequest,
    focusMemoryEntry,
    focusArtifact,
    handleMentionClick,
    clearFocus,
  };
}
