import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://ihsgh.org',
  integrations: [mdx({
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }), sitemap({
    // Hidden /secret parody pages must not appear in the public sitemap.
    filter: (page) => !page.includes('/secret'),
  }), tailwind({ applyBaseStyles: false }), react()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  vite: {
    ssr: { noExternal: ['mermaid'] },
    // These TensorFlow packages pull in peer deps (@mediapipe/hands,
    // @mediapipe/pose, @tensorflow/tfjs-backend-webgpu) that aren't installed.
    // If Vite's dep scanner tries to pre-bundle them it blows up the whole
    // scan, which silently hangs downstream imports like @supabase/supabase-js.
    // Components that actually use these models lazy-import them at runtime
    // on guide pages that opt in, so skipping the pre-bundle is fine.
    optimizeDeps: {
      exclude: [
        '@tensorflow-models/hand-pose-detection',
        '@tensorflow-models/pose-detection',
        '@mediapipe/hands',
        '@mediapipe/pose',
      ],
    },
  },
});
