import { useState, useCallback } from "react";
import type { PlanningArtifactSubtype } from "../types/artifact";

export interface CodexFocusRequest {
  entryId: string;
  nonce: number;
}

export interface ArtifactFocusRequest {
  sectionType: PlanningArtifactSubtype;
  targetLabel?: string;
  nonce: number;
}

export function useCodexFocus() {
  const [codexFocusRequest, setCodexFocusRequest] =
    useState<CodexFocusRequest | null>(null);
  const [artifactFocusRequest, setArtifactFocusRequest] =
    useState<ArtifactFocusRequest | null>(null);

  const focusCodexEntry = useCallback((entryId: string) => {
    setCodexFocusRequest({ entryId, nonce: Date.now() });
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
      const mentionEl = target.closest("[data-codex-entry-id]");
      if (mentionEl) {
        const entryId = mentionEl.getAttribute("data-codex-entry-id");
        if (entryId) {
          focusCodexEntry(entryId);
          return true;
        }
      }
      return false;
    },
    [focusCodexEntry]
  );

  const clearFocus = useCallback(() => {
    setCodexFocusRequest(null);
    setArtifactFocusRequest(null);
  }, []);

  return {
    codexFocusRequest,
    artifactFocusRequest,
    focusCodexEntry,
    focusArtifact,
    handleMentionClick,
    clearFocus,
  };
}
