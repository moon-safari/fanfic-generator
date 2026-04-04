"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import type { NewsletterModeConfig, Story } from "../../types/story";
import { ChapterAnnotation } from "../../types/bible";
import { addChapterToDB } from "../../lib/supabase/stories";
import { exportStoryToText } from "../../lib/storage";
import { useAutosave } from "./useAutosave";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useChapterEditor, resolveChapterContent } from "../../hooks/useChapterEditor";
import { useCraftPanel } from "../../hooks/useCraftPanel";
import { CraftTool } from "../../types/craft";
import EditorToolbar from "./EditorToolbar";
import EditorFooter from "./EditorFooter";
import SidePanel from "./SidePanel";
import MobileCraftSheet from "./MobileCraftSheet";
import UndoToast from "./UndoToast";
import AnnotationTooltip from "./AnnotationTooltip";
import { AnnotationExtension, annotationPluginKey } from "./annotationExtension";
import {
  CodexMentionExtension,
  codexMentionPluginKey,
} from "./codexMentionExtension";
import { readSSEStream } from "../../lib/stream";
import { updateStoryTitle, updateChapterContent } from "../../lib/supabase/stories";
import { StoryFormData } from "../../types/story";
import { AdaptationOutputType } from "../../types/adaptation";
import type { PlanningArtifactSubtype } from "../../types/artifact";
import type { ChapterAnnotationAction } from "../../types/bible";
import { useChapterAdaptation } from "../../hooks/useChapterAdaptation";
import { useCodexMentions } from "../../hooks/useCodexMentions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/core";
import { requestJson } from "../../lib/request";

interface StoryEditorProps {
  story: Story;
  streamingFormData?: StoryFormData | null;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
  onStreamingComplete?: () => void;
}

interface CodexFocusRequest {
  entryId: string;
  nonce: number;
}

interface ArtifactFocusRequest {
  sectionType: PlanningArtifactSubtype;
  targetLabel?: string;
  nonce: number;
}

interface AnnotationActionResponse {
  success: boolean;
  resolutionState: "applied" | "intentional_divergence" | "open";
  focusTarget?: {
    sectionType: PlanningArtifactSubtype;
    targetLabel?: string;
  };
}

/** Streaming cursor decoration — pulsing purple cursor at end of doc */
const streamingCursorKey = new PluginKey("streamingCursor");

function createStreamingCursorExtension(isActive: () => boolean) {
  return Extension.create({
    name: "streamingCursor",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: streamingCursorKey,
          props: {
            decorations(state) {
              if (!isActive()) return DecorationSet.empty;
              const pos = state.doc.content.size;
              const cursorEl = document.createElement("span");
              cursorEl.className = "streaming-cursor";
              cursorEl.innerHTML = "&#8203;"; // zero-width space
              return DecorationSet.create(state.doc, [
                Decoration.widget(pos, cursorEl, { side: 1 }),
              ]);
            },
          },
        }),
      ];
    },
  });
}

