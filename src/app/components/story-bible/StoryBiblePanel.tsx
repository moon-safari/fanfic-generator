"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Users,
  Globe,
  FileText,
  Palette,
  PenTool,
  List,
  StickyNote,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import {
  StoryBible,
  BibleSectionType,
  BibleSectionContent,
  BibleCharactersContent,
  BibleWorldContent,
  BibleSynopsisContent,
  BibleGenreContent,
  BibleStyleGuideContent,
  BibleOutlineContent,
  BibleNotesContent,
} from "../../types/bible";
import BibleSection from "./BibleSection";
import CharacterCard from "./CharacterCard";
import WorldEditor from "./WorldEditor";
import SynopsisEditor from "./SynopsisEditor";
import GenreEditor from "./GenreEditor";
import StyleGuideEditor from "./StyleGuideEditor";
import OutlineEditor from "./OutlineEditor";
import NotesEditor from "./NotesEditor";

interface StoryBiblePanelProps {
  storyId: string;
  onClose: () => void;
}

const SECTION_CONFIG: {
  type: BibleSectionType;
  icon: typeof Users;
  title: string;
}[] = [
  { type: "characters", icon: Users, title: "Characters" },
  { type: "world", icon: Globe, title: "World" },
  { type: "synopsis", icon: FileText, title: "Synopsis" },
  { type: "genre", icon: Palette, title: "Genre & Warnings" },
  { type: "style_guide", icon: PenTool, title: "Style Guide" },
  { type: "outline", icon: List, title: "Outline" },
  { type: "notes", icon: StickyNote, title: "Notes" },
];

export default function StoryBiblePanel({
  storyId,
  onClose,
}: StoryBiblePanelProps) {
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<BibleSectionType | null>(
    "characters"
  );
  const [regenerating, setRegenerating] = useState(false);

  // Debounced save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBible = useCallback(async () => {
    try {
      const res = await fetch(`/api/story-bible/${storyId}`);
      if (res.ok) {
        const data = await res.json();
        setBible(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchBible();
  }, [fetchBible]);

  const saveSection = useCallback(
    (sectionType: BibleSectionType, content: BibleSectionContent) => {
      // Update local state immediately
      setBible((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: {
            ...prev.sections,
            [sectionType]: prev.sections[sectionType]
              ? { ...prev.sections[sectionType], content }
              : {
                  id: "",
                  storyId,
                  sectionType,
                  content,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
          },
        };
      });

      // Debounced save to server
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/story-bible/${storyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionType, content }),
          });
        } catch {
          // silently fail
        }
      }, 1000);
    },
    [storyId]
  );

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await fetch("/api/story-bible/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      await fetchBible();
    } catch {
      // silently fail
    } finally {
      setRegenerating(false);
    }
  };

  const getSectionContent = (type: BibleSectionType): BibleSectionContent | null => {
    return bible?.sections[type]?.content ?? null;
  };

  const getCharacterCount = (): number | undefined => {
    const content = getSectionContent("characters") as BibleCharactersContent | null;
    return content?.characters?.length;
  };

  const getOutlineCount = (): number | undefined => {
    const content = getSectionContent("outline") as BibleOutlineContent | null;
    return content?.chapters?.length;
  };

  const renderSectionContent = (type: BibleSectionType) => {
    switch (type) {
      case "characters":
        return (
          <CharacterCard
            content={getSectionContent(type) as BibleCharactersContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
      case "world":
        return (
          <WorldEditor
            content={getSectionContent(type) as BibleWorldContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
      case "synopsis":
        return (
          <SynopsisEditor
            content={getSectionContent(type) as BibleSynopsisContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
      case "genre":
        return (
          <GenreEditor
            content={getSectionContent(type) as BibleGenreContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
      case "style_guide":
        return (
          <StyleGuideEditor
            content={getSectionContent(type) as BibleStyleGuideContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
      case "outline":
        return (
          <OutlineEditor
            content={getSectionContent(type) as BibleOutlineContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
      case "notes":
        return (
          <NotesEditor
            content={getSectionContent(type) as BibleNotesContent | null}
            onSave={(c) => saveSection(type, c)}
          />
        );
    }
  };

  const getCount = (type: BibleSectionType): number | undefined => {
    if (type === "characters") return getCharacterCount();
    if (type === "outline") return getOutlineCount();
    return undefined;
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className="w-full sm:w-[35%] sm:min-w-[320px] bg-[#2a1f3d] border-l border-purple-900/50 flex flex-col overflow-y-auto fixed inset-0 sm:static z-50">
        <div className="flex items-center justify-between px-4 h-14 border-b border-purple-900/30 shrink-0">
          <div className="h-5 w-24 bg-purple-900/30 rounded animate-pulse" />
          <div className="h-8 w-8 bg-purple-900/30 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-purple-900/20 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-[35%] sm:min-w-[320px] bg-[#2a1f3d] border-l border-purple-900/50 flex flex-col overflow-y-auto fixed inset-0 sm:static z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-purple-900/30 shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile back button */}
          <button
            onClick={onClose}
            className="sm:hidden p-1 text-zinc-400 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold text-white">Story Bible</h2>
        </div>
        <button
          onClick={onClose}
          className="hidden sm:block p-1 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {SECTION_CONFIG.map((cfg) => (
          <BibleSection
            key={cfg.type}
            icon={cfg.icon}
            title={cfg.title}
            count={getCount(cfg.type)}
            isOpen={openSection === cfg.type}
            onToggle={() =>
              setOpenSection((prev) =>
                prev === cfg.type ? null : cfg.type
              )
            }
          >
            {renderSectionContent(cfg.type)}
          </BibleSection>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-purple-900/30 shrink-0">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-purple-300 border border-purple-700/50 hover:bg-purple-900/30 disabled:opacity-50 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
          />
          {regenerating ? "Re-checking..." : "Re-check continuity"}
        </button>
      </div>
    </div>
  );
}
