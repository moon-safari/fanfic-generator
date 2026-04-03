import type {
  BibleNotesContent,
  BibleOutlineContent,
  BibleStyleGuideContent,
  BibleSynopsisContent,
} from "../../types/bible";
import type {
  NewsletterModeConfig,
  Story,
} from "../../types/story";
import type { NewsletterIssuePackageSelectionValues } from "../../types/newsletter";

type NewsletterShowcaseChapterSeed = {
  chapterNumber: number;
  content: string;
  summary: string;
};

export const NEWSLETTER_SHOWCASE_TITLE = "Newsletter Showcase: Signal & Salt";

export const NEWSLETTER_SHOWCASE_MODE_CONFIG: NewsletterModeConfig = {
  topic: "Writing systems, solo publishing, and durable creative workflows",
  audience: "Writers and solo creators building serious Substack-style publications",
  issueAngle:
    "Why a creator newsletter needs recurring structure before it needs more volume.",
  cadence: "weekly",
  subtitle: "Notes on building a writing studio people return to",
  hookApproach:
    "Open with a concrete creator moment, then pivot into a useful frame fast.",
  ctaStyle:
    "Close with one pointed question and a soft invitation to reply or steal the idea.",
  recurringSections: ["Signal", "What to keep", "Open loop"],
};

export const NEWSLETTER_SHOWCASE_STORY = {
  title: NEWSLETTER_SHOWCASE_TITLE,
  projectMode: "newsletter" as const,
  modeConfig: NEWSLETTER_SHOWCASE_MODE_CONFIG,
  fandom: "",
  characters: [],
  relationshipType: "gen" as const,
  rating: "general" as const,
  tone: ["clear", "thoughtful", "sharp", "audience-facing"],
  tropes: [],
};

export const NEWSLETTER_SHOWCASE_CHAPTERS: NewsletterShowcaseChapterSeed[] = [
  {
    chapterNumber: 1,
    summary:
      "The publication introduces its core promise: creator systems should feel durable, not disposable. It frames project memory as the missing layer in most AI writing tools.",
    content: `Every creator I know eventually runs into the same wall: the tool can generate words, but it cannot remember what the work is becoming. That gap sounds abstract until you try to build anything serialized. Then it becomes painfully practical. The second issue forgets what the first promised. The third one repeats the same insight with shinier phrasing. The archive grows, but the publication gets thinner.

That is the category mistake. Most writing tools still behave like vending machines for text. You put a prompt in, you get an output back, and the product pretends that was enough. It is not enough if you are trying to build a publication readers trust over time. Long-form work needs memory, continuity, and a way to carry identity forward issue after issue.

Signal: the problem is not that AI can write. The problem is that most tools cannot keep a publication coherent while it grows.

So this newsletter is going to stay close to one question: what would a real writing studio look like for creators who publish in public and need their work to hold together? Not a novelty machine. Not a pile of disconnected assistants. A system that can remember the project, surface the right context, and help shape the next issue before drift becomes the default.

What to keep: if you are building something serialized, do not judge your stack by the first output. Judge it by whether Issue 6 still sounds like it belongs to the same publication.

The next issue is about artifacts: why saved outputs matter more than people think, and why recap, teaser, and planning docs should live inside the same workspace instead of scattering across notes apps and old drafts.`,
  },
  {
    chapterNumber: 2,
    summary:
      "The issue argues that saved outputs should become reusable project assets. It introduces artifacts as a bridge between drafting, packaging, and publishing.",
    content: `A funny thing happens the moment you start publishing regularly: the draft stops being the only thing that matters. The recap matters. The teaser matters. The line you use to pull a lapsed reader back in matters. The short internal brief you write before drafting matters. If all of that work disappears after a single session, you are rebuilding your publication from scratch every week.

That is why I care so much about artifacts. Not as a nice extra. As infrastructure. If a recap already exists, it should be saved. If a teaser worked, it should still be attached to the issue that produced it. If your planning note clarified the angle, it should be easy to reopen when the next issue starts drifting. Otherwise you are not building a publication system. You are leaving yourself little piles of effort and hoping future-you remembers why they mattered.

Signal: a serious creator workflow treats outputs as project assets, not side effects.

The deeper reason this matters is editorial confidence. Once an artifact library exists, the work starts to connect. The issue can generate a recap. The recap can become a teaser. The planning note can sharpen the follow-up. Suddenly the publication stops feeling like a sequence of isolated sends and starts feeling like one thing that knows what it is doing.

The next issue is about the missing step between planning and output: recurring structure. A publication can have a strong voice and still feel shapeless if each issue opens and closes in a completely different way.`,
  },
  {
    chapterNumber: 3,
    summary:
      "The issue explains that recurring structure builds reader trust, but it intentionally lands without the usual recurring close. It hints that structure is about rhythm, not rigidity.",
    content: `A lot of creators hear "structure" and immediately picture constraint. I think that reaction misses what readers actually respond to. They are not asking for formula. They are asking for orientation. If a publication has a recognizable way of opening, a reliable way of naming what matters, and a consistent way of closing the loop, readers stop spending energy figuring out how to read it and start spending energy absorbing the argument.

That is why recurring sections matter. Not because every issue needs the same skeleton, but because rhythm builds trust. A short signal section can anchor the main idea. A compact takeaway can help the reader keep the useful part. An open loop can make the next issue feel connected instead of random. These moves do not make the writing smaller. They make the series more legible.

Signal: recurring structure is how a publication starts feeling intentional instead of improvised.

The subtle trap is overcorrection. Once a structure works, it is tempting to turn it into ritual. Then the issue starts serving the format instead of the reader. The better move is to keep the pattern visible but alive. Let the hook change shape. Let the close breathe. Keep the sections recognizable enough to carry momentum, but loose enough that the publication still feels written by a person who is paying attention.

Next week I want to turn this into something more operational: what a creator publication profile should store, what should stay editable, and how the system should help preserve those decisions as the archive grows.`,
  },
];

