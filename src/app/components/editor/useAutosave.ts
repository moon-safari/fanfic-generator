"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Editor } from "@tiptap/react";
import { createClient } from "../../lib/supabase/client";

interface UseAutosaveOptions {
  editor: Editor | null;
  chapterId: string | undefined;
  debounceMs?: number;
  onError?: (err: Error) => void;
}

export function useAutosave({
  editor,
  chapterId,
  debounceMs = 3000,
  onError,
}: UseAutosaveOptions) {
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chapterIdRef = useRef(chapterId);
  chapterIdRef.current = chapterId;

  const [saveErrorTick, setSaveErrorTick] = useState(0);
  const lastSaveErrorRef = useRef<string | null>(null);

  // Keep onError in a ref so save callback doesn't need to redeclare
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const save = useCallback(async () => {
    if (!editor || !chapterIdRef.current) return;

    const text = editor.getText();
    const json = editor.getJSON();
    const contentStr = JSON.stringify(json);

    // Skip no-ops
    if (contentStr === lastSavedRef.current) return;

    const supabase = createClient();
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    const { error } = await supabase
      .from("chapters")
      .update({
        content: text,
        content_json: json,
        word_count: wordCount,
      })
      .eq("id", chapterIdRef.current);

    if (!error) {
      lastSavedRef.current = contentStr;
      lastSaveErrorRef.current = null;
    } else {
      lastSaveErrorRef.current = error.message;
      setSaveErrorTick((t) => t + 1);
      onErrorRef.current?.(new Error(error.message));
    }
  }, [editor]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await save();
  }, [save]);

  // Listen to editor updates with debounce
  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        save();
      }, debounceMs);
    };

    editor.on("update", handler);

    return () => {
      editor.off("update", handler);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, debounceMs, save]);

  // Reset saved ref when chapter changes
  useEffect(() => {
    lastSavedRef.current = "";
  }, [chapterId]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      save();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  void saveErrorTick; // consumed to make lastSaveError reactive

  return { flush, lastSaveError: lastSaveErrorRef.current };
}
