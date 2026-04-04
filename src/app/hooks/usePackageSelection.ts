import { useEffect, useState } from "react";
import {
  getNewsletterSelectionFieldForOutputType,
  parseNumberedOptions,
} from "../lib/artifactsHelpers";
import { getErrorMessage, requestJson } from "../lib/request";
import type { AdaptationOutputType } from "../types/adaptation";
import type {
  NewsletterIssuePackageSelection,
  NewsletterIssuePackageSelectionField,
  NewsletterIssuePackageSelectionValues,
} from "../types/newsletter";
import {
  EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES,
  NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS,
} from "../types/newsletter";
import type { ProjectMode } from "../types/story";

interface UsePackageSelectionArgs {
  artifact: {
    id: string;
    kind: string;
    subtype: string;
    chapterId: string;
    content: string;
  } | null;
  storyId: string;
  projectMode: ProjectMode;
  onPackageSelectionUpdated?: (chapterId: string) => void;
}

export interface PackageSelectionState {
  packageSelection: NewsletterIssuePackageSelection | null;
  packageSelectionDrafts: NewsletterIssuePackageSelectionValues;
  setPackageSelectionDrafts: React.Dispatch<
    React.SetStateAction<NewsletterIssuePackageSelectionValues>
  >;
  packageSelectionLoading: boolean;
  packageSelectionSavingField: NewsletterIssuePackageSelectionField | null;
  packageSelectionError: string | null;
  packageSelectionMessage: string | null;
  packageSelectionTone: "success" | "error";
  showOfficialEditor: boolean;
  setShowOfficialEditor: React.Dispatch<React.SetStateAction<boolean>>;
  selectionField: NewsletterIssuePackageSelectionField | null;
  currentSelectionValue: string;
  currentSelectionDraftValue: string;
  hasUnsavedSelectionDraft: boolean;
  parsedArtifactOptions: string[];
  showArtifactOfficialChoices: boolean;
  singleArtifactOfficialValue: string;
  persistSelectionField: (
    field: NewsletterIssuePackageSelectionField,
    value: string
  ) => Promise<void>;
}

