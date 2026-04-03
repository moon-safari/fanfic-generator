"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { getProjectUnitLabel } from "../../lib/projectMode";
import {
  ChapterAnnotation,
  ChapterAnnotationAction,
} from "../../types/bible";
import type { ProjectMode } from "../../types/story";

interface AnnotationTooltipProps {
  annotation: ChapterAnnotation;
  projectMode: ProjectMode;
  anchorRect: DOMRect | null;
  onDismiss: (id: string) => void;
  onApplyAction?: (
    annotation: ChapterAnnotation,
    action: ChapterAnnotationAction
  ) => Promise<void>;
  onOpenPlanningTarget?: (annotation: ChapterAnnotation) => void;
  onClose: () => void;
}

function severityColor(severity: string): {
  border: string;
  badge: string;
  label: string;
} {
  switch (severity) {
    case "error":
      return {
        border: "border-orange-700/50",
        badge: "bg-orange-600",
        label: "Error",
      };
    case "warning":
      return {
        border: "border-yellow-700/50",
        badge: "bg-yellow-600",
        label: "Warning",
      };
    case "info":
    default:
      return {
        border: "border-blue-700/50",
        badge: "bg-blue-600",
        label: "Info",
      };
  }
}

export function annotationUnderlineClass(severity: string): string {
  switch (severity) {
    case "error":
      return "underline decoration-orange-500 decoration-wavy decoration-2 underline-offset-2 cursor-pointer";
    case "warning":
      return "underline decoration-yellow-500 decoration-wavy decoration-2 underline-offset-2 cursor-pointer";
    case "info":
    default:
      return "underline decoration-blue-500 decoration-wavy decoration-2 underline-offset-2 cursor-pointer";
  }
}

