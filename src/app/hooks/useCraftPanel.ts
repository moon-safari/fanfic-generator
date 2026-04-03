// src/app/hooks/useCraftPanel.ts
"use client";

import { useState, useCallback } from "react";
import {
  CraftTool,
  CraftResult,
  SidePanelTab,
  SidePanelWidth,
} from "../types/craft";

interface CraftPanelState {
  isOpen: boolean;
  activeTab: SidePanelTab;
  activeTool: CraftTool | null;
  selectedText: string | null;
  direction: string;
  result: CraftResult | null;
  error: string | null;
  loading: boolean;
  panelWidth: SidePanelWidth;
}

const initialState: CraftPanelState = {
  isOpen: false,
  activeTab: "codex",
  activeTool: null,
  selectedText: null,
  direction: "",
  result: null,
  error: null,
  loading: false,
  panelWidth: "normal",
};

function getPreferredPanelWidth(
  tab: SidePanelTab,
  activeTool: CraftTool | null,
  hasResult: boolean
): SidePanelWidth {
  if (tab === "adapt" || tab === "artifacts") {
    return "expanded";
  }

  if (tab === "craft" && activeTool === "brainstorm" && hasResult) {
    return "expanded";
  }

  return "normal";
}

export function useCraftPanel(storyId: string) {
  const [state, setState] = useState<CraftPanelState>(initialState);

  const openTab = useCallback((tab: SidePanelTab) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      activeTab: tab,
      panelWidth:
        prev.panelWidth === "focus"
          ? "focus"
          : getPreferredPanelWidth(tab, prev.activeTool, Boolean(prev.result)),
    }));
  }, []);

  const closePanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      panelWidth: "normal",
    }));
  }, []);

  const setTab = useCallback((tab: SidePanelTab) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      panelWidth:
        prev.panelWidth === "focus"
          ? "focus"
          : getPreferredPanelWidth(tab, prev.activeTool, Boolean(prev.result)),
    }));
  }, []);

  const callTool = useCallback(
    async (
      tool: CraftTool,
      selectedText: string,
      context: string,
      direction?: string,
      chapterNumber?: number
    ) => {
      setState((prev) => ({
        ...prev,
        isOpen: true,
        activeTab: "craft",
        activeTool: tool,
        selectedText,
        direction: direction || "",
        result: null,
        error: null,
        loading: true,
        panelWidth: prev.panelWidth === "focus" ? "focus" : "normal",
      }));

      try {
        const res = await fetch(`/api/craft/${tool}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId,
            selectedText,
            context,
            direction: direction || "",
            chapterNumber: chapterNumber || 0,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `${tool} failed`);
        }

        const data = await res.json();
        let result: CraftResult;

        if (tool === "rewrite") {
          result = { type: "rewrite", text: data.result as string };
        } else if (tool === "expand") {
          result = { type: "expand", text: data.result as string };
        } else if (tool === "describe") {
          const d = data.result as { blend: string; senses: { type: string; text: string }[] };
          result = {
            type: "describe",
            blend: d.blend || "",
            senses: (d.senses || []).map((s: { type: string; text: string }) => ({
              type: s.type as "sight" | "smell" | "sound" | "touch" | "taste",
              text: s.text,
            })),
          };
        } else {
          // brainstorm
          const ideas = (data.result as { title: string; description: string; prose: string }[]).map(
            (item: { title: string; description: string; prose: string }) => ({
              title: item.title || "",
              description: item.description || "",
              prose: item.prose || "",
            })
          );
          result = { type: "brainstorm", ideas };
        }

        setState((prev) => ({
          ...prev,
          result,
          loading: false,
          panelWidth:
            prev.panelWidth === "focus"
              ? "focus"
              : getPreferredPanelWidth("craft", tool, true),
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Something went wrong",
          loading: false,
        }));
      }
    },
    [storyId]
  );

  const setDirection = useCallback((direction: string) => {
    setState((prev) => ({ ...prev, direction }));
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeTool: null,
      result: null,
      error: null,
      loading: false,
      panelWidth: "normal",
    }));
  }, []);

  const setPanelWidth = useCallback((panelWidth: SidePanelWidth) => {
    setState((prev) => ({ ...prev, panelWidth }));
  }, []);

  const exitFocusMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      panelWidth: getPreferredPanelWidth(
        prev.activeTab,
        prev.activeTool,
        Boolean(prev.result)
      ),
    }));
  }, []);

  return {
    ...state,
    openTab,
    closePanel,
    setTab,
    callTool,
    setDirection,
    dismiss,
    setPanelWidth,
    exitFocusMode,
  };
}
