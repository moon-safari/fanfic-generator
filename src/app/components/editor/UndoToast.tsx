"use client";

import { useCallback, useEffect, useState } from "react";

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
  const isFading = countdown <= 0;

  useEffect(() => {
    if (countdown <= 0) {
      const fadeTimer = setTimeout(onExpire, 300);
      return () => clearTimeout(fadeTimer);
    }

    const timer = setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onExpire]);

  const handleUndo = useCallback(() => {
    onUndo();
  }, [onUndo]);

  return (
    <div
      className={`absolute bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-purple-500/30 bg-[#1a1025] px-4 py-2.5 shadow-lg shadow-black/40 transition-opacity duration-300 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="whitespace-nowrap text-sm text-purple-300">
        Added from {toolLabel}
      </span>
      <button
        onClick={handleUndo}
        className="min-h-[32px] rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-purple-500"
      >
        Undo
      </button>
      <span className="text-xs text-zinc-500">{countdown}s</span>
    </div>
  );
}
