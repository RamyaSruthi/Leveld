"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Link as LinkExtension } from "@tiptap/extension-link";
import { Highlight } from "@tiptap/extension-highlight";
import { Typography } from "@tiptap/extension-typography";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Image as ImageExtension } from "@tiptap/extension-image";
import { SlashCommand } from "./slash-command";
import "tippy.js/dist/tippy.css";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing… or type '/' for commands",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      Highlight,
      Typography,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ImageExtension,
      SlashCommand,
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            // Upload to Supabase Storage, insert URL instead of base64
            const ext = file.type.split("/")[1] ?? "png";
            const path = `note-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const supabase = createClient();
            supabase.storage
              .from("note-images")
              .upload(path, file, { contentType: file.type })
              .then(({ data, error }) => {
                if (error || !data) return;
                const { data: { publicUrl } } = supabase.storage
                  .from("note-images")
                  .getPublicUrl(data.path);
                const node = view.state.schema.nodes.image.create({ src: publicUrl });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
              });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const selected = from !== to;
      setHasSelection(selected);

      if (!selected || editor.isActive("codeBlock") || editor.isActive("image")) {
        setMenuPos(null);
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const wrapper = wrapperRef.current?.getBoundingClientRect();
      if (!wrapper) return;

      const menuWidth = 340;
      const left = Math.max(
        0,
        Math.min(
          rect.left - wrapper.left + rect.width / 2 - menuWidth / 2,
          wrapper.width - menuWidth
        )
      );

      setMenuPos({ top: rect.top - wrapper.top - 48, left });
    },
    onBlur: () => {
      // Delay so button clicks still register
      setTimeout(() => setMenuPos(null), 150);
    },
  });

  if (!editor) return null;

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  return (
    <div ref={wrapperRef} className="notion-editor relative">
      {/* Floating bubble toolbar */}
      {menuPos && hasSelection && (
        <div
          style={{ top: menuPos.top, left: menuPos.left }}
          className="absolute z-50 flex items-center gap-px bg-[#1c1c1c] rounded-lg px-1.5 py-1 shadow-2xl border border-white/10 select-none"
          onMouseDown={(e) => e.preventDefault()}
        >
          <BubbleBtn active={active("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <strong className="text-[13px]">B</strong>
          </BubbleBtn>
          <BubbleBtn active={active("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <em className="text-[13px]">I</em>
          </BubbleBtn>
          <BubbleBtn active={active("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike">
            <s className="text-[13px]">S</s>
          </BubbleBtn>
          <BubbleBtn active={active("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Code">
            <span className="font-mono text-[11px]">` `</span>
          </BubbleBtn>
          <BubbleBtn active={active("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
            <span className="text-[12px]">✦</span>
          </BubbleBtn>
          <div className="w-px h-3.5 bg-white/20 mx-0.5" />
          <BubbleBtn active={active("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">
            <span className="font-mono text-[10px] font-bold">H1</span>
          </BubbleBtn>
          <BubbleBtn active={active("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
            <span className="font-mono text-[10px] font-bold">H2</span>
          </BubbleBtn>
          <BubbleBtn active={active("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">
            <span className="font-mono text-[10px] font-bold">H3</span>
          </BubbleBtn>
          <div className="w-px h-3.5 bg-white/20 mx-0.5" />
          <BubbleBtn
            active={active("link")}
            onClick={() => {
              if (active("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                const url = window.prompt("Enter URL:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            title="Link"
          >
            <span className="text-[12px]">🔗</span>
          </BubbleBtn>
          <BubbleBtn active={active("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <span className="text-[12px]">•—</span>
          </BubbleBtn>
          <BubbleBtn active={active("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <span className="font-mono text-[10px]">1.</span>
          </BubbleBtn>
          <BubbleBtn active={active("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
            <span className="text-[12px]">❝</span>
          </BubbleBtn>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function BubbleBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        px-1.5 py-0.5 rounded transition-colors
        ${active
          ? "bg-white/25 text-white"
          : "text-white/60 hover:text-white hover:bg-white/15"
        }
      `}
    >
      {children}
    </button>
  );
}