export default function StoryEditor({
  story,
  streamingFormData,
  onBack,
  onUpdate,
  onDelete,
  onStreamingComplete,
}: StoryEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [codexSuggestionRefreshKey, setCodexSuggestionRefreshKey] = useState(0);
  const [codexFocusRequest, setCodexFocusRequest] =
    useState<CodexFocusRequest | null>(null);
  const [artifactFocusRequest, setArtifactFocusRequest] =
    useState<ArtifactFocusRequest | null>(null);

  // Craft tools state
  const isMobile = useMediaQuery("(max-width: 767px)");
  const craftPanel = useCraftPanel(story.id);
  const [selectedText, setSelectedText] = useState("");
  const [selectionContext, setSelectionContext] = useState("");

  // Undo toast state
  const [undoToast, setUndoToast] = useState<{
    visible: boolean;
    toolLabel: string;
    nonce: number;
  }>({
    visible: false,
    toolLabel: "",
    nonce: 0,
  });

  // Annotations state
  const [annotations, setAnnotations] = useState<ChapterAnnotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<ChapterAnnotation | null>(null);
  const [annotationAnchorRect, setAnnotationAnchorRect] = useState<DOMRect | null>(null);

  // Streaming state
  const [streaming, setStreaming] = useState<{
    active: boolean;
    fullText: string;
    source: "generate" | "continue";
  }>({ active: false, fullText: "", source: "generate" });
  const streamingRef = useRef(streaming);
  streamingRef.current = streaming;

  // Ref to track latest story prop — avoids stale closures in streaming callbacks
  const storyRef = useRef(story);
  storyRef.current = story;

  const streamingCursorExtension = useRef(
    createStreamingCursorExtension(() => streamingRef.current.active)
  ).current;

  // Initial content for useEditor — computed once from story.chapters
  const initialChapterIdx = useRef(story.chapters.length - 1).current;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
      CharacterCount,
      AnnotationExtension,
      CodexMentionExtension,
      streamingCursorExtension,
    ],
    content: resolveChapterContent(story.chapters, initialChapterIdx),
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

  // useChapterEditor owns chapter index, switching, and content sync.
  // Called after useEditor so it receives the real editor instance for the content-sync effect.
  const chapterEditor = useChapterEditor({
    story,
    editor: editor ?? null,
    streamingActive: streaming.active,
  });
  const { currentChapterIdx, currentChapter: chapter, getChapterContent } = chapterEditor;
  const isLatestChapter = currentChapterIdx === story.chapters.length - 1;
  const {
    mentions: currentChapterMentions,
    syncing: mentionSyncing,
    error: mentionError,
    generateMentions,
    clearError: clearMentionError,
  } = useCodexMentions({
    storyId: story.id,
    chapterId: chapter?.id,
    enabled: Boolean(chapter?.id),
  });
  const adaptation = useChapterAdaptation(story.id, story.projectMode, chapter?.id);

  const { flush } = useAutosave({
    editor,
    chapterId: chapter?.id,
  });

  // Handle craft tool invocation from toolbar
  const handleCraftTool = useCallback(
    (tool: CraftTool) => {
      if (streaming.active) return;
      if (!selectedText) {
        // No selection - open panel with hint
        craftPanel.openTab("craft");
        return;
      }
      craftPanel.callTool(tool, selectedText, selectionContext, undefined, currentChapterIdx + 1);
    },
    [selectedText, selectionContext, craftPanel, currentChapterIdx, streaming.active]
  );

  // Handle inserting craft result into editor
  const handleCraftInsert = useCallback(
    (text: string) => {
      if (!editor) return;
      // insertContent replaces current selection or inserts at cursor
      editor.chain().focus().insertContent(text).run();
      setUndoToast((current) => ({
        visible: true,
        toolLabel: craftPanel.activeTool || "craft",
        nonce: current.nonce + 1,
      }));
    },
    [editor, craftPanel.activeTool]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!editor) return;
    editor.commands.undo();
    setUndoToast((current) => ({ ...current, visible: false, toolLabel: "" }));
  }, [editor]);

  // Handle rerun with new direction — use stored selection as fallback since editor selection may have changed
  const handleCraftRerun = useCallback(
    (direction: string) => {
      const text = selectedText || craftPanel.selectedText || "";
      if (!text || !craftPanel.activeTool) return;
      craftPanel.callTool(craftPanel.activeTool, text, selectionContext, direction, currentChapterIdx + 1);
    },
    [selectedText, selectionContext, craftPanel, currentChapterIdx]
  );

  // Handle brainstorm generate more
  const handleGenerateMore = useCallback(() => {
    const text = selectedText || craftPanel.selectedText || "";
    if (!text) return;
    craftPanel.callTool("brainstorm", text, selectionContext, undefined, currentChapterIdx + 1);
  }, [selectedText, selectionContext, craftPanel, currentChapterIdx]);

  // Handle retry on error
  const handleCraftRetry = useCallback(() => {
    const text = selectedText || craftPanel.selectedText || "";
    if (!text || !craftPanel.activeTool) return;
    craftPanel.callTool(craftPanel.activeTool, text, selectionContext, craftPanel.direction, currentChapterIdx + 1);
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

  useEffect(() => {
    if (!editor) return;
    const { tr } = editor.state;
    tr.setMeta(codexMentionPluginKey, {
      mentions: currentChapterMentions.map((mention) => ({
        id: mention.id,
        entryId: mention.entryId,
        startIndex: mention.startIndex,
        endIndex: mention.endIndex,
      })),
    });
    editor.view.dispatch(tr);
  }, [currentChapterMentions, editor]);

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

  const handleOpenAnnotationPlanningTarget = useCallback(
    (annotation: ChapterAnnotation) => {
      const targetSection = annotation.metadata?.targetSection;
      if (!targetSection) {
        return;
      }

      craftPanel.openTab("artifacts");
      setArtifactFocusRequest({
        sectionType: targetSection,
        targetLabel: annotation.metadata?.targetLabel,
        nonce: Date.now(),
      });
      setActiveAnnotation(null);
      setAnnotationAnchorRect(null);
    },
    [craftPanel]
  );

  const handleApplyAnnotationAction = useCallback(
    async (
      annotation: ChapterAnnotation,
      action: ChapterAnnotationAction
    ) => {
      const result = await requestJson<AnnotationActionResponse>(
        `/api/annotations/${annotation.id}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      setAnnotations((prev) => prev.filter((candidate) => candidate.id !== annotation.id));
      setActiveAnnotation(null);
      setAnnotationAnchorRect(null);

      if (result.focusTarget) {
        craftPanel.openTab("artifacts");
        setArtifactFocusRequest({
          sectionType: result.focusTarget.sectionType,
          targetLabel: result.focusTarget.targetLabel,
          nonce: Date.now(),
        });
      }
    },
    [craftPanel]
  );

  // Handle annotation click in editor content
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const mentionEl = target.closest("[data-codex-entry-id]");
      if (mentionEl) {
        const entryId = mentionEl.getAttribute("data-codex-entry-id");
        if (entryId) {
          craftPanel.openTab("codex");
          setCodexFocusRequest({
            entryId,
            nonce: Date.now(),
          });
          setActiveAnnotation(null);
          setAnnotationAnchorRect(null);
          return;
        }
      }

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
    [annotations, activeAnnotation, craftPanel]
  );

  const runChapterPostProcessing = useCallback(
    async (storyId: string, chapterId: string) => {
      try {
        await fetch(`/api/chapters/${chapterId}/summary`, { method: "POST" });
      } catch {
        // Continue without a summary if it fails.
      }

      if (storyRef.current.projectMode !== "newsletter") {
        try {
          const suggestionResponse = await fetch("/api/codex/suggestions/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storyId,
              chapterId,
            }),
          });

          if (suggestionResponse.ok) {
            setCodexSuggestionRefreshKey((prev) => prev + 1);
          }
        } catch {
          // Change detection is helpful but non-blocking.
        }

        try {
          await generateMentions(chapterId);
        } catch {
          // Mention indexing should never block writing.
        }
      }

      try {
        const checkRes = await fetch("/api/continuity/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId,
            chapterId,
          }),
        });

        if (!checkRes.ok) {
          return;
        }

        const checkData = await checkRes.json();
        if (!checkData.annotations || checkData.annotations.length === 0) {
          return;
        }
        setAnnotations(checkData.annotations as ChapterAnnotation[]);
      } catch {
        // Silently fail
      }
    },
    [generateMentions]
  );

  // Chapter switching — coordinates flush at call site via beforeSwitch callback
  const handleSwitchChapter = useCallback(
    (newIdx: number) => chapterEditor.switchChapter(newIdx, () => flush()),
    [chapterEditor, flush]
  );

  const handleArtifactOpenInAdapt = useCallback(
    async (chapterNumber: number, outputType: AdaptationOutputType) => {
      const targetIndex = storyRef.current.chapters.findIndex(
        (candidate) => candidate.chapterNumber === chapterNumber
      );

      if (targetIndex === -1) {
        return;
      }

      await handleSwitchChapter(targetIndex);
      adaptation.setActiveOutputType(outputType);
      craftPanel.openTab("adapt");
    },
    [adaptation, craftPanel, handleSwitchChapter]
  );

  const handleModeConfigUpdated = useCallback(
    (modeConfig: NewsletterModeConfig) => {
      const latestStory = storyRef.current;
      if (latestStory.projectMode !== "newsletter") {
        return;
      }

      onUpdate({
        ...latestStory,
        modeConfig,
        updatedAt: new Date().toISOString(),
      });
    },
    [onUpdate]
  );

  const handleChapterSummaryUpdated = useCallback(
    (chapterId: string, summary: string) => {
      const latestStory = storyRef.current;

      onUpdate({
        ...latestStory,
        updatedAt: new Date().toISOString(),
        chapters: latestStory.chapters.map((candidate) =>
          candidate.id === chapterId
            ? { ...candidate, summary }
            : candidate
        ),
      });
    },
    [onUpdate]
  );

  const handleAdaptationSummaryUpdated = useCallback(
    (summary: string) => {
      const activeChapterId = chapter?.id;

      if (!activeChapterId) {
        return;
      }

      handleChapterSummaryUpdated(activeChapterId, summary);
    },
    [chapter?.id, handleChapterSummaryUpdated]
  );

  // Stream chapter 1 when entering editor with streamingFormData
  useEffect(() => {
    if (!streamingFormData || !editor) return;

    const chapter = story.chapters[0];
    if (!chapter) return;

    // Clear placeholder content and start streaming
    editor.commands.setContent({ type: "doc", content: [] });
    setStreaming({ active: true, fullText: "", source: "generate" });

    let accumulated = "";

    const startStream = async () => {
      try {
        const res = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(streamingFormData),
        });

        if (!res.ok) {
          let errorMsg =
            story.projectMode === "newsletter"
              ? "Failed to generate the first issue"
              : "Failed to generate story";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          } catch {}
          setError(errorMsg);
          setStreaming({ active: false, fullText: "", source: "generate" });
          return;
        }

        await readSSEStream(res, {
          onTitle: (title) => {
            // Fire-and-forget DB update; use storyRef to avoid stale closure
            updateStoryTitle(storyRef.current.id, title).catch(() => {});
            onUpdate({ ...storyRef.current, title });
          },
          onDelta: (text) => {
            accumulated += text;
            setStreaming((prev) => ({ ...prev, fullText: accumulated }));
            editor.commands.insertContent(text);
          },
          onDone: () => {
            setStreaming({ active: false, fullText: "", source: "generate" });
            const latestStory = storyRef.current;
            const ch = latestStory.chapters[0];
            // Save accumulated content to DB
            if (ch) {
              updateChapterContent(ch.id, accumulated).catch(() => {});
            }
            // Update word count — read from storyRef to get latest (includes title update)
            const wordCount = accumulated.trim() ? accumulated.split(/\s+/).length : 0;
            const updatedStory = {
              ...latestStory,
              wordCount,
              chapters: latestStory.chapters.map((c, i) =>
                i === 0 ? { ...c, content: accumulated, wordCount } : c
              ),
            };
            onUpdate(updatedStory);
            onStreamingComplete?.();
            // Trigger story-context generation now that we have content.
            fetch("/api/story-bible/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storyId: latestStory.id }),
            }).catch(() => {});
            if (latestStory.projectMode !== "newsletter") {
              fetch("/api/codex/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId: latestStory.id }),
              })
                .then(async (response) => {
                  if (response.ok && ch?.id) {
                    await generateMentions(ch.id);
                  }
                })
                .catch(() => {});
            }
          },
          onError: (errorMsg) => {
            setError(errorMsg);
            setStreaming({ active: false, fullText: "", source: "generate" });
            // Save whatever we accumulated
            const ch = storyRef.current.chapters[0];
            if (accumulated && ch) {
              updateChapterContent(ch.id, accumulated).catch(() => {});
            }
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Streaming failed");
        setStreaming({ active: false, fullText: "", source: "generate" });
      }
    };

    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingFormData, editor]);

  // Continue story with streaming
  const handleContinue = async () => {
    if (streaming.active) return;
    setLoading(true);
    setError("");

    try {
      await flush();

      const chapterNum = story.chapters.length + 1;

      // Jump to new empty chapter view
      chapterEditor.setChapterIdx(story.chapters.length); // will be out of bounds briefly
      editor?.commands.setContent({ type: "doc", content: [] });
      setStreaming({ active: true, fullText: "", source: "continue" });

      let accumulated = "";

      const res = await fetch("/api/continue-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: story.id }),
      });

      if (!res.ok) {
        let errorMsg =
          story.projectMode === "newsletter"
            ? "Failed to continue the issue sequence"
            : "Failed to continue story";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      await readSSEStream(res, {
        onDelta: (text) => {
          accumulated += text;
          setStreaming((prev) => ({ ...prev, fullText: accumulated }));
          editor?.commands.insertContent(text);
        },
        onDone: async () => {
          setStreaming({ active: false, fullText: "", source: "continue" });
          setLoading(false);

          // Save chapter to DB
          const updated = await addChapterToDB(story.id, chapterNum, accumulated);
          if (!updated) {
            setError("Failed to save chapter");
            return;
          }
          onUpdate(updated);
          chapterEditor.setChapterIdx(updated.chapters.length - 1);

          // Post-generation pipeline (non-blocking)
          const newChapter = updated.chapters[updated.chapters.length - 1];
          if (newChapter?.id) {
            void runChapterPostProcessing(updated.id, newChapter.id);
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setStreaming({ active: false, fullText: "", source: "continue" });
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStreaming({ active: false, fullText: "", source: "continue" });
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
  const toolPanelTab =
    story.projectMode === "newsletter" && craftPanel.activeTab === "codex"
      ? "artifacts"
      : craftPanel.activeTab;
  const toolPanelOpenAction = () => {
    craftPanel.openTab(story.projectMode === "newsletter" ? "artifacts" : "codex");
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col z-40">
      <style>{`
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background: #a855f7;
          margin-left: 1px;
          vertical-align: text-bottom;
          animation: pulse-cursor 1s ease-in-out infinite;
        }
        @keyframes pulse-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <EditorToolbar
        story={story}
        currentChapterIdx={currentChapterIdx}
        totalChapters={story.chapters.length}
        showCodex={craftPanel.isOpen && toolPanelTab !== "craft"}
        annotationCount={activeAnnotations.length}
        activeCraftTool={craftPanel.activeTool}
        craftLoading={craftPanel.loading}
        onBack={handleBack}
        onPrevChapter={() => handleSwitchChapter(currentChapterIdx - 1)}
        onNextChapter={() => handleSwitchChapter(currentChapterIdx + 1)}
        onToggleCodex={() => {
          if (craftPanel.isOpen && toolPanelTab !== "craft") {
            craftPanel.closePanel();
          } else {
            toolPanelOpenAction();
          }
        }}
        onCraftTool={handleCraftTool}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="px-4 py-3 bg-red-900/30 border-b border-red-700 flex items-center justify-between shrink-0">
          <p className="text-red-200 text-sm">Delete this project permanently?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(story.id)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 transition-colors"
            >
              Delete project
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
      <div className="relative flex flex-1 overflow-hidden">
        {/* Editor */}
        <div
          className="flex-1 overflow-y-auto"
          onClick={handleEditorClick}
          onMouseOver={handleEditorMouseOver}
          style={{ position: "relative" }}
        >
          <div className="max-w-3xl mx-auto">
            {streaming.active && streaming.fullText === "" && (
              <div className="px-4 sm:px-8 py-6 text-zinc-500 text-sm flex items-center gap-2">
                <span className="streaming-cursor" style={{ height: '0.9em' }} />
                Writing...
              </div>
            )}
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
              key={undoToast.nonce}
              toolLabel={undoToast.toolLabel}
              onUndo={handleUndo}
              onExpire={() =>
                setUndoToast((current) => ({
                  ...current,
                  visible: false,
                  toolLabel: "",
                }))
              }
            />
          )}
        </div>

        {/* Side Panel - desktop always, mobile for Codex/History only */}
        {craftPanel.isOpen && (!isMobile || craftPanel.activeTab !== "craft") && (
        <SidePanel
          storyId={story.id}
          storyTitle={story.title}
          projectMode={story.projectMode}
          modeConfig={story.modeConfig}
          activeTab={toolPanelTab}
          annotationCount={activeAnnotations.length}
          activeTool={craftPanel.activeTool}
          craftResult={craftPanel.result}
          craftLoading={craftPanel.loading}
          craftError={craftPanel.error}
          craftDirection={craftPanel.direction}
          currentChapter={currentChapterIdx + 1}
          currentChapterId={chapter?.id}
          codexSuggestionRefreshKey={codexSuggestionRefreshKey}
          adaptationActiveOutputType={adaptation.activeOutputType}
          adaptationSelectedChainId={adaptation.selectedChainId}
          adaptationCurrentResult={adaptation.currentResult}
          adaptationResultsByType={adaptation.resultsByType}
          adaptationLoadingOutputType={adaptation.loadingOutputType}
          adaptationDeletingOutputType={adaptation.deletingOutputType}
          adaptationChainLoading={adaptation.chainLoading}
          adaptationError={adaptation.error}
          currentChapterMentions={currentChapterMentions}
          mentionSyncing={mentionSyncing}
          mentionError={mentionError}
          codexFocusRequest={codexFocusRequest}
          artifactFocusRequest={artifactFocusRequest}
          panelWidth={craftPanel.panelWidth}
          onPanelWidthChange={craftPanel.setPanelWidth}
          onTabChange={craftPanel.setTab}
          onClose={craftPanel.closePanel}
          onCraftDirectionChange={craftPanel.setDirection}
          onCraftRerun={handleCraftRerun}
          onCraftInsert={handleCraftInsert}
          onCraftGenerateMore={handleGenerateMore}
          onCraftRetry={handleCraftRetry}
          onHistoryReinsert={handleCraftInsert}
          onArtifactInsert={handleCraftInsert}
          onArtifactOpenInAdapt={handleArtifactOpenInAdapt}
          onArtifactSummaryUpdated={handleChapterSummaryUpdated}
          onModeConfigUpdated={handleModeConfigUpdated}
          onAdaptSelectChainId={adaptation.setSelectedChainId}
          onAdaptSelectOutputType={adaptation.setActiveOutputType}
          onAdaptGenerate={async (outputType) => {
            await adaptation.generate(outputType);
          }}
          onAdaptGenerateChain={async () => {
            await adaptation.generateChain();
          }}
          onAdaptDeleteOutput={async (outputType) => {
            await adaptation.deleteOutput(outputType);
          }}
          onAdaptInsert={handleCraftInsert}
          onAdaptSummaryUpdated={handleAdaptationSummaryUpdated}
          onAdaptDismissError={adaptation.clearError}
          onGenerateMentions={
            chapter?.id
              ? async () => {
                  await generateMentions(chapter.id);
                }
              : undefined
          }
          onDismissMentionError={clearMentionError}
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
          projectMode={story.projectMode}
          anchorRect={annotationAnchorRect}
          onDismiss={handleDismissAnnotation}
          onApplyAction={handleApplyAnnotationAction}
          onOpenPlanningTarget={handleOpenAnnotationPlanningTarget}
          onClose={() => {
            setActiveAnnotation(null);
            setAnnotationAnchorRect(null);
          }}
        />
      )}

      <EditorFooter
        projectMode={story.projectMode}
        wordCount={wordCount}
        isLatestChapter={isLatestChapter}
        loading={loading || streaming.active}
        error={error}
        onContinue={handleContinue}
      />
    </div>
  );
}
