"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  // Keep refs in sync
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { contentRef.current = content; }, [content]);

  const doSave = useCallback(() => {
    setSaveStatus("saving");
    startTransition(async () => {
      setError(null);
      try {
        await saveMindsetEntry({
          id: entry.id,
          userId,
          title: titleRef.current,
          content: contentRef.current,
        });
        setIsDirty(false);
        setSaveStatus("saved");
      } catch {
        setError("Failed to save. Please try again.");
        setSaveStatus("idle");
      }
    });
  }, [entry.id, userId]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave();
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isDirty, title, content, doSave]);

  // Clear "saved" indicator after a few seconds
  useEffect(() => {
    if (saveStatus === "saved") {
      const t = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  function handleContentChange(html: string) {
    setContent(html);
    setIsDirty(true);
    setSaveStatus("idle");
    setError(null);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setIsDirty(true);
    setSaveStatus("idle");
    setError(null);
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
          {/* Auto-save status */}
          <div className="font-mono text-[10px] flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <span className="text-ink-muted">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-status-green">Saved ✓</span>
            )}
            {saveStatus === "idle" && isDirty && (
              <span className="text-ink-faint">Unsaved</span>
            )}
          </div>
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
        <p className="px-10 pb-2 text-[12px] text-red-600">{error}</p>
      )}
    </div>
  );
}
