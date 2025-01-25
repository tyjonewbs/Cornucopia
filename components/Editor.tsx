"use client";

import { Button } from "./ui/button";
import {
  EditorContent,
  JSONContent,
  useEditor,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

export const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        variant={editor.isActive("heading", { level: 1 }) ? "default" : "secondary"}
        type="button"
        size="sm"
        className="w-10"
        aria-label="Heading 1"
        title="Heading 1 (Ctrl+Alt+1)"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "secondary"}
        type="button"
        size="sm"
        className="w-10"
        aria-label="Heading 2"
        title="Heading 2 (Ctrl+Alt+2)"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "secondary"}
        type="button"
        size="sm"
        className="w-10"
        aria-label="Heading 3"
        title="Heading 3 (Ctrl+Alt+3)"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive("bold") ? "default" : "secondary"}
        type="button"
        size="sm"
        className="w-10"
        aria-label="Bold"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive("italic") ? "default" : "secondary"}
        type="button"
        size="sm"
        className="w-10"
        aria-label="Italic"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        variant={editor.isActive("strike") ? "default" : "secondary"}
        type="button"
        size="sm"
        className="w-10"
        aria-label="Strikethrough"
        title="Strikethrough (Ctrl+Shift+X)"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function TipTapEditor({
  setJson,
  json,
}: {
  setJson: (json: JSONContent) => void;
  json: JSONContent | null;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: json,
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[150px] prose prose-sm sm:prose-base",
      },
    },
    onUpdate: ({ editor }) => {
      setJson(editor.getJSON());
    },
  });

  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted/50 p-2">
        <MenuBar editor={editor} />
      </div>
      <EditorContent
        editor={editor}
        className="p-3 min-h-[150px]"
      />
    </div>
  );
}
