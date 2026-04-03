# Writing OS

The operating system for writers.

An AI writing platform with living project memory — Sudowrite's AI quality meets Novelcrafter's project depth, across every kind of writing:

- Fiction (novels, short stories, serialized fiction, fanfic)
- Newsletters / serialized creator work
- Screenplays
- Comics / graphic narrative
- Game writing / narrative design
- Non-fiction / articles / essays

The core product loop is:

1. **Write** — draft, rewrite, expand, brainstorm with AI that knows the project
2. **Remember** — structured project memory (Codex) for characters, facts, lore, plans
3. **Review** — continuity checks, drift detection, proposed change review
4. **Adapt** — turn one project into summaries, recaps, teasers, beat sheets, newsletters
5. **Publish** — export, package, distribute

## What Exists Today

### Writing workspace

- rich editor for chapter drafting and continuation
- craft tools for rewrite, expand, describe, and brainstorm
- streaming generation for chapter creation and continuation

### Codex

- structured project memory
- entry types, custom types, relationships, aliases, and progressions
- manuscript mention tracking
- change suggestions with accept/reject review
- chapter-aware context console with pin/exclude controls

### Adaptation

- chapter adaptations for:
  - short summary
  - newsletter recap
  - screenplay beat sheet
  - public teaser
- chained workflows between formats
- saved adaptation outputs attached to projects

## Architectural Direction

The long-term goal is a Writing OS:

- one project graph
- one evolving source of truth
- many writing and publishing outputs

That means the platform should increasingly connect:

- manuscript
- Codex
- updates
- context
- adaptation artifacts
- planning
- continuity review
- future mode packs

## Security And Backend Principles

- story creation and project access are authenticated
- project data lives in Supabase with RLS-backed ownership
- AI calls go through server routes, never directly from the client
- new product surfaces should be backend-aware and permission-aware from the start

## Key Paths

- homepage: [`src/app/page.tsx`](src/app/page.tsx)
- editor: [`src/app/components/editor/StoryEditor.tsx`](src/app/components/editor/StoryEditor.tsx)
- Codex UI: [`src/app/components/codex`](src/app/components/codex)
- adaptation UI: [`src/app/components/editor/AdaptTab.tsx`](src/app/components/editor/AdaptTab.tsx)
- API routes: [`src/app/api`](src/app/api)
- migrations: [`supabase/migrations`](supabase/migrations)
- strategy/docs: [`docs`](docs)

## Recent Foundation Work

- Codex schema and APIs
- living change detection
- mentions and manuscript linking
- context console and context rules
- first adaptation pipeline
- persisted adaptation artifacts

## Getting Started

```bash
cp .env.example .env.local
# Fill in your Anthropic API key and Supabase credentials
npm install
npm run dev
```

Open `http://localhost:3000`

Required environment variables (see `.env.example`):
- `ANTHROPIC_API_KEY` — Claude API key
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

If you are working with Supabase locally or against a hosted project, make sure
the latest migrations are applied from [`supabase/migrations`](supabase/migrations).

## Recommended Reading

- [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md)
- [`docs/superpowers/specs/2026-03-27-narrative-os-product-thesis.md`](docs/superpowers/specs/2026-03-27-narrative-os-product-thesis.md)
- [`docs/superpowers/specs/2026-03-28-writing-os-near-term-roadmap.md`](docs/superpowers/specs/2026-03-28-writing-os-near-term-roadmap.md)
- [`docs/superpowers/specs/2026-03-28-landing-page-positioning-design.md`](docs/superpowers/specs/2026-03-28-landing-page-positioning-design.md)
