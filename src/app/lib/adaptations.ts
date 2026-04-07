import type {
  AdaptationChainId,
  AdaptationOutputType,
  AdaptationWorkflowStateSource,
} from "../types/adaptation.ts";
import type { ProjectMode, StoryModeConfig } from "../types/story.ts";
import { getScreenplayModeConfig } from "./projectMode.ts";

export interface AdaptationPreset {
  type: AdaptationOutputType;
  label: string;
  description: string;
  stateSources: AdaptationWorkflowStateSource[];
  supportingOutputTypes?: AdaptationOutputType[];
  usesOfficialPackageState?: boolean;
  supportedModes?: ProjectMode[];
  derivedMode?: ProjectMode;
}

export const ADAPTATION_PRESETS: AdaptationPreset[] = [
  {
    type: "argument_evidence_brief",
    label: "Argument & Evidence Brief",
    description:
      "Turn the source section into a production-facing breakdown of argument moves, evidence, cited support, and proof gaps.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
    supportedModes: ["non_fiction"],
  },
  {
    type: "short_summary",
    label: "Short Summary",
    description: "Condense the source draft into a compact, continuity-safe synopsis.",
    stateSources: ["draft", "memory", "plans"],
  },
  {
    type: "newsletter_recap",
    label: "Newsletter Recap",
    description: "Turn the source draft into a punchy recap for readers or subscribers.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
  },
  {
    type: "screenplay_beat_sheet",
    label: "Screenplay Beat Sheet",
    description: "Translate the source draft into visual scene beats for adaptation.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
    supportedModes: ["screenplay"],
  },
  {
    type: "screenplay_scene_pages",
    label: "Screenplay Scene Pages",
    description: "Convert the source material into Fountain-compatible screenplay scene pages.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary", "screenplay_beat_sheet"],
    supportedModes: ["screenplay"],
    derivedMode: "screenplay",
  },
  {
    type: "comic_page_beat_sheet",
    label: "Comic Page Beat Sheet",
    description:
      "Condense the current comic page into visual pacing beats and page-turn pressure.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
    supportedModes: ["comics"],
    derivedMode: "comics",
  },
  {
    type: "quest_handoff_sheet",
    label: "Quest Handoff Sheet",
    description:
      "Turn the source quest brief into a structured production-facing handoff for narrative and quest collaborators.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary"],
    supportedModes: ["game_writing"],
  },
  {
    type: "public_teaser",
    label: "Public Teaser",
    description: "Create a spoiler-aware teaser that preserves intrigue and tone.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportingOutputTypes: ["short_summary", "newsletter_recap"],
  },
  {
    type: "issue_subject_line",
    label: "Subject Line Options",
    description:
      "Generate newsletter-ready subject lines that match the issue angle without sounding spammy.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportingOutputTypes: [
      "issue_deck",
      "issue_hook_variants",
      "issue_cta_variants",
      "issue_section_package",
    ],
    usesOfficialPackageState: true,
    supportedModes: ["newsletter"],
  },
  {
    type: "issue_deck",
    label: "Issue Deck Options",
    description:
      "Generate deck or subtitle options that frame the issue clearly for subscribers.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportingOutputTypes: [
      "issue_subject_line",
      "issue_hook_variants",
      "issue_cta_variants",
      "issue_section_package",
    ],
    usesOfficialPackageState: true,
    supportedModes: ["newsletter"],
  },
  {
    type: "issue_section_package",
    label: "Recurring Section Package",
    description:
      "Draft issue-ready blocks for each recurring section in the publication profile.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportingOutputTypes: [
      "issue_subject_line",
      "issue_deck",
      "issue_hook_variants",
      "issue_cta_variants",
    ],
    usesOfficialPackageState: true,
    supportedModes: ["newsletter"],
  },
  {
    type: "issue_hook_variants",
    label: "Hook Variants",
    description:
      "Generate alternate newsletter openings that preserve the issue promise and voice.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportingOutputTypes: [
      "issue_subject_line",
      "issue_deck",
      "issue_section_package",
      "issue_cta_variants",
    ],
    usesOfficialPackageState: true,
    supportedModes: ["newsletter"],
  },
  {
    type: "issue_cta_variants",
    label: "CTA Variants",
    description:
      "Generate closing CTA options aligned with the publication's reply and reader-conversion style.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportingOutputTypes: [
      "issue_subject_line",
      "issue_deck",
      "issue_hook_variants",
      "issue_section_package",
    ],
    usesOfficialPackageState: true,
    supportedModes: ["newsletter"],
  },
  {
    type: "issue_send_checklist",
    label: "Send Checklist",
    description:
      "Run a newsletter preflight review against the issue angle, recurring sections, CTA style, and package readiness.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportingOutputTypes: [
      "issue_subject_line",
      "issue_deck",
      "issue_section_package",
      "issue_hook_variants",
      "issue_cta_variants",
    ],
    usesOfficialPackageState: true,
    supportedModes: ["newsletter"],
  },
];

