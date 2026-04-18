import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    subject: z.string(),
    estimatedTime: z.number().describe('Estimated read/study time in minutes'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    authors: z.array(z.string()).default(['IHHS']),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