export function usePackageSelection({
  artifact,
  storyId,
  projectMode,
  onPackageSelectionUpdated,
}: UsePackageSelectionArgs): PackageSelectionState {
  const [packageSelection, setPackageSelection] =
    useState<NewsletterIssuePackageSelection | null>(null);
  const [packageSelectionDrafts, setPackageSelectionDrafts] =
    useState<NewsletterIssuePackageSelectionValues>(
      EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES
    );
  const [packageSelectionLoading, setPackageSelectionLoading] = useState(false);
  const [packageSelectionSavingField, setPackageSelectionSavingField] =
    useState<NewsletterIssuePackageSelectionField | null>(null);
  const [packageSelectionError, setPackageSelectionError] = useState<string | null>(
    null
  );
  const [packageSelectionMessage, setPackageSelectionMessage] = useState<string | null>(
    null
  );
  const [packageSelectionTone, setPackageSelectionTone] =
    useState<"success" | "error">("success");
  const [showOfficialEditor, setShowOfficialEditor] = useState(false);

  // Reset state when artifact changes
  useEffect(() => {
    setPackageSelection(null);
    setPackageSelectionDrafts(EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES);
    setPackageSelectionLoading(false);
    setPackageSelectionSavingField(null);
    setPackageSelectionError(null);
    setPackageSelectionMessage(null);
    setPackageSelectionTone("success");
    setShowOfficialEditor(false);
  }, [artifact?.id]);

  const selectionField =
    projectMode === "newsletter" && artifact?.kind === "adaptation"
      ? getNewsletterSelectionFieldForOutputType(
          artifact.subtype as AdaptationOutputType
        )
      : null;

  const currentSelectionValue = selectionField
    ? packageSelection?.[selectionField] ?? ""
    : "";
  const currentSelectionDraftValue = selectionField
    ? packageSelectionDrafts[selectionField] ?? ""
    : "";
  const hasUnsavedSelectionDraft =
    selectionField !== null
    && currentSelectionDraftValue.trim() !== currentSelectionValue.trim();
  const parsedArtifactOptions =
    selectionField !== null ? parseNumberedOptions(artifact?.content ?? "") : [];
  const showArtifactOfficialChoices =
    selectionField !== null
    && selectionField !== "sectionPackage"
    && parsedArtifactOptions.length > 1;
  const singleArtifactOfficialValue =
    selectionField === null
      ? ""
      : showArtifactOfficialChoices
        ? ""
        : parsedArtifactOptions[0] ?? artifact?.content.trim() ?? "";

  // Load package selection when viewing a newsletter adaptation artifact
  useEffect(() => {
    if (
      !artifact
      || projectMode !== "newsletter"
      || artifact.kind !== "adaptation"
      || !selectionField
    ) {
      return;
    }

    let cancelled = false;
    setPackageSelectionLoading(true);
    setPackageSelectionError(null);

    void requestJson<{ selection: NewsletterIssuePackageSelection }>(
      `/api/newsletter/${storyId}/package?chapterId=${artifact.chapterId}`
    )
      .then((data) => {
        if (cancelled) {
          return;
        }

        setPackageSelection(data.selection);
        setPackageSelectionDrafts({
          subjectLine: data.selection.subjectLine,
          deck: data.selection.deck,
          hook: data.selection.hook,
          cta: data.selection.cta,
          sectionPackage: data.selection.sectionPackage,
        });
      })
      .catch((selectionError: unknown) => {
        if (cancelled) {
          return;
        }

        setPackageSelectionError(
          getErrorMessage(
            selectionError,
            "Failed to load official package state"
          )
        );
      })
      .finally(() => {
        if (!cancelled) {
          setPackageSelectionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [artifact, projectMode, selectionField, storyId]);

  const persistSelectionField = async (
    field: NewsletterIssuePackageSelectionField,
    value: string
  ) => {
    if (!artifact || artifact.kind !== "adaptation") {
      return;
    }

    setPackageSelectionSavingField(field);
    setPackageSelectionError(null);
    setPackageSelectionMessage(null);
    setPackageSelectionTone("success");

    try {
      const data = await requestJson<{ selection: NewsletterIssuePackageSelection }>(
        `/api/newsletter/${storyId}/package`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: artifact.chapterId,
            field,
            value,
          }),
        }
      );

      setPackageSelection(data.selection);
      setPackageSelectionDrafts((prev) => ({
        ...prev,
        [field]: data.selection[field],
      }));
      setPackageSelectionMessage(
        value.trim()
          ? `Official ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[
              field
            ].toLowerCase()} updated from this saved output.`
          : `Official ${NEWSLETTER_ISSUE_PACKAGE_SELECTION_FIELD_LABELS[
              field
            ].toLowerCase()} cleared.`
      );
      onPackageSelectionUpdated?.(artifact.chapterId);
    } catch (selectionError: unknown) {
      setPackageSelectionTone("error");
      setPackageSelectionError(
        getErrorMessage(
          selectionError,
          "Failed to update official package state"
        )
      );
    } finally {
      setPackageSelectionSavingField(null);
    }
  };

  return {
    packageSelection,
    packageSelectionDrafts,
    setPackageSelectionDrafts,
    packageSelectionLoading,
    packageSelectionSavingField,
    packageSelectionError,
    packageSelectionMessage,
    packageSelectionTone,
    showOfficialEditor,
    setShowOfficialEditor,
    selectionField,
    currentSelectionValue,
    currentSelectionDraftValue,
    hasUnsavedSelectionDraft,
    parsedArtifactOptions,
    showArtifactOfficialChoices,
    singleArtifactOfficialValue,
    persistSelectionField,
  };
}