export function isAdaptationOutputType(
  value: string
): value is AdaptationOutputType {
  return ADAPTATION_PRESETS.some((preset) => preset.type === value);
}

export function getAdaptationPresetsForMode(
  projectMode: ProjectMode,
  modeConfig?: StoryModeConfig
): AdaptationPreset[] {
  const filtered = ADAPTATION_PRESETS.filter(
    (preset) =>
      !preset.supportedModes || preset.supportedModes.includes(projectMode)
  );

  const screenplayConfig =
    projectMode === "screenplay"
      ? getScreenplayModeConfig({ projectMode, modeConfig })
      : null;

  const preferredOrder: AdaptationOutputType[] =
    projectMode === "newsletter"
      ? [
          "issue_subject_line",
          "issue_deck",
          "issue_section_package",
          "issue_hook_variants",
          "issue_cta_variants",
          "issue_send_checklist",
          "newsletter_recap",
          "public_teaser",
          "short_summary",
        ]
      : projectMode === "screenplay"
        ? screenplayConfig?.draftingPreference === "beat_draft"
          ? [
              "screenplay_scene_pages",
              "screenplay_beat_sheet",
              "short_summary",
              "public_teaser",
              "newsletter_recap",
            ]
          : [
              "screenplay_beat_sheet",
              "screenplay_scene_pages",
              "short_summary",
              "public_teaser",
              "newsletter_recap",
            ]
      : projectMode === "comics"
        ? [
            "comic_page_beat_sheet",
            "short_summary",
            "public_teaser",
            "newsletter_recap",
          ]
      : projectMode === "game_writing"
        ? [
            "quest_handoff_sheet",
            "short_summary",
            "public_teaser",
            "newsletter_recap",
          ]
      : projectMode === "non_fiction"
        ? [
            "argument_evidence_brief",
            "short_summary",
            "public_teaser",
            "newsletter_recap",
          ]
      : [
          "short_summary",
          "newsletter_recap",
          "public_teaser",
          "screenplay_beat_sheet",
          "comic_page_beat_sheet",
        ];

  return filtered.sort(
    (left, right) =>
      preferredOrder.indexOf(left.type) - preferredOrder.indexOf(right.type)
  );
}

export function getAdaptationPreset(
  type: AdaptationOutputType
): AdaptationPreset {
  return (
    ADAPTATION_PRESETS.find((preset) => preset.type === type)
    ?? ADAPTATION_PRESETS[0]
  );
}

export function getAdaptationDerivedMode(
  outputType: AdaptationOutputType
): ProjectMode | null {
  return getAdaptationPreset(outputType).derivedMode ?? null;
}

export interface AdaptationChainStep {
  outputType: AdaptationOutputType;
  source: "chapter" | "previous";
}

export interface AdaptationChainPreset {
  id: AdaptationChainId;
  label: string;
  description: string;
  stateSources: AdaptationWorkflowStateSource[];
  steps: AdaptationChainStep[];
  outputTypes: AdaptationOutputType[];
  supportedModes?: ProjectMode[];
}

function createChainPreset(
  preset: Omit<AdaptationChainPreset, "outputTypes">
): AdaptationChainPreset {
  return {
    ...preset,
    outputTypes: preset.steps.map((step) => step.outputType),
  };
}

export const ADAPTATION_CHAIN_PRESETS: AdaptationChainPreset[] = [
  createChainPreset({
    id: "promo_chain",
    label: "Promo Chain",
    description:
      "Generate a newsletter recap first, then turn it into a public teaser.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    steps: [
      { outputType: "newsletter_recap", source: "chapter" },
      { outputType: "public_teaser", source: "previous" },
    ],
  }),
  createChainPreset({
    id: "summary_to_recap",
    label: "Summary -> Recap",
    description:
      "Start with a compact summary, then expand it into a newsletter recap.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    steps: [
      { outputType: "short_summary", source: "chapter" },
      { outputType: "newsletter_recap", source: "previous" },
    ],
  }),
  createChainPreset({
    id: "summary_to_teaser",
    label: "Summary -> Teaser",
    description:
      "Generate a short summary first, then compress it into a public teaser.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    steps: [
      { outputType: "short_summary", source: "chapter" },
      { outputType: "public_teaser", source: "previous" },
    ],
  }),
  createChainPreset({
    id: "story_to_screen_to_comic",
    label: "Story -> Screen -> Comic",
    description:
      "Turn the current chapter into screenplay scene pages, then condense those pages into a comic page beat sheet.",
    stateSources: ["draft", "memory", "plans", "saved_outputs"],
    supportedModes: ["fiction"],
    steps: [
      { outputType: "screenplay_scene_pages", source: "chapter" },
      { outputType: "comic_page_beat_sheet", source: "previous" },
    ],
  }),
  createChainPreset({
    id: "issue_package",
    label: "Issue Package",
    description:
      "Build the outward-facing newsletter package: subject lines, deck, recurring section drafts, hook variants, CTA variants, and a send checklist.",
    stateSources: [
      "draft",
      "memory",
      "plans",
      "saved_outputs",
      "official_package",
    ],
    supportedModes: ["newsletter"],
    steps: [
      { outputType: "issue_subject_line", source: "chapter" },
      { outputType: "issue_deck", source: "chapter" },
      { outputType: "issue_section_package", source: "chapter" },
      { outputType: "issue_hook_variants", source: "chapter" },
      { outputType: "issue_cta_variants", source: "chapter" },
      { outputType: "issue_send_checklist", source: "chapter" },
    ],
  }),
];

