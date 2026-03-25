// src/app/components/editor/MobileCraftSheet.tsx
"use client";

import { CraftTool, CraftResult } from "../../types/craft";
import CraftTab from "./CraftTab";
import MobileBottomSheet from "./MobileBottomSheet";

interface MobileCraftSheetProps {
  isOpen: boolean;
  activeTool: CraftTool | null;
  result: CraftResult | null;
  loading: boolean;
  error: string | null;
  direction: string;
  onClose: () => void;
  onDirectionChange: (direction: string) => void;
  onRerun: (direction: string) => void;
  onInsert: (text: string) => void;
  onGenerateMore: () => void;
  onRetry: () => void;
}

export default function MobileCraftSheet({
  isOpen,
  activeTool,
  result,
  loading,
  error,
  direction,
  onClose,
  onDirectionChange,
  onRerun,
  onInsert,
  onGenerateMore,
  onRetry,
}: MobileCraftSheetProps) {
  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-2 pb-4">
        <CraftTab
          activeTool={activeTool}
          result={result}
          loading={loading}
          error={error}
          direction={direction}
          onDirectionChange={onDirectionChange}
          onRerun={onRerun}
          onInsert={onInsert}
          onGenerateMore={onGenerateMore}
          onRetry={onRetry}
        />
      </div>
    </MobileBottomSheet>
  );
}
