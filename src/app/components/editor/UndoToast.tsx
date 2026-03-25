// src/app/components/editor/UndoToast.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

interface UndoToastProps {
  toolLabel: string;
  duration?: number;
  onUndo: () => void;
  onExpire: () => void;
}

export default function UndoToast({
  toolLabel,
  duration = 5,
  onUndo,
  onExpire,
}: UndoToastProps) {
  const [countdown, setCountdown] = useState(duration);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setFading(true);
      const fadeTimer = setTimeout(onExpire, 300);
      return () => clearTimeout(fadeTimer);
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onExpire]);

  const handleUndo = useCallback(() => {
    onUndo();
  }, [onUndo]);

  return (
    <div
      className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border border-purple-500/30 bg-[#1a1025] shadow-lg shadow-black/40 transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="text-sm text-purple-300 whitespace-nowrap">
        ✓ Inserted {toolLabel}
      </span>
      <button
        onClick={handleUndo}
        className="px-3 py-1 rounded text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors min-h-[32px]"
      >
        Undo
      </button>
      <span className="text-xs text-zinc-500">{countdown}s</span>
    </div>
  );
}