export const NEWSLETTER_SHOWCASE_SYNOPSIS: BibleSynopsisContent = {
  text:
    "Signal & Salt is a creator newsletter about building durable writing systems in public. Each issue should combine one clear editorial argument with a usable takeaway and a sense of momentum into the next send.",
};

export const NEWSLETTER_SHOWCASE_STYLE_GUIDE: BibleStyleGuideContent = {
  pov: "First person singular, speaking directly to creators",
  tense: "Present tense with occasional past examples",
  proseStyle: "Clear, compact, idea-driven prose with a few sharp turns of phrase",
  dialogueStyle: "Sparse quotes, direct address, and short framing lines rather than heavy citation",
  pacing: "Fast opening, steady middle development, clean close with forward pull",
};

export const NEWSLETTER_SHOWCASE_OUTLINE: BibleOutlineContent = {
  chapters: [
    {
      number: 1,
      title: "Why project memory matters",
      summary: "Introduce the publication promise and explain why disposable AI outputs fail serialized work.",
      intent: "Convince readers that memory is the missing layer in AI writing products.",
      keyReveal: "The real product gap is not generation quality. It is continuity over time.",
      openLoops: ["What reusable artifacts change in a creator workflow?"],
      status: "written",
    },
    {
      number: 2,
      title: "Artifacts are infrastructure",
      summary: "Argue that recaps, teasers, and planning docs should be saved inside the workspace.",
      intent: "Reframe artifacts from optional extras into core publishing infrastructure.",
      keyReveal: "A saved-output system creates editorial confidence and workflow continuity.",
      openLoops: ["How should recurring structure work without becoming rigid?"],
      status: "written",
    },
    {
      number: 3,
      title: "Recurring structure builds trust",
      summary: "Explain why recurring sections help readers orient across issues.",
      intent: "Make recurring structure feel like a trust-building device rather than a formula.",
      keyReveal: "Rhythm helps a publication feel intentional before readers even name why.",
      openLoops: ["What belongs in a real publication profile?"],
      status: "written",
    },
    {
      number: 4,
      title: "Publication profile as system memory",
      summary: "Show what a creator publication profile should store and why it should stay editable.",
      intent: "Turn the idea of publication identity into a practical part of the workspace.",
      keyReveal: "A creator mode needs editable publication identity, not just issue text.",
      openLoops: ["How should recurring segments and CTAs evolve as the archive grows?"],
      status: "planned",
    },
  ],
};

