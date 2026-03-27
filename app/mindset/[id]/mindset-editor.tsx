"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MindsetEntry } from "@/lib/types";
import { saveMindsetEntry, deleteMindsetEntry } from "../actions";
import dynamic from "next/dynamic";

const RichEditor = dynamic(
  () => import("@/components/editor/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[280px] rounded-lg bg-base border border-line animate-pulse" />
    ),
  }
);

interface Props {
  entry: MindsetEntry;
  userId: string;
}

export function MindsetEditor({ entry, userId }: Props) {
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleContentChange(html: string) {
    setContent(html);
    setIsDirty(true);
    setError(null);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setIsDirty(true);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      try {
        await saveMindsetEntry({ id: entry.id, userId, title, content });
        setIsDirty(false);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteMindsetEntry({ id: entry.id, userId });
      router.push("/mindset");
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="px-10 pt-5 pb-3 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/mindset"
            className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors"
          >
            ← Mindset
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-line text-ink-muted hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Title input */}
      <div className="px-10 pb-1 shrink-0">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="w-full text-[22px] font-semibold text-ink tracking-tight bg-transparent border-none outline-none placeholder:text-ink-faint"
        />
      </div>

      {/* Hint */}
      <div className="px-10 pb-2 shrink-0">
        <p className="font-mono text-[10px] text-ink-faint">
          Type{" "}
          <kbd className="px-1 py-0.5 rounded bg-hover border border-line text-[10px]">
            /
          </kbd>{" "}
          for headings, lists, code blocks and more
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-10 py-4">
        <RichEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Write your ideas, mental models, frameworks…"
        />
      </div>

      {error && (
        <p className="px-10 pb-1 text-[12px] text-red-600">{error}</p>
      )}

      {isDirty && (
        <div className="px-10 py-3 border-t border-line shrink-0">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 rounded-md text-[12px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
