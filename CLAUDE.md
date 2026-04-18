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

## Account / SRS code

The user has added accounts (no email needed), per-user progress, an SM-2 spaced repetition scheduler, and a daily review queue. Code lives in `src/lib/`:

- `auth.ts`: who's logged in (localStorage-backed)
- `progress.ts`: per-user dashboard data, quiz scores, guide opens, streaks
- `srs.ts`: SM-2 scheduling for flashcards

Components that touch these (`Quiz.astro`, `Flashcards.astro`, `GuideLayout.astro`, `Header.astro`) already wire it up. Don't break those imports.

## Dev workflow

```
npm run dev    # http://localhost:4321 (port from .claude/launch.json)
npm run build  # static output to dist/, then pagefind indexes it
```

Preview server name in `.claude/launch.json` is `ihhs-hub`.
