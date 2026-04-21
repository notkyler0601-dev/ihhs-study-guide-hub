// NodeSandbox React component, mounted via <NodeSandbox client:only="react" />.
// Multi-file Node.js / web playground via CodeSandbox's Sandpack 2 (Nodebox runtime).

import { Sandpack } from '@codesandbox/sandpack-react';
import type { SandpackFiles } from '@codesandbox/sandpack-react';

type Template =
  | 'static'
  | 'angular'
  | 'react'
  | 'react-ts'
  | 'solid'
  | 'svelte'
  | 'test-ts'
  | 'vanilla'
  | 'vanilla-ts'
  | 'vue'
  | 'vue-ts'
  | 'node'
  | 'nextjs'
  | 'vite'
  | 'vite-react'
  | 'vite-react-ts'
  | 'vite-vue'
  | 'vite-vue-ts'
  | 'vite-svelte'
  | 'vite-svelte-ts'
  | 'astro';

interface Props {
  template?: Template;
  files?: SandpackFiles;
  showConsole?: boolean;
  showLineNumbers?: boolean;
  editorHeight?: number;
  theme?: 'light' | 'dark' | 'auto';
}

export default function NodeSandbox({
  template = 'react',
  files,
  showConsole = true,
  showLineNumbers = true,
  editorHeight = 420,
  theme = 'auto',
}: Props) {
  const resolvedTheme: 'light' | 'dark' =
    theme === 'auto'
      ? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light')
      : theme;

  return (
    <div className="not-prose my-8 rounded-2xl overflow-hidden surface shadow-soft">
      <Sandpack
        template={template}
        files={files}
        theme={resolvedTheme}
        options={{
          showConsole,
          showConsoleButton: true,
          showLineNumbers,
          showInlineErrors: true,
          showRefreshButton: true,
          editorHeight,
          editorWidthPercentage: 55,
        }}
      />
    </div>
  );
}
