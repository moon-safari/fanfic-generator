import { createClient } from "./client";
import { ChapterAnnotation } from "../../types/bible";

const supabase = createClient();

/** Fetch all non-dismissed annotations for a chapter */
export async function getChapterAnnotations(
  chapterId: string
): Promise<ChapterAnnotation[]> {
  const { data, error } = await supabase
    .from("chapter_annotations")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("dismissed", false);

  if (error || !data) return [];

  return data.map(
    (row): ChapterAnnotation => ({
      id: row.id as string,
      chapterId: row.chapter_id as string,
      textMatch: row.text_match as string,
      annotationType: row.annotation_type as string,
      message: row.message as string,
      sourceChapter: row.source_chapter as string,
      severity: row.severity as string,
      dismissed: row.dismissed as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    })
  );
}

/** Clear old annotations for a chapter and insert new ones */
export async function saveAnnotations(
  chapterId: string,
  annotations: Omit<ChapterAnnotation, "id" | "createdAt" | "updatedAt" | "dismissed">[]
): Promise<boolean> {
  // Delete existing annotations for this chapter
  const { error: deleteError } = await supabase
    .from("chapter_annotations")
    .delete()
    .eq("chapter_id", chapterId);

  if (deleteError) return false;

  if (annotations.length === 0) return true;

  const rows = annotations.map((a) => ({
    chapter_id: chapterId,
    text_match: a.textMatch,
    annotation_type: a.annotationType,
    message: a.message,
    source_chapter: a.sourceChapter,
    severity: a.severity,
    dismissed: false,
  }));

  const { error: insertError } = await supabase
    .from("chapter_annotations")
    .insert(rows);

  return !insertError;
}

/** Mark a single annotation as dismissed */
export async function dismissAnnotation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("chapter_annotations")
    .update({ dismissed: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  return !error;
}
