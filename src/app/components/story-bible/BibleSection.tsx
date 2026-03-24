"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

interface BibleSectionProps {
  icon: LucideIcon;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}

export default function BibleSection({
  icon: Icon,
  title,
  count,
  isOpen: controlledOpen,
  onToggle,
  defaultOpen = false,
  children,
}: BibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((v) => !v);
    }
  };

  return (
    <div className="border-b border-purple-900/30 last:border-b-0">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-900/20 transition-colors"
      >
        <Icon className="w-4 h-4 text-purple-400 shrink-0" />
        <span className="text-sm font-medium text-white flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
