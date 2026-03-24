"use client";

import { useRef, useEffect } from "react";
import { BibleSynopsisContent } from "../../types/bible";

interface SynopsisEditorProps {
  content: BibleSynopsisContent | null;
  onSave: (content: BibleSynopsisContent) => void;
}

export default function SynopsisEditor({
  content,
  onSave,
}: SynopsisEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const text = content?.text ?? "";

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [text]);

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => onSave({ text: e.target.value })}
      placeholder="Story synopsis / premise..."
      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none min-h-[80px]"
    />
  );
}
