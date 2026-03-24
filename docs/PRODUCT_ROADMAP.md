# Product Roadmap: AI Visual Story Studio

> From fanfic generator → craft-focused AI writing studio with visual storytelling

## Tech Stack & External Services

### AI Models

| Service | Use Case | Cost | Notes |
|---------|----------|------|-------|
| **Claude Sonnet** (Anthropic) | Story generation, continuity, craft tools | ~$0.01-0.03/chapter | Already integrated. Best creative writing model. |
| **Claude Haiku** (Anthropic) | Quick tools (rewrite, expand, describe) | ~$0.001/call | Fast + cheap for inline editing tools |
| **Flux 1.1 Pro** (via Replicate) | Scene illustrations, character portraits | ~$0.03-0.05/image | Best quality-to-price ratio. Replicate API. |
| **Stable Diffusion 3.5** (Stability AI) | Fallback image gen, style variants | ~$0.02-0.04/image | Good for manga/anime styles specifically |
| **GPT-Image-1** (OpenAI) | Alternative image gen | ~$0.04-0.08/image | Best text-in-image, good photorealism |
| **Gradium** | Audio narration (TTS) | Free tier ~1hr, $43/mo ~20hrs | Natural voice, streaming |
| **ElevenLabs** | Premium voice narration | Free 10k chars/mo, $5/mo 30k | Better voice quality, more voices, alternative to Gradium |

### Infrastructure (already set up)
- **Supabase** — Auth (Discord + Google), Postgres DB, file storage for images
- **Vercel** — Deployment
- **Stripe** — Payments (to add)

---

## Phase 1: Writing Studio Foundation (Current → 2 weeks)
*Transform "click generate" into a real writing environment*

### 1.1 Story Bible
- **Character cards** — Name, description, personality, relationships, appearance notes
- **World rules** — Setting details, magic systems, technology level, canon rules
- **Story synopsis** — One-paragraph summary AI references for consistency
- **Fandom auto-fill** — Pre-populate Story Bible from our fandom data
- **Model:** Claude Sonnet reads Story Bible as system context for every generation

### 1.2 Rich Text Editor
- Replace plain text display with a proper editor (Tiptap or Lexical)
- Users can edit AI output directly — not just read it
- Selection-based tools (highlight text → rewrite/expand/describe)
- Paragraph-level regeneration ("rewrite this paragraph")

### 1.3 Craft Tools (inline, selection-based)
- **Rewrite** — Select text, choose direction: "more tense", "more poetic", "shorter", "more dialogue"
- **Expand** — Turn a sparse paragraph into a rich scene with sensory detail
- **Describe** — Generate 3-5 description alternatives for a selected noun/scene
- **Brainstorm** — "What could happen next?" → 5 plot direction options user picks from
- **Model:** Claude Haiku for speed on Rewrite/Expand/Describe. Sonnet for Brainstorm.

### 1.4 Continuity Engine
- AI reads all previous chapters + Story Bible before writing
- Flag contradictions ("In Chapter 2 you said X, but in Chapter 5 you said Y")
- Character voice consistency tracking
- **Model:** Claude Haiku for quick continuity checks

---

## Phase 2: Visual Storytelling (2-4 weeks after Phase 1)
*Every story becomes illustrated*

### 2.1 Scene Illustrations
- "Generate illustration" button per chapter
- AI extracts key scene from chapter text → generates image prompt → creates image
- Style selector: photorealistic, anime/manga, watercolor, comic book, oil painting
- **Model pipeline:** Claude Haiku (extract scene → write image prompt) → Flux 1.1 Pro (generate image)
- Store images in Supabase Storage, link to chapters

### 2.2 Character Portraits
- Auto-generate from Story Bible character descriptions
- Reference image system for consistency (Flux IP-Adapter or similar)
- Portrait appears on character cards in Story Bible
- **Model:** Flux 1.1 Pro with detailed character description prompt

### 2.3 Cover Art
- Auto-generate story cover from title + synopsis + characters
- Multiple style options, user picks favorite
- Used for library cards, sharing, social preview
- **Model:** Flux 1.1 Pro

