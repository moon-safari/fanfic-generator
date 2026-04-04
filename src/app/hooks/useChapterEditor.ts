import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { Story, Chapter } from "../types/story";
import { textToTiptapDoc } from "../lib/editorUtils";

export interface UseChapterEditorOptions {
  story: Story;
  editor: Editor | null;
  streamingActive: boolean;
}

export interface UseChapterEditorReturn {
  currentChapterIdx: number;
  currentChapter: Chapter | undefined;
  switchChapter: (newIdx: number, beforeSwitch?: () => Promise<void>) => void;
  setChapterIdx: (idx: number) => void;
  getChapterContent: (idx: number) => object | string;
}

/**
 * Resolve chapter content from story data (no editor dependency).
 * Exported so StoryEditor can call it before useEditor for initial content.
 */
export function resolveChapterContent(
  chapters: Chapter[],
  idx: number
): object | string {
  const ch = chapters[idx];
  if (!ch) return { type: "doc", content: [] };
  if (ch.contentJson) return ch.contentJson;
  return textToTiptapDoc(ch.content);
}

export function useChapterEditor({
  story,
  editor,
  streamingActive,
}: UseChapterEditorOptions): UseChapterEditorReturn {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(
    story.chapters.length - 1
  );

  const streamingActiveRef = useRef(streamingActive);
  streamingActiveRef.current = streamingActive;

  // Ref to always read latest chapters — keeps getChapterContent stable across renders
  const chaptersRef = useRef(story.chapters);
  chaptersRef.current = story.chapters;

  const currentChapter = story.chapters[currentChapterIdx];

  const getChapterContent = useCallback(
    (idx: number): object | string => resolveChapterContent(chaptersRef.current, idx),
    [] // stable — reads from ref
  );

  const switchChapter = useCallback(
    async (newIdx: number, beforeSwitch?: () => Promise<void>) => {
      if (streamingActiveRef.current) return;
      if (newIdx === currentChapterIdx) return;
      if (newIdx < 0 || newIdx >= story.chapters.length) return;

      if (beforeSwitch) {
        await beforeSwitch();
      }

      setCurrentChapterIdx(newIdx);
    },
    [currentChapterIdx, story.chapters.length]
  );

  // Track editor readiness for initial content set
  const initialContentRef = useRef<object | string | null>(null);

  // Update editor content when the user switches chapters.
  // Must NOT fire when story.chapters changes for other reasons (e.g. word count saves),
  // otherwise it would overwrite live editor content.
  useEffect(() => {
    if (!editor) return;
    // Skip content sync during streaming — streaming manages editor content directly
    if (streamingActiveRef.current) return;
    const content = resolveChapterContent(chaptersRef.current, currentChapterIdx);
    // Only set content if it differs from what we computed on mount
    if (initialContentRef.current === null) {
      initialContentRef.current = content;
      return; // Skip first render, editor already has this content
    }
    editor.commands.setContent(content);
    initialContentRef.current = content;
  }, [editor, currentChapterIdx]);

  return {
    currentChapterIdx,
    currentChapter,
    switchChapter,
    setChapterIdx: setCurrentChapterIdx,
    getChapterContent,
  };
}
