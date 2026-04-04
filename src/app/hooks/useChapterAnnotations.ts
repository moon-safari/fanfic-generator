import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { ChapterAnnotation, ChapterAnnotationAction } from "../types/bible";
import type { PlanningArtifactSubtype } from "../types/artifact";
import { annotationPluginKey } from "../components/editor/annotationExtension";
import { requestJson } from "../lib/request";

export interface AnnotationActionResponse {
  success: boolean;
  resolutionState: "applied" | "intentional_divergence" | "open";
  focusTarget?: {
    sectionType: PlanningArtifactSubtype;
    targetLabel?: string;
  };
}

interface UseChapterAnnotationsOptions {
  chapterId: string | undefined;
  editor: Editor | null;
  isMobile: boolean;
}

interface UseChapterAnnotationsReturn {
  annotations: ChapterAnnotation[];
  activeAnnotation: ChapterAnnotation | null;
  annotationAnchorRect: DOMRect | null;
  pendingNotification: {
    count: number;
    firstAnnotation: ChapterAnnotation;
  } | null;
  clearNotification: () => void;
  handleMouseOver: (e: React.MouseEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
  closeTooltip: () => void;
  handleDismiss: (id: string) => Promise<void>;
  handleApplyAction: (
    annotation: ChapterAnnotation,
    action: ChapterAnnotationAction
  ) => Promise<AnnotationActionResponse | null>;
  handleOpenPlanningTarget: (
    annotation: ChapterAnnotation
  ) => { sectionType: PlanningArtifactSubtype; targetLabel?: string } | null;
  refresh: (chapterId: string) => Promise<void>;
}

export function useChapterAnnotations({
  chapterId,
  editor,
  isMobile,
}: UseChapterAnnotationsOptions): UseChapterAnnotationsReturn {
  const [annotations, setAnnotations] = useState<ChapterAnnotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] =
    useState<ChapterAnnotation | null>(null);
  const [annotationAnchorRect, setAnnotationAnchorRect] =
    useState<DOMRect | null>(null);
  const [pendingNotification, setPendingNotification] = useState<{
    count: number;
    firstAnnotation: ChapterAnnotation;
  } | null>(null);

  // Fetch annotations when chapter changes (passive — no notification)
  useEffect(() => {
    if (!chapterId) return;

    const controller = new AbortController();

    const fetchAnnotations = async () => {
      try {
        const res = await fetch(`/api/annotations?chapterId=${chapterId}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data.annotations ?? []);
        }
      } catch {
        // Silently fail — annotations are non-critical
      }
    };

    fetchAnnotations();

    return () => {
      controller.abort();
    };
  }, [chapterId]);

  // Push annotations into the Tiptap plugin as decorations
  useEffect(() => {
    if (!editor) return;
    const { tr } = editor.state;
    tr.setMeta(annotationPluginKey, {
      annotations: annotations
        .filter((a) => !a.dismissed)
        .map((a) => ({ id: a.id, textMatch: a.textMatch, severity: a.severity })),
    });
    editor.view.dispatch(tr);
  }, [editor, annotations]);

  // Active refresh — sets pendingNotification when warnings/errors found
  const refresh = useCallback(async (targetChapterId: string) => {
    try {
      const res = await fetch(
        `/api/annotations?chapterId=${targetChapterId}`
      );
      if (!res.ok) return;
      const data: { annotations?: ChapterAnnotation[] } = await res.json();
      const fetched = data.annotations ?? [];
      setAnnotations(fetched);

      const issues = fetched.filter(
        (a) => a.severity === "warning" || a.severity === "error"
      );
      if (issues.length > 0) {
        setPendingNotification({
          count: issues.length,
          firstAnnotation: issues[0],
        });
      }
    } catch {
      // Silently fail
    }
  }, []);

  const clearNotification = useCallback(() => {
    setPendingNotification(null);
  }, []);

  const closeTooltip = useCallback(() => {
    setActiveAnnotation(null);
    setAnnotationAnchorRect(null);
  }, []);

  // Show annotation tooltip on hover (desktop)
  const handleMouseOver = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;
      const target = e.target as HTMLElement;
      const annotationEl = target.closest("[data-annotation-id]");
      if (annotationEl) {
        const id = annotationEl.getAttribute("data-annotation-id");
        const annotation = annotations.find((a) => a.id === id);
        if (annotation && annotation.id !== activeAnnotation?.id) {
          setActiveAnnotation(annotation);
          setAnnotationAnchorRect(annotationEl.getBoundingClientRect());
        }
      }
    },
    [annotations, activeAnnotation, isMobile]
  );

  // Handle annotation click + tooltip dismissal
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const annotationEl = target.closest("[data-annotation-id]");
      if (annotationEl) {
        const id = annotationEl.getAttribute("data-annotation-id");
        const annotation = annotations.find((a) => a.id === id);
        if (annotation) {
          setActiveAnnotation(annotation);
          setAnnotationAnchorRect(annotationEl.getBoundingClientRect());
          return;
        }
      }
      // Close annotation tooltip on click elsewhere
      if (activeAnnotation) {
        setActiveAnnotation(null);
        setAnnotationAnchorRect(null);
      }
    },
    [annotations, activeAnnotation]
  );

  // Dismiss annotation
  const handleDismiss = useCallback(async (id: string) => {
    try {
      await fetch(`/api/annotations/${id}/dismiss`, { method: "POST" });
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Silently fail
    }
    setActiveAnnotation(null);
    setAnnotationAnchorRect(null);
  }, []);

  // Apply annotation action
  const handleApplyAction = useCallback(
    async (
      annotation: ChapterAnnotation,
      action: ChapterAnnotationAction
    ): Promise<AnnotationActionResponse | null> => {
      const result = await requestJson<AnnotationActionResponse>(
        `/api/annotations/${annotation.id}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      setAnnotations((prev) =>
        prev.filter((candidate) => candidate.id !== annotation.id)
      );
      setActiveAnnotation(null);
      setAnnotationAnchorRect(null);

      return result;
    },
    []
  );

  // Return planning target info instead of navigating directly
  const handleOpenPlanningTarget = useCallback(
    (
      annotation: ChapterAnnotation
    ): { sectionType: PlanningArtifactSubtype; targetLabel?: string } | null => {
      const targetSection = annotation.metadata?.targetSection;
      if (!targetSection) {
        return null;
      }

      setActiveAnnotation(null);
      setAnnotationAnchorRect(null);

      return { sectionType: targetSection, targetLabel: annotation.metadata?.targetLabel };
    },
    []
  );

  return {
    annotations,
    activeAnnotation,
    annotationAnchorRect,
    pendingNotification,
    clearNotification,
    closeTooltip,
    handleMouseOver,
    handleClick,
    handleDismiss,
    handleApplyAction,
    handleOpenPlanningTarget,
    refresh,
  };
}