### 2.4 Image Consistency (the hard problem)
- Save character reference images and feed them back for subsequent generations
- Use IP-Adapter / face-consistency techniques via Replicate
- Allow users to upload their own reference images
- This is iterative — start simple, improve over time

---

## Phase 3: Audio & Sharing (4-6 weeks after Phase 1)
*Stories come alive and go viral*

### 3.1 Audio Narration
- "Listen" button per chapter
- Stream audio as it generates (WebSocket)
- Voice selection (narrator voices, not character-specific initially)
- Cache generated audio in Supabase Storage
- **Model:** Gradium TTS (free tier to start), upgrade to ElevenLabs for premium voices

### 3.2 Public Story Pages
- Toggle story to "public" → generates shareable URL
- Beautiful reading page with cover art, chapter navigation
- Open Graph meta tags for rich social previews (cover art + title + fandom)
- Embed-friendly for Tumblr, Twitter, Discord

### 3.3 Community Library
- Browse public stories by fandom, rating, tropes
- Kudos / bookmark system (AO3 inspired)
- Author profiles
- "Remix" — fork someone's story setup (characters, setting) into your own

---

## Phase 4: Monetization & Growth (6-8 weeks after Phase 1)
*Turn users into customers*

### 4.1 Stripe Integration
- **Free tier:** 5 chapters/month, 3 images/month, no audio
- **Pro tier ($9.99/mo):** Unlimited chapters, 50 images/month, audio narration, all craft tools
- **Studio tier ($19.99/mo):** Everything + priority generation, multiple concurrent stories, epub/pdf export, manga mode (future)

### 4.2 Usage Tracking
- Track chapters generated, images created, audio minutes per billing cycle
- Soft limits with upgrade prompts (not hard blocks — don't kill the flow)
- Dashboard showing usage

### 4.3 Onboarding
- Guided first-story flow: pick fandom → fill Story Bible → generate Chapter 1 → try Rewrite tool → see illustration
- This teaches the product loop naturally

---

## Phase 5: Advanced Visual Modes (future)
*The manga/comic dream*

### 5.1 Manga/Comic Panel Mode
- Split chapter into scenes → generate panel layout
- Dialogue bubbles with character text
- Panel-to-panel consistency via reference images
- Style: manga, western comic, graphic novel
- **This is the hardest feature. Research phase first.**

### 5.2 Storyboard Mode
- Visual timeline of key scenes across chapters
- Drag-and-drop scene reordering
- Each scene = text + illustration thumbnail

### 5.3 ePub/PDF Export with Illustrations
- Professional formatted output
- Cover art + chapter illustrations inline
- Proper typography, page breaks
- Manga mode exports as right-to-left

---

## Cost Modeling (per active user/month)

| Usage | Free User | Pro User | Studio User |
|-------|-----------|----------|-------------|
| Chapters | 5 × $0.02 = $0.10 | 20 × $0.02 = $0.40 | 40 × $0.02 = $0.80 |
| Craft tools | 10 × $0.001 = $0.01 | 100 × $0.001 = $0.10 | 200 × $0.001 = $0.20 |
| Images | 3 × $0.04 = $0.12 | 50 × $0.04 = $2.00 | 100 × $0.04 = $4.00 |
| Audio | $0 | 10 ch × $0.05 = $0.50 | 30 ch × $0.05 = $1.50 |
| **Total cost** | **~$0.23** | **~$3.00** | **~$6.50** |
| **Revenue** | **$0** | **$9.99** | **$19.99** |
| **Margin** | negative | ~70% | ~68% |

Healthy margins on paid tiers. Free tier is cheap enough to subsidize for growth.

---

## Build Order (what to do first)

1. **Story Bible** — Biggest impact on quality, makes everything downstream better
2. **Rich Text Editor** — Can't have craft tools without an editor
3. **Rewrite/Expand/Describe** — The "aha moment" that converts free → paid
4. **Scene Illustrations** — The visual wow factor, shareability
5. **Cover Art** — Quick win, makes library beautiful
6. **Audio Narration** — Premium feature, differentiator
7. **Public Pages + Sharing** — Growth engine
8. **Stripe + Tiers** — Actually make money
9. **Community Library** — Retention + network effects
10. **Manga/Comic Mode** — The dream, but last because it's hardest
