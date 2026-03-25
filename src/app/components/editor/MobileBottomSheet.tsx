// src/app/components/editor/MobileBottomSheet.tsx
"use client";

import { useRef, useCallback, useEffect } from "react";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  children,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;
    if (currentTranslateY.current > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = "translateY(0)";
    }
    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-[#13101e] rounded-t-2xl border-t border-zinc-700 max-h-[60vh] overflow-y-auto transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-zinc-600" />
        </div>
        {children}
      </div>
    </div>
  );
}
