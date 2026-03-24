"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Story, ContinueResponse } from "../../types/story";
import { addChapterToDB } from "../../lib/supabase/stories";
import { exportStoryToText } from "../../lib/storage";
import { useAutosave } from "./useAutosave";
import EditorToolbar from "./EditorToolbar";
import EditorFooter from "./EditorFooter";
import StoryBiblePanel from "../story-bible/StoryBiblePanel";

interface StoryEditorProps {
  story: Story;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
}

/** Convert plain text to Tiptap document JSON */
function textToTiptapDoc(text: string): object {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p.replace(/\n/g, " ") }],
    })),
  };
}

export default function StoryEditor({
  story,
  onBack,
  onUpdate,
  onDelete,
}: StoryEditorProps) {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(
    story.chapters.length - 1
  );
  const [showBible, setShowBible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const chapter = story.chapters[currentChapterIdx];
  const isLatestChapter = currentChapterIdx === story.chapters.length - 1;

  // Track editor readiness for initial content set
  const initialContentRef = useRef<object | null>(null);

  const getChapterContent = useCallback(
    (idx: number): object => {
      const ch = story.chapters[idx];
      if (!ch) return { type: "doc", content: [] };
      if (ch.contentJson) return ch.contentJson;
      return textToTiptapDoc(ch.content);
    },
    [story.chapters]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      CharacterCount,
    ],
    content: getChapterContent(currentChapterIdx),
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[60vh] px-4 sm:px-8 py-6 text-zinc-200 leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  const { flush } = useAutosave({
    editor,
    chapterId: chapter?.id,
  });

  const flushRef = useRef(flush);
  flushRef.current = flush;

  // Chapter switching
  const switchChapter = useCallback(
    async (newIdx: number) => {
      if (newIdx === currentChapterIdx) return;
      if (newIdx < 0 || newIdx >= story.chapters.length) return;

      // Flush current chapter
      await flushRef.current();

      setCurrentChapterIdx(newIdx);
    },
    [currentChapterIdx, story.chapters.length]
  );

  // Update editor content when chapter changes
  useEffect(() => {
    if (!editor) return;
    const content = getChapterContent(currentChapterIdx);
    // Only set content if it differs from what we computed on mount
    if (initialContentRef.current === null) {
      initialContentRef.current = content;
      return; // Skip first render, editor already has this content
    }
    editor.commands.setContent(content);
    initialContentRef.current = content;
  }, [editor, currentChapterIdx, getChapterContent]);

  // Continue story
  const handleContinue = async () => {
    setLoading(true);
    setError("");

    try {
      await flush();

      const res = await fetch("/api/continue-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to continue story");
      }

      const data: ContinueResponse = await res.json();
      const chapterNum = story.chapters.length + 1;
      const updated = await addChapterToDB(story.id, chapterNum, data.chapter);

      if (!updated) throw new Error("Failed to save chapter");
      onUpdate(updated);
      setCurrentChapterIdx(updated.chapters.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const text = exportStoryToText(story);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${story.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleBack = async () => {
    await flush();
    onBack();
  };

  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col z-40">
      <EditorToolbar
        story={story}
        currentChapterIdx={currentChapterIdx}
        totalChapters={story.chapters.length}
        showBible={showBible}
        onBack={handleBack}
        onPrevChapter={() => switchChapter(currentChapterIdx - 1)}
        onNextChapter={() => switchChapter(currentChapterIdx + 1)}
        onToggleBible={() => setShowBible((v) => !v)}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="px-4 py-3 bg-red-900/30 border-b border-red-700 flex items-center justify-between shrink-0">
          <p className="text-red-200 text-sm">
            Delete this story permanently?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(story.id)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Bible panel */}
        {showBible && (
          <StoryBiblePanel
            storyId={story.id}
            onClose={() => setShowBible(false)}
          />
        )}
      </div>

      <EditorFooter
        wordCount={wordCount}
        isLatestChapter={isLatestChapter}
        loading={loading}
        error={error}
        onContinue={handleContinue}
      />
    </div>
  );
}
