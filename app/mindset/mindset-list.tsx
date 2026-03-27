"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MindsetEntry } from "@/lib/types";
import { createMindsetEntry } from "./actions";

interface Props {
  entries: MindsetEntry[];
  userId: string;
}

export function MindsetList({ entries, userId }: Props) {
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const { id } = await createMindsetEntry({ userId, title: trimmed });
      setTitle("");
      router.push(`/mindset/${id}`);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, "").trim();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  return (
    <div>
      {/* New entry input */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New idea or mental model…"
          className="flex-1 bg-surface border border-line rounded-lg px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-purple transition-colors"
        />
        <button
          onClick={handleCreate}
          disabled={isPending || !title.trim()}
          className="shrink-0 px-4 py-2.5 rounded-lg text-[12px] font-medium bg-purple text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isPending ? "Creating…" : "+ New"}
        </button>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[13px] text-ink-muted">
            No entries yet. Create your first idea above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => {
            const preview = stripHtml(entry.content);
            return (
              <Link
                key={entry.id}
                href={`/mindset/${entry.id}`}
                className="group flex items-start justify-between gap-4 p-4 rounded-lg border border-line bg-surface hover:border-purple/30 hover:bg-purple-light/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-medium text-ink tracking-tight truncate group-hover:text-purple transition-colors">
                    {entry.title}
                  </h3>
                  {preview && (
                    <p className="text-[12px] text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                      {preview}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[10px] text-ink-faint mt-0.5">
                  {timeAgo(entry.updated_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
