import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES,
  type NewsletterIssuePackageSelection,
  type NewsletterIssuePackageSelectionField,
  type NewsletterIssuePackageSelectionValues,
} from "../../types/newsletter";

type DbNewsletterIssuePackageRow = {
  id: string;
  story_id: string;
  chapter_id: string;
  chapter_number: number;
  selected_subject_line: string;
  selected_deck: string;
  selected_hook: string;
  selected_cta: string;
  selected_section_package: string;
  created_at: string;
  updated_at: string;
};

export function createEmptyNewsletterIssuePackageSelection(input: {
  storyId: string;
  chapterId: string;
  chapterNumber: number;
}): NewsletterIssuePackageSelection {
  return {
    storyId: input.storyId,
    chapterId: input.chapterId,
    chapterNumber: input.chapterNumber,
    updatedAt: "",
    persisted: false,
    ...EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES,
  };
}

export async function fetchNewsletterIssuePackageSelection(
  supabase: SupabaseClient,
  storyId: string,
  chapterId: string
): Promise<NewsletterIssuePackageSelection | null> {
  const { data, error } = await supabase
    .from("newsletter_issue_packages")
    .select("*")
    .eq("story_id", storyId)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error, "newsletter_issue_packages")) {
      return null;
    }

    throw error;
  }

  if (!data) {
    return null;
  }

  return mapNewsletterIssuePackageRow(data as DbNewsletterIssuePackageRow);
}

export async function upsertNewsletterIssuePackageSelectionField(
  supabase: SupabaseClient,
  input: {
    storyId: string;
    chapterId: string;
    chapterNumber: number;
    field: NewsletterIssuePackageSelectionField;
    value: string;
  }
): Promise<NewsletterIssuePackageSelection> {
  const existing = await fetchNewsletterIssuePackageSelection(
    supabase,
    input.storyId,
    input.chapterId
  );
  const nextValues: NewsletterIssuePackageSelectionValues = {
    ...(existing
      ? {
          subjectLine: existing.subjectLine,
          deck: existing.deck,
          hook: existing.hook,
          cta: existing.cta,
          sectionPackage: existing.sectionPackage,
        }
      : EMPTY_NEWSLETTER_ISSUE_PACKAGE_SELECTION_VALUES),
    [input.field]: input.value.trim(),
  };

  if (Object.values(nextValues).every((value) => !value.trim())) {
    const { error } = await supabase
      .from("newsletter_issue_packages")
      .delete()
      .eq("story_id", input.storyId)
      .eq("chapter_id", input.chapterId);

    if (error && !isMissingTableError(error, "newsletter_issue_packages")) {
      throw error;
    }

    return {
      ...createEmptyNewsletterIssuePackageSelection(input),
      updatedAt: new Date().toISOString(),
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("newsletter_issue_packages")
    .upsert(
      {
        story_id: input.storyId,
        chapter_id: input.chapterId,
        chapter_number: input.chapterNumber,
        selected_subject_line: nextValues.subjectLine,
        selected_deck: nextValues.deck,
        selected_hook: nextValues.hook,
        selected_cta: nextValues.cta,
        selected_section_package: nextValues.sectionPackage,
        updated_at: now,
      },
      {
        onConflict: "story_id,chapter_id",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapNewsletterIssuePackageRow(data as DbNewsletterIssuePackageRow);
}

export function mapNewsletterIssuePackageRow(
  row: DbNewsletterIssuePackageRow
): NewsletterIssuePackageSelection {
  return {
    id: row.id,
    storyId: row.story_id,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number,
    subjectLine: row.selected_subject_line,
    deck: row.selected_deck,
    hook: row.selected_hook,
    cta: row.selected_cta,
    sectionPackage: row.selected_section_package,
    updatedAt: row.updated_at,
    persisted: true,
  };
}

function isMissingTableError(
  error: { code?: string; message?: string },
  tableName: string
): boolean {
  return (
    error.code === "42P01"
    || (
      typeof error.message === "string"
      && error.message.includes(tableName)
      && error.message.includes("does not exist")
    )
  );
}
