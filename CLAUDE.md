# AI Fanfiction Generator

## What this is
AI-powered serialised story generator. Users pick fandom + characters + setting + tone + tropes. AI generates titled Chapter 1. "Continue" for unlimited chapters with full memory.

## Core product rules

### 1. Canon compliance is sacred
Generated stories MUST respect fandom canon (no phones in Hogwarts, proper chakra in Naruto, etc.)

### 2. Continuity over creativity
Chapter memory and consistency beat clever plot twists. Serialisation only works with coherent storytelling.

### 3. Mature content is allowed
No PG-13 constraint. Romance, erotica, dark themes, violence — all permitted. The audience wants smut, drama, excitement. Do not water things down.

### 4. Addiction loop by design
Every chapter MUST end with a hook/cliffhanger. The "Continue" button is the core UX. Think Netflix autoplay for fiction.

### 5. Free-form inputs, not dropdowns
Use text fields for characters, setting, theme, tone. The AI handles natural language — don't constrain it.

### 6. Never expose API keys client-side
ALL Anthropic API calls go through Next.js API routes. Never from the browser.

### 7. Mobile-first
Every component must work at 375px minimum. Fanfic readers are on their phones.

### 8. Show, don't tell (in loading states too)
15-25 second generation time means loading states must feel alive. Never blank screen.

## Tech stack
- Next.js 14+ (App Router)
- React + TypeScript
- Tailwind CSS
- Anthropic Claude API (claude-sonnet-4-20250514)
- localStorage for MVP persistence
- Lucide React for icons
- Deployment: Vercel

## File structure
```
src/app/
  api/generate-story/route.ts    — Chapter 1 generation
  api/continue-chapter/route.ts  — Continuation generation
  components/                     — React components
  lib/                           — Utilities, prompts, fandom data
  types/                         — TypeScript interfaces
```

## Cost awareness
~$0.01-0.03 per chapter with Sonnet. Track usage in dev. This is bootstrapped, not funded.

## Running locally
```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```
