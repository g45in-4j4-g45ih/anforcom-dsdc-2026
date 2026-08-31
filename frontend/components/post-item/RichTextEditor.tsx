"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [, forceRerender] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: () => forceRerender((n) => n + 1),
    editorProps: {
      attributes: {
        class: "h-[160px] overflow-y-auto px-3 py-2 text-sm text-gray-900 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `rounded border px-2 py-1 text-xs hover:bg-gray-50 ${
      active ? "border-gray-900 bg-gray-100 text-gray-900" : "border-gray-300 text-gray-600"
    }`;

  return (
    <div className="rounded-xl border border-gray-300 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400">
      <div className="flex gap-1 border-b border-gray-200 p-1.5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 w-px bg-gray-200" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}