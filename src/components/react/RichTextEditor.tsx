import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface Props {
  placeholder?: string;
  storageKey?: string;
  initial?: string;
  height?: string;
}

export default function RichTextEditor({ placeholder, storageKey, initial = '', height = '260px' }: Props) {
  const stored = storageKey && typeof window !== 'undefined' ? window.localStorage.getItem('rte:' + storageKey) : null;
  const editor = useEditor({
    extensions: [StarterKit],
    content: stored || initial,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
        style: `min-height: ${height}; padding: 8px;`,
      },
    },
    onUpdate: ({ editor }) => {
      if (storageKey) window.localStorage.setItem('rte:' + storageKey, editor.getHTML());
    },
  });

  useEffect(() => () => editor?.destroy(), [editor]);
  if (!editor) return null;

  const btnCls = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium border ${active ? 'bg-accent-700 text-white border-accent-700' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-ink-800 hover:bg-ink-100 dark:hover:bg-ink-800'}`;

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-ink-200 dark:border-ink-800">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive('bold'))}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive('italic'))}><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive('bulletList'))}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive('orderedList'))}>1. List</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive('blockquote'))}>Quote</button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnCls(editor.isActive('codeBlock'))}>Code</button>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