export const NEWSLETTER_SHOWCASE_NOTES: BibleNotesContent = {
  text: `Recurring sections: Signal, What to keep, Open loop.
CTA pattern: close with one pointed reader question plus a soft invitation to reply.
Hook pattern: start from one creator pain point or recent publishing moment before expanding into the wider system argument.
Avoid listicle energy or generic creator-economy jargon.`,
  arcs: [
    {
      id: "audience-trust",
      title: "Audience trust over tool novelty",
      intent:
        "Keep proving that durable reader trust matters more than flashy generation tricks.",
      status: "active",
      horizon: "Issue 1 to Issue 4",
      notes:
        "Each issue should make the publication feel more coherent and more intentional.",
    },
    {
      id: "studio-shape",
      title: "From feature pile to creator studio",
      intent:
        "Move the reader from isolated features toward a full publication workflow mindset.",
      status: "active",
      horizon: "Issue 2 to Issue 5",
      notes:
        "Tie artifacts, planning, review, and publishing surfaces back into one connected system.",
    },
  ],
  threads: [
    {
      id: "publication-profile",
      title: "What belongs in a publication profile",
      owner: "newsletter creator workflow",
      introducedIn: 3,
      targetUnit: 4,
      status: "open",
      notes: "Issue 4 should land this clearly and make it operational.",
    },
    {
      id: "segment-evolution",
      title: "How recurring sections evolve without becoming stale",
      owner: "editorial structure",
      introducedIn: 3,
      targetUnit: 4,
      status: "building",
      notes: "Connect recurring structure to reader trust without turning it into rigid formula.",
    },
  ],
};

export const NEWSLETTER_SHOWCASE_ADAPTATION_OUTPUTS = [
  {
    chapterNumber: 3,
    outputType: "newsletter_recap" as const,
    content: `Recurring structure is not about forcing every issue into the same mold. It is about giving readers orientation. When a publication opens with a recognizable signal, lands one usable takeaway, and leaves a live question on the table, trust compounds issue by issue.

Why it matters: structure is not the enemy of voice. It is one of the main reasons voice stays legible over time.`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "public_teaser" as const,
    content: `Most creators do not need more volume. They need a publication shape readers can recognize in seconds.

The next issue in Signal & Salt is about the profile layer that keeps hooks, sections, and closes from drifting every time a new send begins.`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "issue_subject_line" as const,
    content: `1. Why recurring sections make newsletters trustworthy
2. Structure is how a newsletter earns reader trust
3. The case for recurring sections in a creator newsletter
4. Readers trust what they can recognize
5. Why structure beats improvisation in serialized writing`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "issue_deck" as const,
    content: `1. A creator newsletter does not need rigid templates, but it does need enough recurring structure for readers to feel oriented issue after issue.

2. Recurring sections are not formula; they are the rhythm that helps a publication stay legible as the archive grows.

3. When readers can recognize how an issue opens, lands, and carries forward, trust compounds before they ever name why.`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "issue_section_package" as const,
    content: `## Signal
Recurring structure works because it reduces reader friction. When the opening signal arrives in a recognizable place, the reader can spend less energy orienting and more energy following the argument.

## What to keep
Readers do not need rigid templates. They need enough repeated shape that the publication feels intentional from one issue to the next. The useful takeaway here is that rhythm builds trust before readers consciously name it.

## Open loop
The next question is what parts of that rhythm should become explicit publication memory. If recurring structure matters this much, the system should know what the publication is trying to preserve before the next issue starts drifting.`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "issue_hook_variants" as const,
    content: `1. A lot of newsletter structure breaks down in exactly the same way: the writer wants every issue to feel fresh, so nothing becomes recognizable. That sounds creative until a reader tries to return and cannot feel the spine of the publication anymore. A recurring structure is not there to shrink the work. It is there to help trust survive from one send to the next.

2. Most creators assume readers come back for ideas alone. I think they also come back for orientation. They want to know where the signal is, where the useful line lands, and how this issue connects to the last one. That is what recurring sections really buy you: less friction, more trust.

3. One of the easiest ways to make a newsletter feel accidental is to reinvent its shape every week. Readers can tolerate evolving arguments. They are less forgiving when the publication never teaches them how to read it. Recurring sections are not about sameness. They are about recognizable momentum.`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "issue_cta_variants" as const,
    content: `1. Which part of your newsletter already acts like a recurring section, even if you have never named it? Hit reply and tell me what readers would miss first.

2. If your publication has one move readers now expect from you, I would love to hear what it is. Reply with it, or steal the framework here and test it in your next issue.

3. Where does your newsletter currently lose orientation: the opening, the handoff, or the close? Reply if you want to pressure-test that rhythm against a real issue.`,
    contextSource: "story_bible" as const,
  },
  {
    chapterNumber: 3,
    outputType: "issue_send_checklist" as const,
    content: `Send checklist

Ready
- The issue angle is clear: recurring structure builds trust before readers consciously name it.
- A recurring section package exists for Signal, What to keep, and Open loop.
- Subject line, deck, hook, and CTA variants are all prepared for packaging.

Needs attention
- Pull the recurring section package into the issue body so the structure is visible, not just implied.
- Tighten the Open loop handoff so it lands more explicitly on the publication-profile thread for Issue 4.

Missing pieces
- The draft close does not yet land the publication's usual pointed reader question.

Suggested next move
- Add one compact takeaway section, then close with a question about the reader's own recurring newsletter structure before sending.`,
    contextSource: "story_bible" as const,
  },
];