export default function AnnotationTooltip({
  annotation,
  projectMode,
  anchorRect,
  onDismiss,
  onApplyAction,
  onOpenPlanningTarget,
  onClose,
}: AnnotationTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [actionLoading, setActionLoading] =
    useState<ChapterAnnotationAction | null>(null);
  const [actionError, setActionError] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Position tooltip above or below the anchor
  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 12;

    let top = anchorRect.top - tooltipRect.height - padding;
    let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

    // If above goes off screen, show below
    if (top < padding) {
      top = anchorRect.bottom + padding;
    }

    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipRect.height - padding)
    );

    // Clamp left to viewport
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipRect.width - padding)
    );

    setPosition({ top, left });
  }, [anchorRect]);

  useEffect(() => {
    setActionLoading(null);
    setActionError("");
  }, [annotation.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const colors = severityColor(annotation.severity);
  const typeMeta = annotationTypeMeta(annotation.annotationType);
  const sourceLabel = formatAnnotationSource(annotation, projectMode);
  const quickActions = getAnnotationQuickActions(annotation);
  const reasonLabel = annotation.metadata?.reasonType
    ? formatReasonLabel(annotation.metadata.reasonType)
    : null;
  const targetLabel = annotation.metadata?.targetLabel?.trim() || null;
  const explanationLines = getAnnotationExplanationLines(annotation, projectMode);
  const canOpenPlanningTarget =
    annotation.annotationType === "planning_drift"
    && Boolean(annotation.metadata?.targetSection)
    && Boolean(onOpenPlanningTarget);

  const handleDismissAnnotation = useCallback(() => {
    onDismiss(annotation.id);
    onClose();
  }, [annotation.id, onDismiss, onClose]);

  const handleApplyAction = useCallback(
    async (action: ChapterAnnotationAction) => {
      if (!onApplyAction || actionLoading) {
        return;
      }

      try {
        setActionError("");
        setActionLoading(action);
        await onApplyAction(annotation, action);
        onClose();
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "Failed to apply action"
        );
      } finally {
        setActionLoading(null);
      }
    },
    [actionLoading, annotation, onApplyAction, onClose]
  );

  return (
    <div
      ref={tooltipRef}
      className={`fixed isolate z-[70] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border ${colors.border} bg-zinc-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in fade-in duration-200 sm:w-96`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="max-h-[min(70vh,34rem)] overflow-y-auto px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${colors.badge}`}
              >
                {colors.label}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-1 text-[10px] font-medium ${typeMeta.badge}`}
              >
                {typeMeta.label}
              </span>
              {sourceLabel && (
                <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-zinc-300">
                  {sourceLabel}
                </span>
              )}
            </div>

            <p className="text-sm leading-6 text-zinc-100">
              {annotation.message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close tooltip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {(reasonLabel || targetLabel) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {reasonLabel && (
              <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-200">
                {reasonLabel}
              </span>
            )}
            {targetLabel && (
              <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-zinc-200">
                {targetLabel}
              </span>
            )}
          </div>
        )}

        {explanationLines.length > 0 && (
          <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3 py-2.5">
            <div className="space-y-1.5">
              {explanationLines.map((line) => (
                <p key={line} className="text-xs leading-5 text-zinc-300">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {actionError && (
          <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-2.5 py-2 text-xs text-red-100">
            {actionError}
          </div>
        )}

        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <div className="flex flex-wrap justify-end gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  void handleApplyAction(action.id);
                }}
                disabled={!onApplyAction || Boolean(actionLoading)}
                className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  action.emphasis === "primary"
                    ? "bg-purple-600 text-white hover:bg-purple-500"
                    : "text-cyan-200 hover:bg-cyan-500/15 hover:text-white"
                }`}
              >
                {actionLoading === action.id ? action.pendingLabel : action.label}
              </button>
            ))}
            {canOpenPlanningTarget && (
              <button
                onClick={() => {
                  onOpenPlanningTarget?.(annotation);
                  onClose();
                }}
                className="min-h-[40px] rounded-xl px-3 py-2 text-xs font-medium text-purple-200 transition-colors hover:bg-purple-500/15 hover:text-white"
              >
                {getPlanningTargetButtonLabel(annotation.metadata?.targetSection)}
              </button>
            )}
            <button
              onClick={handleDismissAnnotation}
              className="min-h-[40px] rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              {annotation.metadata?.suggestedAction === "dismiss_if_intentional"
                ? "Dismiss as intentional"
                : "Dismiss"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function annotationTypeMeta(annotationType: string) {
  switch (annotationType) {
    case "planning_drift":
      return {
        label: "Plan drift",
        badge: "bg-purple-500/15 text-purple-200",
      };
    case "suggestion":
      return {
        label: "Suggestion",
        badge: "bg-cyan-500/15 text-cyan-200",
      };
    case "continuity_warning":
    default:
      return {
        label: "Continuity",
        badge: "bg-zinc-800 text-zinc-300",
      };
  }
}

function formatAnnotationSource(
  annotation: ChapterAnnotation,
  projectMode: ProjectMode
) {
  const raw = annotation.sourceChapter?.trim();
  if (!raw) {
    return null;
  }

  const sourceNumber = Number(raw);
  if (!Number.isFinite(sourceNumber)) {
    return raw;
  }

  if (sourceNumber === 0) {
    return annotation.annotationType === "planning_drift"
      ? "Project plan"
      : "Project context";
  }

  return `${getProjectUnitLabel(projectMode, { capitalize: true })} ${sourceNumber}`;
}

function formatReasonLabel(reasonType: NonNullable<ChapterAnnotation["metadata"]>["reasonType"]) {
  switch (reasonType) {
    case "intent_miss":
      return "Missed intent";
    case "reveal_drift":
      return "Reveal drift";
    case "due_thread":
      return "Due thread";
    case "arc_drift":
      return "Arc drift";
    case "promise_drift":
      return "Promise drift";
    case "voice_drift":
      return "Voice drift";
    case "hook_drift":
      return "Hook drift";
    case "cta_drift":
      return "CTA drift";
    case "segment_drift":
      return "Segment drift";
    case "fact_contradiction":
    default:
      return "Fact contradiction";
  }
}

