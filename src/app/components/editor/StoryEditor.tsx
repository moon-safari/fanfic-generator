"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import type { NewsletterModeConfig, Story } from "../../types/story";
import { exportStoryToText } from "../../lib/storage";
import { useAutosave } from "./useAutosave";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useChapterEditor, resolveChapterContent } from "../../hooks/useChapterEditor";
import { useCraftPanel } from "../../hooks/useCraftPanel";
import { useCodexFocus } from "../../hooks/useCodexFocus";
import { useChapterAnnotations } from "../../hooks/useChapterAnnotations";
import { useStoryStreaming } from "../../hooks/useStoryStreaming";
import { CraftTool } from "../../types/craft";
import EditorToolbar from "./EditorToolbar";
import EditorFooter from "./EditorFooter";
import SidePanel from "./SidePanel";
import MobileCraftSheet from "./MobileCraftSheet";
import UndoToast from "./UndoToast";
import AnnotationTooltip from "./AnnotationTooltip";
import { AnnotationExtension } from "./annotationExtension";
import {
  CodexMentionExtension,
  codexMentionPluginKey,
} from "./codexMentionExtension";
import { StoryFormData } from "../../types/story";
import { AdaptationOutputType } from "../../types/adaptation";
import type { ChapterAnnotation, ChapterAnnotationAction } from "../../types/bible";
import { useChapterAdaptation } from "../../hooks/useChapterAdaptation";
import { useCodexMentions } from "../../hooks/useCodexMentions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/core";
interface StoryEditorProps {
  story: Story;
  streamingFormData?: StoryFormData | null;
  onBack: () => void;
  onUpdate: (story: Story) => void;
  onDelete: (id: string) => void;
  onStreamingComplete?: () => void;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [codexSuggestionRefreshKey, setCodexSuggestionRefreshKey] = useState(0);
  const codexFocus = useCodexFocus();

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

  // Ref for streaming cursor decoration — updated below after hook call
  const streamingRef = useRef<{ active: boolean; fullText: string; source: "initial" | "continue" | null }>({ active: false, fullText: "", source: null });

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
    streamingActive: streamingRef.current.active,
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
  const chapterAnnotations = useChapterAnnotations({
    chapterId: chapter?.id,
    editor: editor ?? null,
    isMobile,
  });

  const autosave = useAutosave({
    editor,
    chapterId: chapter?.id,
  });
  const { flush } = autosave;

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
        // Refresh annotations via hook (sets pendingNotification for warnings/errors)
        await chapterAnnotations.refresh(chapterId);
      } catch {
        // Silently fail
      }
    },
    [generateMentions, chapterAnnotations]
  );

  // Streaming — initial generation + continuation
  const storyStreaming = useStoryStreaming({
    editor: editor ?? null,
    storyRef,
    streamingFormData,
    onUpdate,
    onPostProcess: runChapterPostProcessing,
    onStreamingComplete,
    setChapterIdx: chapterEditor.setChapterIdx,
    generateMentions,
    flush,
  });
  const { streaming, loading, error, setError, handleContinue } = storyStreaming;
  streamingRef.current = streaming;

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

  // Auto-dismiss continuity notification toast after 8 seconds
  useEffect(() => {
    if (!chapterAnnotations.pendingNotification) return;
    const timer = setTimeout(() => chapterAnnotations.clearNotification(), 8000);
    return () => clearTimeout(timer);
  }, [chapterAnnotations.pendingNotification, chapterAnnotations.clearNotification]);

  // Annotation planning target navigation — coordinates between hook and side panel
  const handleOpenAnnotationPlanningTarget = useCallback(
    (annotation: ChapterAnnotation) => {
      const target = chapterAnnotations.handleOpenPlanningTarget(annotation);
      if (target) {
        craftPanel.openTab("artifacts");
        codexFocus.focusArtifact(target.sectionType, target.targetLabel);
      }
    },
    [chapterAnnotations, craftPanel, codexFocus]
  );

  // Annotation action — coordinates focus target navigation
  const handleApplyAnnotationAction = useCallback(
    async (
      annotation: ChapterAnnotation,
      action: ChapterAnnotationAction
    ) => {
      const result = await chapterAnnotations.handleApplyAction(annotation, action);
      if (result?.focusTarget) {
        craftPanel.openTab("artifacts");
        codexFocus.focusArtifact(
          result.focusTarget.sectionType,
          result.focusTarget.targetLabel
        );
      }
    },
    [chapterAnnotations, craftPanel, codexFocus]
  );

  // Thin dispatcher: mention click → annotation click
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      if (codexFocus.handleMentionClick(e)) return;
      chapterAnnotations.handleClick(e);
    },
    [codexFocus, chapterAnnotations]
  );

  // Chapter switching — coordinates flush at call site via beforeSwitch callback
  const handleSwitchChapter = useCallback(
    (newIdx: number) => chapterEditor.switchChapter(newIdx, () => flush()),
    [chapterEditor.switchChapter, flush]
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
  const activeAnnotations = chapterAnnotations.annotations.filter((a) => !a.dismissed);
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
        streamingActive={storyStreaming.streaming.active}
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
          onMouseOver={chapterAnnotations.handleMouseOver}
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
          codexFocusRequest={codexFocus.codexFocusRequest}
          artifactFocusRequest={codexFocus.artifactFocusRequest}
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

      {/* Continuity check notification toast */}
      {chapterAnnotations.pendingNotification && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-amber-700/50 bg-amber-950/90 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-200">
              {chapterAnnotations.pendingNotification.count} continuity issue
              {chapterAnnotations.pendingNotification.count !== 1 ? "s" : ""} found
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.querySelector(
                  `[data-annotation-id="${chapterAnnotations.pendingNotification!.firstAnnotation.id}"]`
                );
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                chapterAnnotations.clearNotification();
              }}
              className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Streaming failure recovery banner */}
      {storyStreaming.streamError && (
        <div className="mx-4 mt-2 rounded-2xl border border-red-800/40 bg-red-950/30 p-4">
          <p className="text-sm font-medium text-red-300">Generation interrupted</p>
          <p className="mt-1 text-sm text-zinc-400">{storyStreaming.streamError.message}</p>
          <div className="mt-3 flex gap-2">
            {storyStreaming.streamError.hasPartialContent ? (
              <button
                onClick={() => storyStreaming.clearStreamError()}
                className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
              >
                Keep what was generated
              </button>
            ) : (
              <button
                onClick={onBack}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Go back
              </button>
            )}
          </div>
        </div>
      )}

      {/* Annotation Tooltip */}
      {chapterAnnotations.activeAnnotation && (
        <AnnotationTooltip
          annotation={chapterAnnotations.activeAnnotation}
          projectMode={story.projectMode}
          anchorRect={chapterAnnotations.annotationAnchorRect}
          onDismiss={chapterAnnotations.handleDismiss}
          onApplyAction={handleApplyAnnotationAction}
          onOpenPlanningTarget={handleOpenAnnotationPlanningTarget}
          onClose={chapterAnnotations.closeTooltip}
        />
      )}

      <EditorFooter
        projectMode={story.projectMode}
        wordCount={wordCount}
        isLatestChapter={isLatestChapter}
        loading={loading || streaming.active}
        error={error}
        saveError={autosave.lastSaveError}
        onContinue={handleContinue}
      />
    </div>
  );
}
