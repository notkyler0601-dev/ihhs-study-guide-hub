# IHHS Study Guide Hub

A free, ad-free, no-account-needed library of deep-dive interactive study guides for IHHS students.

Built with [Astro](https://astro.build) + Tailwind + MDX. No backend, no database, no API costs ever, just static files you can host anywhere for free.

## What's inside

- **Deep-dive guides** with learning objectives, glossary, worked examples, practice, quizzes, flashcards, mnemonics, and a printable cheat sheet
- **Accounts** (no email needed) with personal dashboards, streak tracking, and per-user data
- **Spaced repetition system** (SM-2 algorithm) — flashcards reschedule based on how well you know them
- **Daily review queue** at `/review` showing every card due across all guides
- **Progress dashboard** at `/dashboard` with streak, mastered cards, quiz averages, 30-day activity heatmap
- **Interactive components**: multiple-choice quizzes with instant feedback and score tracking, flippable flashcards with SRS scheduling, collapsible Q&A
- **Full-text search** (⌘K / Ctrl K) across guide titles, descriptions, and bodies, with snippet previews
- **Beautiful rendering**: KaTeX math, Mermaid diagrams, syntax-highlighted code
- **Light + dark theme** with system preference detection
- **Smooth page transitions** via the View Transitions API
- **Reading progress bar** and sticky table of contents on every guide

## Run it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:4321>.

## Build for production

```bash
npm run build
```

The output goes to `dist/`. Deploy that folder to:

- **Vercel**: `npm i -g vercel && vercel deploy` (free)
- **Netlify**: drag-and-drop `dist/` at app.netlify.com (free)
- **GitHub Pages**: push `dist/` to a `gh-pages` branch (free)
- **Cloudflare Pages**: connect the repo, build command `npm run build`, output `dist` (free)

Any of these will give you one URL you can share with classmates. No login, no API keys, no cost.

## Add a new guide

1. Create a new file in `src/content/guides/` with a `.mdx` extension. The filename (minus extension) becomes the URL slug. Example: `photosynthesis.mdx` becomes `/guides/photosynthesis`.
2. Start with this frontmatter:

```yaml
---
title: "Your Guide Title"
description: "One-sentence hook for the library card."
subject: "Biology"
estimatedTime: 15           # minutes
date: 2026-04-17
tags: ["topic", "exam-prep"]
authors: ["Your Name"]
---
```

3. Import the interactive components you want to use:

```mdx
import Callout from '../../components/Callout.astro';
import KeyTerm from '../../components/KeyTerm.astro';
import Collapsible from '../../components/Collapsible.astro';
import Quiz from '../../components/Quiz.astro';
import Flashcards from '../../components/Flashcards.astro';
```

4. Follow the standard guide skeleton (see `welcome.mdx` for the full template):

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

The new guide appears in the library and search automatically. No other changes needed.

## Component reference

### `<Callout type="..." title="...">`

Highlighted boxes for emphasis. Types: `note`, `insight`, `warning`, `tip`, `theorem`, `definition`.

```mdx
<Callout type="insight" title="Why this matters">
The key intuition behind the concept.
</Callout>
```

### `<KeyTerm term="...">`

Inline tooltip definitions (hover to see).

```mdx
<KeyTerm term="Mitosis">Cell division producing two genetically identical daughter cells.</KeyTerm>
```

### `<Collapsible question="...">`

Click-to-reveal practice question.

```mdx
<Collapsible question="What's the answer to X?">
The full explanation goes here.
</Collapsible>
```

### `<Quiz questions={[...]}/>`

Interactive multiple-choice quiz.

```mdx
<Quiz questions={[
  {
    q: "Question text",
    choices: ["A", "B", "C", "D"],
    answer: 2,                    // 0-indexed
    explain: "Why C is correct."
  }
]} />
```

### `<Flashcards cards={[...]}/>`

Flippable flashcard deck.

```mdx
<Flashcards cards={[
  { front: "Front of card", back: "Back of card" },
  { front: "Q", back: "A" }
]} />
```

### Math (KaTeX)

Inline: `$E = mc^2$`. Block:

```
$$
\int_a^b f(x)\,dx = F(b) - F(a)
$$
```

### Diagrams (Mermaid)

```
\`\`\`mermaid
flowchart LR
  A --> B
  B --> C
\`\`\`
```

## Project structure

```
src/
  components/        # Astro components (UI + interactive)
  content/
    config.ts        # Schema for guide frontmatter
    guides/          # All guide .mdx files
  layouts/
    BaseLayout.astro
    GuideLayout.astro
  pages/
    index.astro      # Home
    library.astro    # All guides
    about.astro
    guides/[...slug].astro
    subjects/index.astro
    subjects/[subject].astro
  styles/
    global.css
public/
  favicon.svg
```

## Accounts and data

Accounts are **local-first**: usernames live in `localStorage`, no email or password required. Per-user progress, flashcard schedules, and quiz scores are namespaced by user id, so multiple classmates can share a browser.

Trade-off: data lives on one device. To enable cross-device sync (so a classmate can log in on phone + laptop and see the same streak), swap the storage backend for Supabase. The app is structured to make this drop-in.

### Optional: enable cross-device accounts via Supabase

1. Sign up at <https://supabase.com> (free tier covers ~50k users).
2. Create a new project, then in the SQL editor run:

   ```sql
   create table profiles (
     id uuid references auth.users primary key,
     username text unique not null,
     display_name text not null,
     created_at timestamptz default now()
   );
   create table user_data (
     user_id uuid references auth.users,
     key text not null,
     value jsonb not null,
     updated_at timestamptz default now(),
     primary key (user_id, key)
   );
   alter table profiles enable row level security;
   alter table user_data enable row level security;
   create policy "users read own profile"   on profiles   for select using (auth.uid() = id);
   create policy "users insert own profile" on profiles   for insert with check (auth.uid() = id);
   create policy "users update own profile" on profiles   for update using (auth.uid() = id);
   create policy "users read own data"      on user_data  for select using (auth.uid() = user_id);
   create policy "users write own data"     on user_data  for all    using (auth.uid() = user_id);
   ```

3. Add Supabase client: `npm install @supabase/supabase-js`
4. Create `.env`:

   ```
   PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. Replace the bodies of `src/lib/auth.ts` and `src/lib/storage.ts` with Supabase calls (the function signatures are designed to match — every consumer keeps working).

The localStorage version is the perfect starting point: zero infrastructure, instant, private. Move to Supabase only when classmates start asking for cross-device sync.

## License

Built by IHHS students for IHHS students. Free to fork and adapt.
