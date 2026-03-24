"use client";

import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { createClient } from "../../lib/supabase/client";

interface UseAutosaveOptions {
  editor: Editor | null;
  chapterId: string | undefined;
  debounceMs?: number;
}

export function useAutosave({
  editor,
  chapterId,
  debounceMs = 3000,
}: UseAutosaveOptions) {
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chapterIdRef = useRef(chapterId);
  chapterIdRef.current = chapterId;

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

  return { flush };
}
