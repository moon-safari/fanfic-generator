"use client";

import { useState, useCallback } from "react";

export type CraftTool = "rewrite" | "expand" | "describe" | "brainstorm";

export interface BrainstormItem {
  title: string;
  description: string;
  preview: string;
}

export type CraftResult =
  | { type: "rewrite" | "expand"; text: string }
  | { type: "describe"; options: string[] }
  | { type: "brainstorm"; ideas: BrainstormItem[] };

export function useCraftTools(storyId: string) {
  const [activeTool, setActiveTool] = useState<CraftTool | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CraftResult | null>(null);

  const callTool = useCallback(
    async (
      tool: CraftTool,
      selectedText: string,
      context: string,
      direction?: string
    ) => {
      setActiveTool(tool);
      setLoading(true);
      setResult(null);

      try {
        const res = await fetch(`/api/craft/${tool}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId,
            selectedText,
            context,
            direction: direction || "",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `${tool} failed`);
        }

        const data = await res.json();

        if (tool === "rewrite" || tool === "expand") {
          setResult({ type: tool, text: data.result as string });
        } else if (tool === "describe") {
          setResult({ type: "describe", options: data.result as string[] });
        } else if (tool === "brainstorm") {
          setResult({
            type: "brainstorm",
            ideas: data.result as BrainstormItem[],
          });
        }
      } catch (err) {
        console.error(`Craft tool ${tool} error:`, err);
        setActiveTool(null);
      } finally {
        setLoading(false);
      }
    },
    [storyId]
  );

  const dismiss = useCallback(() => {
    setActiveTool(null);
    setResult(null);
    setLoading(false);
  }, []);

  return { activeTool, loading, result, callTool, dismiss };
}
