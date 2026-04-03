import { NextResponse } from "next/server";
import {
  buildNewsletterShowcaseStory,
  countNewsletterWords,
  NEWSLETTER_SHOWCASE_ADAPTATION_OUTPUTS,
  NEWSLETTER_SHOWCASE_CHAPTERS,
  NEWSLETTER_SHOWCASE_MODE_CONFIG,
  NEWSLETTER_SHOWCASE_NOTES,
  NEWSLETTER_SHOWCASE_OUTLINE,
  NEWSLETTER_SHOWCASE_PACKAGE_SELECTIONS,
  NEWSLETTER_SHOWCASE_STORY,
  NEWSLETTER_SHOWCASE_STYLE_GUIDE,
  NEWSLETTER_SHOWCASE_SYNOPSIS,
  NEWSLETTER_SHOWCASE_TITLE,
  type NewsletterShowcaseChapterRow,
  type NewsletterShowcaseStoryRow,
} from "../../../lib/demo/newsletterShowcase";
import { createServerSupabase, createServiceRoleSupabase } from "../../../lib/supabase/server";

type InsertedStoryRow = NewsletterShowcaseStoryRow & {
  user_id: string;
};

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceRoleSupabase();
    const now = new Date().toISOString();

    const { data: existingStory } = await serviceSupabase
      .from("stories")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", NEWSLETTER_SHOWCASE_TITLE)
      .eq("project_mode", "newsletter")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingStory?.id) {
      const existingChapters = await fetchChapterRows(serviceSupabase, existingStory.id);
      if (existingChapters) {
        await insertMissingNewsletterOutputs(
          serviceSupabase,
          existingStory.id,
          existingChapters,
          now
        );
        await upsertNewsletterPackageSelections(
          serviceSupabase,
          existingStory.id,
          existingChapters,
          now
        );
      }

      const story = await fetchStoryById(serviceSupabase, existingStory.id);
      if (story) {
        return NextResponse.json({ story, existing: true }, { status: 200 });
      }
    }

    const totalWordCount = NEWSLETTER_SHOWCASE_CHAPTERS.reduce(
      (sum, chapter) => sum + countNewsletterWords(chapter.content),
      0
    );

    const { data: insertedStory, error: storyError } = await serviceSupabase
      .from("stories")
      .insert({
        user_id: user.id,
        title: NEWSLETTER_SHOWCASE_STORY.title,
        project_mode: "newsletter",
        mode_config: NEWSLETTER_SHOWCASE_MODE_CONFIG,
        fandom: "",
        custom_fandom: null,
        characters: [],
        relationship_type: "gen",
        rating: "general",
        setting: null,
        tone: NEWSLETTER_SHOWCASE_STORY.tone,
        tropes: [],
        word_count: totalWordCount,
        updated_at: now,
      })
      .select("*")
      .single();

    if (storyError || !insertedStory) {
      console.error("Newsletter showcase insert error:", storyError);
      return NextResponse.json(
        { error: "Failed to create newsletter showcase" },
        { status: 500 }
      );
    }

    const storyId = (insertedStory as InsertedStoryRow).id;

    const { data: insertedChapters, error: chapterError } = await serviceSupabase
      .from("chapters")
      .insert(
        NEWSLETTER_SHOWCASE_CHAPTERS.map((chapter) => ({
          story_id: storyId,
          chapter_number: chapter.chapterNumber,
          content: chapter.content,
          summary: chapter.summary,
          word_count: countNewsletterWords(chapter.content),
        }))
      )
      .select("*");

    if (chapterError || !insertedChapters) {
      console.error("Newsletter showcase chapter insert error:", chapterError);
      await deleteStorySilently(serviceSupabase, storyId);
      return NextResponse.json(
        { error: "Failed to create newsletter showcase issues" },
        { status: 500 }
      );
    }

    const { error: bibleError } = await serviceSupabase
      .from("story_bibles")
      .insert([
        {
          story_id: storyId,
          section_type: "synopsis",
          content: NEWSLETTER_SHOWCASE_SYNOPSIS,
          updated_at: now,
        },
        {
          story_id: storyId,
          section_type: "style_guide",
          content: NEWSLETTER_SHOWCASE_STYLE_GUIDE,
          updated_at: now,
        },
        {
          story_id: storyId,
          section_type: "outline",
          content: NEWSLETTER_SHOWCASE_OUTLINE,
          updated_at: now,
        },
        {
          story_id: storyId,
          section_type: "notes",
          content: NEWSLETTER_SHOWCASE_NOTES,
          updated_at: now,
        },
      ]);

    if (bibleError) {
      console.error("Newsletter showcase planning insert error:", bibleError);
      await deleteStorySilently(serviceSupabase, storyId);
      return NextResponse.json(
        { error: "Failed to create newsletter showcase planning docs" },
        { status: 500 }
      );
    }

    await insertMissingNewsletterOutputs(
      serviceSupabase,
      storyId,
      insertedChapters as NewsletterShowcaseChapterRow[],
      now
    );
    await upsertNewsletterPackageSelections(
      serviceSupabase,
      storyId,
      insertedChapters as NewsletterShowcaseChapterRow[],
      now
    );

    const story = await fetchStoryById(serviceSupabase, storyId);
    if (!story) {
      return NextResponse.json(
        { error: "Newsletter showcase created but could not be loaded" },
        { status: 500 }
      );
    }

    return NextResponse.json({ story, existing: false }, { status: 201 });
  } catch (error) {
    console.error("Newsletter showcase create error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create newsletter showcase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchStoryById(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string
) {
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select("*")
    .eq("id", storyId)
    .single();

  if (storyError || !story) {
    return null;
  }

  const chapters = await fetchChapterRows(supabase, storyId);

  if (!chapters) {
    return null;
  }

  return buildNewsletterShowcaseStory(
    story as NewsletterShowcaseStoryRow,
    chapters
  );
}

async function fetchChapterRows(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string
) {
  const { data: chapters, error: chapterError } = await supabase
    .from("chapters")
    .select("id, story_id, chapter_number, content, summary, word_count")
    .eq("story_id", storyId)
    .order("chapter_number", { ascending: true });

  if (chapterError || !chapters) {
    return null;
  }

  return chapters as NewsletterShowcaseChapterRow[];
}

async function insertMissingNewsletterOutputs(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string,
  chapters: NewsletterShowcaseChapterRow[],
  now: string
) {
  const chapterIdByNumber = new Map<number, string>();
  for (const chapter of chapters) {
    chapterIdByNumber.set(chapter.chapter_number, chapter.id);
  }

  const { data: existingOutputs } = await supabase
    .from("adaptation_outputs")
    .select("chapter_number, output_type")
    .eq("story_id", storyId);

  const existingKeys = new Set(
    (existingOutputs ?? []).map(
      (output) => `${output.chapter_number}:${output.output_type}`
    )
  );

  const missingRows = NEWSLETTER_SHOWCASE_ADAPTATION_OUTPUTS.flatMap((output) => {
    const chapterId = chapterIdByNumber.get(output.chapterNumber);
    if (!chapterId) {
      return [];
    }

    const key = `${output.chapterNumber}:${output.outputType}`;
    if (existingKeys.has(key)) {
      return [];
    }

    return [
      {
        story_id: storyId,
        chapter_id: chapterId,
        chapter_number: output.chapterNumber,
        output_type: output.outputType,
        content: output.content,
        context_source: output.contextSource,
        updated_at: now,
      },
    ];
  });

  if (missingRows.length === 0) {
    return;
  }

  const { error } = await supabase.from("adaptation_outputs").insert(missingRows);

  if (error) {
    console.error("Newsletter showcase adaptation insert error:", error);
  }
}

async function deleteStorySilently(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string
) {
  await supabase.from("stories").delete().eq("id", storyId);
}

async function upsertNewsletterPackageSelections(
  supabase: Awaited<ReturnType<typeof createServiceRoleSupabase>>,
  storyId: string,
  chapters: NewsletterShowcaseChapterRow[],
  now: string
) {
  const chapterIdByNumber = new Map<number, string>();
  for (const chapter of chapters) {
    chapterIdByNumber.set(chapter.chapter_number, chapter.id);
  }

  const rows = NEWSLETTER_SHOWCASE_PACKAGE_SELECTIONS.flatMap((selection) => {
    const chapterId = chapterIdByNumber.get(selection.chapterNumber);

    if (!chapterId) {
      return [];
    }

    return [
      {
        story_id: storyId,
        chapter_id: chapterId,
        chapter_number: selection.chapterNumber,
        selected_subject_line: selection.values.subjectLine,
        selected_deck: selection.values.deck,
        selected_hook: selection.values.hook,
        selected_cta: selection.values.cta,
        selected_section_package: selection.values.sectionPackage,
        updated_at: now,
      },
    ];
  });

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("newsletter_issue_packages")
    .upsert(rows, { onConflict: "story_id,chapter_id" });

  if (error) {
    if (isMissingTableError(error, "newsletter_issue_packages")) {
      console.warn(
        "Newsletter issue package showcase seeding skipped because the table is not available yet."
      );
      return;
    }

    console.error("Newsletter showcase package selection upsert error:", error);
  }
}

function isMissingTableError(
  error: { code?: string; message?: string },
  tableName: string
) {
  return (
    error.code === "42P01"
    || (
      typeof error.message === "string"
      && error.message.includes(tableName)
      && error.message.includes("does not exist")
    )
  );
}
