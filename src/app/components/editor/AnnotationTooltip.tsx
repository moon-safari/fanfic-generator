"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { ChapterAnnotation } from "../../types/bible";

interface AnnotationTooltipProps {
  annotation: ChapterAnnotation;
  anchorRect: DOMRect | null;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

function severityColor(severity: string): {
  bg: string;
  border: string;
  badge: string;
  label: string;
} {
  switch (severity) {
    case "error":
      return {
        bg: "bg-orange-950/40",
        border: "border-orange-700/50",
        badge: "bg-orange-600",
        label: "Error",
      };
    case "warning":
      return {
        bg: "bg-yellow-950/40",
        border: "border-yellow-700/50",
        badge: "bg-yellow-600",
        label: "Warning",
      };
    case "info":
    default:
      return {
        bg: "bg-blue-950/40",
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
  anchorRect,
  onDismiss,
  onClose,
}: AnnotationTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Position tooltip above or below the anchor
  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 8;

    let top = anchorRect.top - tooltipRect.height - padding;
    let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

    // If above goes off screen, show below
    if (top < padding) {
      top = anchorRect.bottom + padding;
    }

    // Clamp left to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setPosition({ top, left });
  }, [anchorRect]);

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

  const handleDismissAnnotation = useCallback(() => {
    onDismiss(annotation.id);
    onClose();
  }, [annotation.id, onDismiss, onClose]);

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[60] w-72 ${colors.bg} border ${colors.border} rounded-lg shadow-xl p-3 animate-in fade-in duration-200`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${colors.badge}`}
          >
            {colors.label}
          </span>
          {annotation.sourceChapter && (
            <span className="text-[10px] text-zinc-500">
              Ch. {annotation.sourceChapter}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close tooltip"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">
        {annotation.message}
      </p>

      <div className="mt-2 flex justify-end">
        <button
          onClick={handleDismissAnnotation}
          className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors min-h-[44px]"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