export const NEWSLETTER_SHOWCASE_PACKAGE_SELECTIONS: Array<{
  chapterNumber: number;
  values: NewsletterIssuePackageSelectionValues;
}> = [
  {
    chapterNumber: 3,
    values: {
      subjectLine: "Why recurring sections make newsletters trustworthy",
      deck:
        "Recurring sections are not formula; they are the rhythm that helps a publication stay legible as the archive grows.",
      hook:
        "Most creators assume readers come back for ideas alone. I think they also come back for orientation. They want to know where the signal is, where the useful line lands, and how this issue connects to the last one. That is what recurring sections really buy you: less friction, more trust.",
      cta:
        "Which part of your newsletter already acts like a recurring section, even if you have never named it? Hit reply and tell me what readers would miss first.",
      sectionPackage: `## Signal
Recurring structure works because it reduces reader friction. When the opening signal arrives in a recognizable place, the reader can spend less energy orienting and more energy following the argument.

## What to keep
Readers do not need rigid templates. They need enough repeated shape that the publication feels intentional from one issue to the next. The useful takeaway here is that rhythm builds trust before readers consciously name it.

## Open loop
The next question is what parts of that rhythm should become explicit publication memory. If recurring structure matters this much, the system should know what the publication is trying to preserve before the next issue starts drifting.`,
    },
  },
];

export function buildNewsletterShowcaseStory(
  storyRow: NewsletterShowcaseStoryRow,
  chapterRows: NewsletterShowcaseChapterRow[]
): Story {
  return {
    id: storyRow.id,
    title: storyRow.title,
    projectMode: "newsletter",
    modeConfig: storyRow.mode_config,
    chapters: chapterRows
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((chapter) => ({
        id: chapter.id,
        chapterNumber: chapter.chapter_number,
        content: chapter.content,
        summary: chapter.summary ?? undefined,
        wordCount: chapter.word_count,
      })),
    fandom: "",
    characters: [],
    relationshipType: "gen",
    rating: "general",
    tone: storyRow.tone,
    tropes: [],
    createdAt: storyRow.created_at,
    updatedAt: storyRow.updated_at,
    wordCount: storyRow.word_count,
  };
}

export function countNewsletterWords(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export type NewsletterShowcaseStoryRow = {
  id: string;
  title: string;
  project_mode?: "newsletter";
  mode_config: NewsletterModeConfig;
  tone: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
};

export type NewsletterShowcaseChapterRow = {
  id: string;
  story_id: string;
  chapter_number: number;
  content: string;
  summary: string | null;
  word_count: number;
};
