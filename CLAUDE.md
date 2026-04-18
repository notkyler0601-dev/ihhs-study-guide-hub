# IHHS Study Guide Hub, project notes for Claude

## What this is

A free, no-account static study site (Astro + Tailwind + MDX) hosting deep-dive interactive study guides for IHHS students. Content authors drop `.mdx` files into `src/content/guides/` and they appear automatically in the library and search.

## House rules

- **No em dashes.** Replace with commas, periods, colons, or "and" depending on context. The user has been explicit about this.
- **Color palette is red, white, black.** Accent is red (Tailwind `accent-*` is mapped to red shades). Don't introduce cyan, fuchsia, indigo, etc.
- **Logo is `/ihhs-logo.png`.** Use it in headers and as the favicon.
- No "difficulty" field on guides. It was removed.
- Keep CSS variables and `theme()` calls correct. The legacy `theme('colors.x.y' / 30%)` syntax is invalid — use `rgba()` or the proper `theme('colors.x.y / 30%')` form.

## Available interactive components

**Read `LIBRARIES.md` before recommending or building a new component.** It catalogs every Tier 1, 2, and 3 component with subject, CDN, and props. If you're about to spin up a charting/diagram/sim component, check first that one already exists.

When a guide author asks for an interactive element you don't see in `LIBRARIES.md`:

1. Check that no existing component already covers the use case.
2. If genuinely new, add it to `src/components/`, then add an entry to `LIBRARIES.md` and a usage section to `README.md`.

## Adding a new guide

Standard skeleton (welcome.mdx is the canonical template):

```
## Learning objectives
## TL;DR
## Glossary
## Core concepts
## Worked example
## Practice         (uses <Collapsible>)
## Self-quiz        (uses <Quiz>)
## Flashcards       (uses <Flashcards>)
## Mnemonics
## Common pitfalls
## Cheat sheet
```

Frontmatter schema lives in `src/content/config.ts`. Required fields: `title`, `description`, `subject`, `estimatedTime`, `date`. Optional: `tags`, `authors`, `updated`, `cover`, `draft`.

## Account / SRS / storage code

Accounts, per-user progress, SM-2 spaced repetition, and a daily review queue are wired up. Code lives in `src/lib/`:

- `supabase.ts`: client singleton. Returns `null` when env vars aren't set.
- `auth.ts`: **hybrid** cloud/local auth. When `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` are set, uses Supabase Auth (email + password). Otherwise falls back to local-only username-only accounts. `currentUser()` stays synchronous via a localStorage cache. `signup()` and `login()` return `Promise<Result>` in cloud mode, `Result` in local mode — callers must `await` them.
- `storage.ts`: writes to localStorage first (instant), then fire-and-forget upserts to the Supabase `user_data` table in cloud mode. On login, `auth.ts#hydrateUserDataFromCloud` pulls every cloud row back into localStorage so reads stay sync.
- `progress.ts`: per-user dashboard data, quiz scores, guide opens, streaks. Uses `storage.ts`.
- `srs.ts`: SM-2 scheduling for flashcards. Uses `storage.ts`.

Components that touch these (`Quiz.astro`, `Flashcards.astro`, `GuideLayout.astro`, `Header.astro`, `UserMenu.astro`, `signup.astro`, `login.astro`, `request.astro`, `admin/requests.astro`) are already wired up. Don't break those imports.

### Cloud mode setup

See `SUPABASE_SETUP.md` for the 10-minute manual setup. SQL schema in `supabase/schema.sql` is idempotent.

## Dev workflow

```
npm run dev    # http://localhost:4321 (port from .claude/launch.json)
npm run build  # static output to dist/, then pagefind indexes it
```

Preview server name in `.claude/launch.json` is `ihhs-hub`.
