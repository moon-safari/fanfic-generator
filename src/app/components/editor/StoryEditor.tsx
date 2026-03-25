"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Story, ContinueResponse } from "../../types/story";
import { ChapterAnnotation } from "../../types/bible";
import { addChapterToDB } from "../../lib/supabase/stories";
import { exportStoryToText } from "../../lib/storage";
import { useAutosave } from "./useAutosave";
import { useCraftPanel } from "../../hooks/useCraftPanel";
import { CraftTool } from "../../types/craft";
import EditorToolbar from "./EditorToolbar";
import EditorFooter from "./EditorFooter";
import SidePanel from "./SidePanel";
import MobileCraftSheet from "./MobileCraftSheet";
import UndoToast from "./UndoToast";
import AnnotationTooltip from "./AnnotationTooltip";
import { AnnotationExtension, annotationPluginKey } from "./annotationExtension";

interface StoryEditorProps {
  story: Story;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
}

/** Detect if viewport is mobile-width */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Craft tools state
  const isMobile = useMediaQuery("(max-width: 767px)");
  const craftPanel = useCraftPanel(story.id);
  const [selectedText, setSelectedText] = useState("");
  const [selectionContext, setSelectionContext] = useState("");

  // Undo toast state
  const [undoToast, setUndoToast] = useState<{ visible: boolean; toolLabel: string }>({
    visible: false,
    toolLabel: "",
  });

  // Annotations state
  const [annotations, setAnnotations] = useState<ChapterAnnotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<ChapterAnnotation | null>(null);
  const [annotationAnchorRect, setAnnotationAnchorRect] = useState<DOMRect | null>(null);

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
      AnnotationExtension,
    ],
    content: getChapterContent(currentChapterIdx),
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[60vh] px-4 sm:px-8 py-6 text-zinc-200 leading-relaxed",
      },
    },
    immediatelyRender: false,
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from === to) {
        setSelectedText("");
        return;
      }
      const text = ed.state.doc.textBetween(from, to, " ");
      if (text.trim().length < 3) {
        setSelectedText("");
        return;
      }
      setSelectedText(text);
      // Get surrounding context
      const docText = ed.state.doc.textContent;
      const textBefore = docText.slice(Math.max(0, from - 250), from);
      const textAfter = docText.slice(to, Math.min(docText.length, to + 250));
      setSelectionContext(textBefore + text + textAfter);
    },
  });

  const { flush } = useAutosave({
    editor,
    chapterId: chapter?.id,
  });

  const flushRef = useRef(flush);
  flushRef.current = flush;

  // Handle craft tool invocation from toolbar
  const handleCraftTool = useCallback(
    (tool: CraftTool) => {
      if (!selectedText) {
        // No selection - open panel with hint
        craftPanel.openTab("craft");
        return;
      }
      craftPanel.callTool(tool, selectedText, selectionContext, undefined, currentChapterIdx + 1);
    },
    [selectedText, selectionContext, craftPanel, currentChapterIdx]
  );

  // Handle inserting craft result into editor
  const handleCraftInsert = useCallback(
    (text: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, text).run();
      } else {
        // Insert at cursor if no selection
        editor.chain().focus().insertContentAt(from, text).run();
      }
      setUndoToast({ visible: true, toolLabel: craftPanel.activeTool || "craft" });
    },
    [editor, craftPanel.activeTool]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!editor) return;
    editor.commands.undo();
    setUndoToast({ visible: false, toolLabel: "" });
  }, [editor]);

  // Handle rerun with new direction
  const handleCraftRerun = useCallback(
    (direction: string) => {
      if (!selectedText || !craftPanel.activeTool) return;
      craftPanel.callTool(craftPanel.activeTool, selectedText, selectionContext, direction, currentChapterIdx + 1);
    },
    [selectedText, selectionContext, craftPanel, currentChapterIdx]
  );

  // Handle brainstorm generate more
  const handleGenerateMore = useCallback(() => {
    if (!selectedText) return;
    craftPanel.callTool("brainstorm", selectedText, selectionContext, undefined, currentChapterIdx + 1);
  }, [selectedText, selectionContext, craftPanel, currentChapterIdx]);

  // Handle retry on error
  const handleCraftRetry = useCallback(() => {
    if (!selectedText || !craftPanel.activeTool) return;
    craftPanel.callTool(craftPanel.activeTool, selectedText, selectionContext, craftPanel.direction, currentChapterIdx + 1);
  }, [selectedText, selectionContext, craftPanel, currentChapterIdx]);

  // Fetch annotations when chapter changes
  useEffect(() => {
    if (!chapter?.id) return;
    const fetchAnnotations = async () => {
      try {
        const res = await fetch(`/api/annotations?chapterId=${chapter.id}`);
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data.annotations ?? []);
        }
      } catch {
        // Silently fail - annotations are non-critical
      }
    };
    fetchAnnotations();
  }, [chapter?.id]);

  // Push annotations into the Tiptap plugin as decorations
  useEffect(() => {
    if (!editor) return;
    const { tr } = editor.state;
    tr.setMeta(annotationPluginKey, {
      annotations: annotations
        .filter((a) => !a.dismissed)
        .map((a) => ({ id: a.id, textMatch: a.textMatch, severity: a.severity })),
    });
    editor.view.dispatch(tr);
  }, [editor, annotations]);

  // Show annotation tooltip on hover (desktop)
  const handleEditorMouseOver = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return;
      const target = e.target as HTMLElement;
      const annotationEl = target.closest("[data-annotation-id]");
      if (annotationEl) {
        const id = annotationEl.getAttribute("data-annotation-id");
        const annotation = annotations.find((a) => a.id === id);
        if (annotation && annotation.id !== activeAnnotation?.id) {
          setActiveAnnotation(annotation);
          setAnnotationAnchorRect(annotationEl.getBoundingClientRect());
        }
      }
    },
    [annotations, activeAnnotation, isMobile]
  );

  // Dismiss annotation
  const handleDismissAnnotation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/annotations/${id}/dismiss`, { method: "POST" });
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Silently fail
    }
    setActiveAnnotation(null);
    setAnnotationAnchorRect(null);
  }, []);

  // Handle annotation click in editor content
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const annotationEl = target.closest("[data-annotation-id]");
      if (annotationEl) {
        const id = annotationEl.getAttribute("data-annotation-id");
        const annotation = annotations.find((a) => a.id === id);
        if (annotation) {
          setActiveAnnotation(annotation);
          setAnnotationAnchorRect(annotationEl.getBoundingClientRect());
          return;
        }
      }
      // Close annotation tooltip on click elsewhere
      if (activeAnnotation) {
        setActiveAnnotation(null);
        setAnnotationAnchorRect(null);
      }
    },
    [annotations, activeAnnotation]
  );

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

  // Continue story with post-generation continuity pipeline
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

      // Post-generation: generate summary and run continuity check (non-blocking)
      const newChapter = updated.chapters[updated.chapters.length - 1];
      if (newChapter?.id) {
        // Generate chapter summary
        fetch(`/api/chapters/${newChapter.id}/summary`, { method: "POST" }).catch(
          () => {}
        );

        // Run continuity check
        fetch("/api/continuity/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId: story.id,
            chapterId: newChapter.id,
          }),
        })
          .then(async (checkRes) => {
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.annotations && checkData.annotations.length > 0) {
                // Map API response to ChapterAnnotation shape
                const newAnnotations: ChapterAnnotation[] = checkData.annotations.map(
                  (a: { text: string; issue: string; sourceChapter: number; severity: string }, idx: number) => ({
                    id: `temp-${idx}-${Date.now()}`,
                    chapterId: newChapter.id,
                    textMatch: a.text,
                    annotationType: "continuity",
                    message: a.issue,
                    sourceChapter: String(a.sourceChapter),
                    severity: a.severity,
                    dismissed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                );
                setAnnotations(newAnnotations);
              }
            }
          })
          .catch(() => {});
      }
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
  const activeAnnotations = annotations.filter((a) => !a.dismissed);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col z-40">
      <EditorToolbar
        story={story}
        currentChapterIdx={currentChapterIdx}
        totalChapters={story.chapters.length}
        showBible={craftPanel.isOpen && craftPanel.activeTab === "bible"}
        annotationCount={activeAnnotations.length}
        activeCraftTool={craftPanel.activeTool}
        hasSelection={selectedText.length > 0}
        craftLoading={craftPanel.loading}
        onBack={handleBack}
        onPrevChapter={() => switchChapter(currentChapterIdx - 1)}
        onNextChapter={() => switchChapter(currentChapterIdx + 1)}
        onToggleBible={() => {
          if (craftPanel.isOpen && craftPanel.activeTab === "bible") {
            craftPanel.closePanel();
          } else {
            craftPanel.openTab("bible");
          }
        }}
        onCraftTool={handleCraftTool}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="px-4 py-3 bg-red-900/30 border-b border-red-700 flex items-center justify-between shrink-0">
          <p className="text-red-200 text-sm">Delete this story permanently?</p>
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
        <div
          className={`flex-1 overflow-y-auto transition-opacity duration-300 ${
            craftPanel.panelWidth === "expanded" ? "opacity-70" : "opacity-100"
          }`}
          onClick={handleEditorClick}
          onMouseOver={handleEditorMouseOver}
          style={{ position: "relative" }}
        >
          <div className="max-w-3xl mx-auto">
            <EditorContent editor={editor} />

            {/* Annotation highlights rendered as overlays */}
            {activeAnnotations.length > 0 && editor && (
              <div className="sr-only" aria-live="polite">
                {activeAnnotations.length} annotation{activeAnnotations.length !== 1 ? "s" : ""} found
              </div>
            )}
          </div>

          {/* Undo toast */}
          {undoToast.visible && (
            <UndoToast
              toolLabel={undoToast.toolLabel}
              onUndo={handleUndo}
              onExpire={() => setUndoToast({ visible: false, toolLabel: "" })}
            />
          )}
        </div>

        {/* Side Panel - desktop always, mobile for Bible/History only */}
        {craftPanel.isOpen && (!isMobile || craftPanel.activeTab !== "craft") && (
          <SidePanel
            storyId={story.id}
            activeTab={craftPanel.activeTab}
            activeTool={craftPanel.activeTool}
            craftResult={craftPanel.result}
            craftLoading={craftPanel.loading}
            craftError={craftPanel.error}
            craftDirection={craftPanel.direction}
            currentChapter={currentChapterIdx + 1}
            panelWidth={craftPanel.panelWidth}
            isMobile={false}
            onTabChange={craftPanel.setTab}
            onClose={craftPanel.closePanel}
            onCraftDirectionChange={craftPanel.setDirection}
            onCraftRerun={handleCraftRerun}
            onCraftInsert={handleCraftInsert}
            onCraftGenerateMore={handleGenerateMore}
            onCraftRetry={handleCraftRetry}
            onHistoryReinsert={handleCraftInsert}
          />
        )}
      </div>

      {/* Mobile craft sheet */}
      {isMobile && craftPanel.isOpen && craftPanel.activeTab === "craft" && (
        <MobileCraftSheet
          isOpen
          activeTool={craftPanel.activeTool}
          result={craftPanel.result}
          loading={craftPanel.loading}
          error={craftPanel.error}
          direction={craftPanel.direction}
          onClose={craftPanel.closePanel}
          onDirectionChange={craftPanel.setDirection}
          onRerun={handleCraftRerun}
          onInsert={(text) => {
            handleCraftInsert(text);
            craftPanel.closePanel();
          }}
          onGenerateMore={handleGenerateMore}
          onRetry={handleCraftRetry}
        />
      )}

      {/* Annotation Tooltip */}
      {activeAnnotation && (
        <AnnotationTooltip
          annotation={activeAnnotation}
          anchorRect={annotationAnchorRect}
          onDismiss={handleDismissAnnotation}
          onClose={() => {
            setActiveAnnotation(null);
            setAnnotationAnchorRect(null);
          }}
        />
      )}

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
