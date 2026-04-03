import type { ChapterAnnotationMetadata } from "../types/bible";

export function parseAnnotationMetadata(
  input: unknown
): ChapterAnnotationMetadata | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const record = input as Record<string, unknown>;
  const metadata: ChapterAnnotationMetadata = {};

  if (
    record.reasonType === "fact_contradiction"
    || record.reasonType === "intent_miss"
    || record.reasonType === "reveal_drift"
    || record.reasonType === "due_thread"
    || record.reasonType === "arc_drift"
    || record.reasonType === "promise_drift"
    || record.reasonType === "voice_drift"
    || record.reasonType === "hook_drift"
    || record.reasonType === "cta_drift"
    || record.reasonType === "segment_drift"
  ) {
    metadata.reasonType = record.reasonType;
  }

  if (
    record.targetSection === "synopsis"
    || record.targetSection === "style_guide"
    || record.targetSection === "outline"
    || record.targetSection === "notes"
  ) {
    metadata.targetSection = record.targetSection;
  }

  if (typeof record.targetLabel === "string" && record.targetLabel.trim()) {
    metadata.targetLabel = record.targetLabel.trim();
  }

  if (typeof record.reasonDetail === "string" && record.reasonDetail.trim()) {
    metadata.reasonDetail = record.reasonDetail.trim();
  }

  if (typeof record.targetState === "string" && record.targetState.trim()) {
    metadata.targetState = record.targetState.trim();
  }

  if (typeof record.targetHorizon === "string" && record.targetHorizon.trim()) {
    metadata.targetHorizon = record.targetHorizon.trim();
  }

  if (typeof record.targetUnit === "number" && Number.isFinite(record.targetUnit)) {
    metadata.targetUnit = record.targetUnit;
  }

  if (
    record.suggestedAction === "review_outline"
    || record.suggestedAction === "review_notes"
    || record.suggestedAction === "review_synopsis"
    || record.suggestedAction === "review_style_guide"
    || record.suggestedAction === "dismiss_if_intentional"
  ) {
    metadata.suggestedAction = record.suggestedAction;
  }

  if (
    record.resolutionState === "open"
    || record.resolutionState === "applied"
    || record.resolutionState === "intentional_divergence"
  ) {
    metadata.resolutionState = record.resolutionState;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export function buildAnnotationResolutionKey(input: {
  annotationType: string;
  textMatch: string;
  sourceChapter?: string | number | null;
  metadata?: ChapterAnnotationMetadata;
}) {
  return [
    input.annotationType.trim().toLowerCase(),
    normalizeAnnotationValue(input.textMatch),
    input.sourceChapter === null || input.sourceChapter === undefined
      ? ""
      : String(input.sourceChapter).trim(),
    input.metadata?.reasonType ?? "",
    input.metadata?.targetSection ?? "",
    normalizeAnnotationValue(input.metadata?.targetLabel ?? ""),
  ].join("::");
}

export function isResolvedAnnotationMetadata(
  metadata: ChapterAnnotationMetadata | undefined
) {
  return (
    metadata?.resolutionState === "applied"
    || metadata?.resolutionState === "intentional_divergence"
  );
}

function normalizeAnnotationValue(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