function getAnnotationQuickActions(annotation: ChapterAnnotation): {
  id: ChapterAnnotationAction;
  label: string;
  pendingLabel: string;
  emphasis: "primary" | "secondary";
}[] {
  const actions: {
    id: ChapterAnnotationAction;
    label: string;
    pendingLabel: string;
    emphasis: "primary" | "secondary";
  }[] = [];

  if (
    annotation.annotationType === "planning_drift"
    && annotation.metadata?.targetSection === "notes"
    && annotation.metadata?.reasonType === "arc_drift"
    && annotation.metadata.targetLabel
    && annotation.metadata.targetState?.toLowerCase() === "planned"
  ) {
    actions.push({
      id: "mark_arc_active",
      label: "Mark arc active",
      pendingLabel: "Updating arc...",
      emphasis: "secondary",
    });
  }

  if (
    annotation.annotationType === "planning_drift"
    && annotation.metadata?.targetSection === "notes"
    && annotation.metadata?.reasonType === "due_thread"
    && annotation.metadata.targetLabel
  ) {
    actions.push({
      id: "mark_thread_resolved",
      label: "Mark thread resolved",
      pendingLabel: "Resolving...",
      emphasis: "primary",
    });
  }

  if (
    annotation.annotationType === "planning_drift"
    && annotation.metadata?.targetSection === "outline"
    && (
      annotation.metadata?.reasonType === "intent_miss"
      || annotation.metadata?.reasonType === "reveal_drift"
    )
  ) {
    actions.push({
      id: "align_outline_to_draft",
      label:
        annotation.metadata.reasonType === "reveal_drift"
          ? "Update outline reveal"
          : "Update outline intent",
      pendingLabel: "Updating outline...",
      emphasis: "primary",
    });
  }

  if (annotation.metadata?.suggestedAction === "dismiss_if_intentional") {
    actions.push({
      id: "mark_intentional_divergence",
      label: "Mark intentional divergence",
      pendingLabel: "Saving...",
      emphasis: "secondary",
    });
  }

  return actions;
}

function getAnnotationExplanationLines(
  annotation: ChapterAnnotation,
  projectMode: ProjectMode
) {
  const lines: string[] = [];
  const unitLabelCapitalized = getProjectUnitLabel(projectMode, {
    capitalize: true,
  });
  const metadata = annotation.metadata;

  if (metadata?.reasonDetail) {
    lines.push(metadata.reasonDetail);
  }

  if (metadata?.reasonType === "due_thread" && typeof metadata.targetUnit === "number") {
    lines.push(`Planned payoff by ${unitLabelCapitalized} ${metadata.targetUnit}.`);
  }

  if (metadata?.targetState) {
    const label = getTargetStateLabel(metadata.reasonType);
    lines.push(`${label}: ${metadata.targetState}.`);
  }

  if (metadata?.targetHorizon) {
    lines.push(`Planning horizon: ${metadata.targetHorizon}.`);
  }

  return Array.from(new Set(lines));
}

function getTargetStateLabel(
  reasonType: NonNullable<ChapterAnnotation["metadata"]>["reasonType"]
) {
  switch (reasonType) {
    case "intent_miss":
      return "Planned intent";
    case "reveal_drift":
      return "Expected reveal";
    case "hook_drift":
      return "Issue angle";
    case "promise_drift":
      return "Series promise";
    case "voice_drift":
      return "Voice guide";
    case "cta_drift":
      return "CTA pattern";
    case "segment_drift":
      return "Recurring segment";
    default:
      return "Tracked status";
  }
}

function getPlanningTargetButtonLabel(
  targetSection: NonNullable<ChapterAnnotation["metadata"]>["targetSection"]
) {
  switch (targetSection) {
    case "synopsis":
      return "Open synopsis";
    case "style_guide":
      return "Open style guide";
    case "outline":
      return "Open outline";
    case "notes":
    default:
      return "Open planning notes";
  }
}
