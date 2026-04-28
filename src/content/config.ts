import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    subject: z.string().describe('Primary subject used for breadcrumbs and the main badge'),
    categories: z.array(z.string()).default([]).describe('Additional subjects the guide cross-lists under (e.g. ["AP Exams"])'),
    estimatedTime: z.number().describe('Estimated read/study time in minutes'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    authors: z.array(z.string()).default(['IHHS']),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    // Marks a guide as a teaser / placeholder. It still appears in the
    // library and can be opened, but the card shows a "Coming Soon" badge
    // with a dimmed, non-pulsing visual treatment, and these guides sort
    // to the bottom of the library after every shipped guide.
    comingSoon: z.boolean().default(false),
  }),
});

// Hidden parody collection. NOT cross-linked from /library, /subjects, the
// home page, or the command palette. Only reachable via the password gate at
// /secret. Source files live in src/content/parody/.
const parody = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/parody' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    authors: z.array(z.string()).default(['IHHS']),
  }),
});

export const collections = { guides, parody };
