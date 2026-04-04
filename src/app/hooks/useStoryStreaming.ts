import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import type { Story, StoryFormData } from "../types/story";
import { readSSEStream } from "../lib/stream";
import {
  updateStoryTitle,
  updateChapterContent,
  addChapterToDB,
} from "../lib/supabase/stories";

export interface UseStoryStreamingOptions {
  editor: Editor | null;
  storyRef: React.MutableRefObject<Story>;
  streamingFormData?: StoryFormData | null;
  onUpdate: (story: Story) => void;
  onPostProcess: (storyId: string, chapterId: string) => void;
  onStreamingComplete?: () => void;
  setChapterIdx: (idx: number) => void;
  generateMentions: (chapterId: string) => Promise<unknown>;
  flush: () => Promise<void>;
}

export interface StreamingState {
  active: boolean;
  fullText: string;
  source: "initial" | "continue" | null;
}

export interface StreamError {
  hasPartialContent: boolean;
  message: string;
}

export interface UseStoryStreamingReturn {
  streaming: StreamingState;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  handleContinue: () => Promise<void>;
  startInitialStream: () => void;
  streamError: StreamError | null;
}

export function useStoryStreaming({
  editor,
  storyRef,
  streamingFormData,
  onUpdate,
  onPostProcess,
  onStreamingComplete,
  setChapterIdx,
  generateMentions,
  flush,
}: UseStoryStreamingOptions): UseStoryStreamingReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [streamError, setStreamError] = useState<StreamError | null>(null);
  const [streaming, setStreaming] = useState<StreamingState>({
    active: false,
    fullText: "",
    source: null,
  });

  // Manually triggerable initial stream — currently auto-fires via useEffect,
  // but exposed so callers can re-trigger if needed.
  const startInitialStream = useCallback(() => {
    if (!streamingFormData || !editor) return;

    const chapter = storyRef.current.chapters[0];
    if (!chapter) return;

    // Clear placeholder content and start streaming
    editor?.commands.setContent({ type: "doc", content: [] });
    setStreaming({ active: true, fullText: "", source: "initial" });
    setStreamError(null);

    let accumulated = "";

    const run = async () => {
      try {
        const res = await fetch("/api/generate-story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(streamingFormData),
        });

        if (!res.ok) {
          let errorMsg =
            storyRef.current.projectMode === "newsletter"
              ? "Failed to generate the first issue"
              : "Failed to generate story";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          } catch {}
          setError(errorMsg);
          setStreamError({ hasPartialContent: accumulated.length > 0, message: errorMsg });
          setStreaming({ active: false, fullText: "", source: "initial" });
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
            editor?.commands.insertContent(text);
          },
          onDone: () => {
            setStreaming({ active: false, fullText: "", source: "initial" });
            const latestStory = storyRef.current;
            const ch = latestStory.chapters[0];
            // Save accumulated content to DB
            if (ch) {
              updateChapterContent(ch.id, accumulated).catch(() => {});
            }
            // Update word count — read from storyRef to get latest (includes title update)
            const wordCount = accumulated.trim()
              ? accumulated.split(/\s+/).length
              : 0;
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
            setStreamError({ hasPartialContent: accumulated.length > 0, message: errorMsg });
            setStreaming({ active: false, fullText: "", source: "initial" });
            // Save whatever we accumulated
            const ch = storyRef.current.chapters[0];
            if (accumulated && ch) {
              updateChapterContent(ch.id, accumulated).catch(() => {});
            }
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Streaming failed";
        setError(message);
        setStreamError({ hasPartialContent: accumulated.length > 0, message });
        setStreaming({ active: false, fullText: "", source: "initial" });
      }
    };

    run();
  }, [streamingFormData, editor, storyRef, onUpdate, onStreamingComplete, generateMentions]);

  // Stream chapter 1 when entering editor with streamingFormData
  useEffect(() => {
    if (!streamingFormData || !editor) return;
    startInitialStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingFormData, editor]);

  // Continue story with streaming
  const handleContinue = useCallback(async () => {
    if (streaming.active) return;
    setLoading(true);
    setError("");
    setStreamError(null);

    const story = storyRef.current;

    try {
      await flush();

      const chapterNum = story.chapters.length + 1;

      // Jump to new empty chapter view
      setChapterIdx(story.chapters.length); // will be out of bounds briefly
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
          setChapterIdx(updated.chapters.length - 1);

          // Post-generation pipeline (non-blocking)
          const newChapter = updated.chapters[updated.chapters.length - 1];
          if (newChapter?.id) {
            void onPostProcess(updated.id, newChapter.id);
          }
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setStreamError({ hasPartialContent: accumulated.length > 0, message: errorMsg });
          setStreaming({ active: false, fullText: "", source: "continue" });
          setLoading(false);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setStreamError({ hasPartialContent: false, message });
      setStreaming({ active: false, fullText: "", source: "continue" });
      setLoading(false);
    }
  }, [streaming.active, storyRef, flush, setChapterIdx, editor, onUpdate, onPostProcess]);

  return {
    streaming,
    loading,
    error,
    setError,
    handleContinue,
    startInitialStream,
    streamError,
  };
}