export function isAdaptationChainId(value: string): value is AdaptationChainId {
  return ADAPTATION_CHAIN_PRESETS.some((preset) => preset.id === value);
}

export function getAdaptationChainPresetsForMode(
  projectMode: ProjectMode
): AdaptationChainPreset[] {
  const filtered = ADAPTATION_CHAIN_PRESETS.filter(
    (preset) =>
      !preset.supportedModes || preset.supportedModes.includes(projectMode)
  );

  const preferredOrder: AdaptationChainId[] =
    projectMode === "newsletter"
      ? [
          "issue_package",
          "promo_chain",
          "summary_to_recap",
          "summary_to_teaser",
        ]
      : projectMode === "fiction"
        ? [
            "story_to_screen_to_comic",
            "promo_chain",
            "summary_to_recap",
            "summary_to_teaser",
          ]
        : ["promo_chain", "summary_to_recap", "summary_to_teaser"];

  return filtered.sort(
    (left, right) =>
      preferredOrder.indexOf(left.id) - preferredOrder.indexOf(right.id)
  );
}

export function getAdaptationChainPreset(
  id: AdaptationChainId
): AdaptationChainPreset {
  return (
    ADAPTATION_CHAIN_PRESETS.find((preset) => preset.id === id)
    ?? ADAPTATION_CHAIN_PRESETS[0]
  );
}

export function isAdaptationOutputTypeEnabled(
  outputType: AdaptationOutputType,
  projectMode: ProjectMode
): boolean {
  return getAdaptationPresetsForMode(projectMode).some(
    (preset) => preset.type === outputType
  );
}

export function isAdaptationChainIdEnabled(
  chainId: AdaptationChainId,
  projectMode: ProjectMode
): boolean {
  return getAdaptationChainPresetsForMode(projectMode).some(
    (preset) => preset.id === chainId
  );
}

export function getDefaultAdaptationOutputType(
  projectMode: ProjectMode,
  modeConfig?: StoryModeConfig
): AdaptationOutputType {
  return getAdaptationPresetsForMode(projectMode, modeConfig)[0]?.type
    ?? "short_summary";
}

export function getDefaultAdaptationChainId(
  projectMode: ProjectMode
): AdaptationChainId {
  return projectMode === "newsletter"
    ? "issue_package"
    : projectMode === "fiction"
      ? "story_to_screen_to_comic"
      : "promo_chain";
}

export interface SelectableAdaptationOutputTypesArgs {
  projectMode: ProjectMode;
  selectedChainId: AdaptationChainId;
  savedOutputTypes?: AdaptationOutputType[];
  modeConfig?: StoryModeConfig;
}

export function getSelectableAdaptationOutputTypes({
  projectMode,
  selectedChainId,
  savedOutputTypes = [],
  modeConfig,
}: SelectableAdaptationOutputTypesArgs): AdaptationOutputType[] {
  const orderedTypes: AdaptationOutputType[] = [];
  const pushUnique = (outputType: AdaptationOutputType) => {
    if (!orderedTypes.includes(outputType)) {
      orderedTypes.push(outputType);
    }
  };

  for (const preset of getAdaptationPresetsForMode(projectMode, modeConfig)) {
    pushUnique(preset.type);
  }

  const selectedChain = getAdaptationChainPreset(selectedChainId);
  for (const outputType of selectedChain.outputTypes) {
    pushUnique(outputType);
  }

  for (const outputType of savedOutputTypes) {
    if (getAdaptationDerivedMode(outputType)) {
      pushUnique(outputType);
    }
  }

  return orderedTypes;
}

export function formatAdaptationWorkflowStateSource(
  source: AdaptationWorkflowStateSource
): string {
  switch (source) {
    case "draft":
      return "current draft";
    case "memory":
      return "memory";
    case "plans":
      return "plans";
    case "saved_outputs":
      return "saved outputs";
    case "official_package":
      return "official package";
    default:
      return source;
  }
}
