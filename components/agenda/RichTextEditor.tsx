"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Table as TableIcon,
  Delete,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

function ToolButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Toggle pressed={active} onPressedChange={onClick} className="h-8 w-8">
      {children}
    </Toggle>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Saisissez la description...",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: [
          "prose prose-sm dark:prose-invert max-w-none",
          "min-h-[200px] px-3 py-2 focus:outline-none",
          "ProseMirror-custom",
        ].join(" "),
      },
    },
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-input bg-background",
        "focus-within:ring-1 focus-within:ring-ring",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/50 bg-muted/30 px-2 py-1.5">
        <ToolButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading1 className="size-4" />
        </ToolButton>
        <ToolButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border/60" />
        <ToolButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border/60" />
        <ToolButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolButton>
        <ToolButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border/60" />
        <ToolButton
          active={editor.isActive("table")}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="size-4" />
        </ToolButton>
        <ToolButton
          active={false}
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          <Delete className="size-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border/60" />
        <ToolButton active={false} onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="size-4" />
        </ToolButton>
        <ToolButton active={false} onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="size-4" />
        </ToolButton>
      </div>
      <EditorContent editor={editor} />
      <style jsx global>{`
        .ProseMirror-custom {
          outline: none !important;
        }
        .ProseMirror-custom ul {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
        }
        .ProseMirror-custom ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
        }
        .ProseMirror-custom li {
          display: list-item !important;
        }
        .ProseMirror-custom table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid hsl(var(--border));
        }
        .ProseMirror-custom th,
        .ProseMirror-custom td {
          border: 1px solid hsl(var(--border));
          padding: 8px 12px;
          min-width: 80px;
          vertical-align: top;
        }
        .ProseMirror-custom th {
          background: hsl(var(--muted) / 0.5);
          font-weight: 600;
          text-align: left;
        }
        .ProseMirror-custom blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 1em;
          margin: 0.5em 0;
          color: hsl(var(--muted-foreground));
        }
        .ProseMirror-custom p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
