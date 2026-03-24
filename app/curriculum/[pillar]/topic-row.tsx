"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleTopicDone } from "./actions";
import type { TopicWithProgress } from "@/lib/types";

interface Props {
  topic: TopicWithProgress;
  userId: string;
}

export function TopicRow({ topic, userId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(topic.user_topic?.status === "done");
  const status = topic.user_topic?.status ?? "not_started";
  const lastStudied = topic.user_topic?.last_studied_at;

  // Re-sync when server re-renders with fresh data (after router.refresh())
  useEffect(() => {
    setIsDone(topic.user_topic?.status === "done");
  }, [topic.user_topic?.status]);

  function handleRowClick() {
    // Block navigation while toggle is in flight to avoid race condition
    if (isPending) return;
    router.push(`/topic/${topic.id}`);
  }

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !isDone;
    setIsDone(next);
    startTransition(async () => {
      await toggleTopicDone({ topicId: topic.id, userId, currentlyDone: !next });
      router.refresh();
    });
  }

  function handleLinkClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      onClick={handleRowClick}
      className="relative flex items-start gap-3 px-4 py-3.5 group border-b border-line hover:bg-hover transition-colors cursor-pointer"
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckbox}
        disabled={isPending}
        className={`
          w-4 h-4 rounded-[4px] border shrink-0 mt-0.5 flex items-center justify-center
          transition-colors
          ${isDone ? "bg-purple border-purple" : "border-line-subtle hover:border-purple"}
        `}
      >
        {isDone && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`
            text-[13px] mb-1
            ${isDone
              ? "line-through text-ink-faint"
              : "text-ink-dim group-hover:text-ink transition-colors"
            }
          `}
        >
          {topic.title}
        </p>
        {(topic.tag || topic.roadmap || topic.is_company_specific || topic.source_url) && (
          <div className="flex flex-wrap gap-1.5">
            {topic.tag && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-light border border-purple-border text-purple">
                {topic.tag}
              </span>
            )}
            {topic.roadmap && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-base border border-line text-ink-muted">
                {topic.roadmap}
              </span>
            )}
            {topic.is_company_specific && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-status-amber-bg border border-status-amber-border text-status-amber">
                {topic.company || "Company"}
              </span>
            )}
            {topic.source_url && (
              <a
                href={topic.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-base border border-line text-ink-muted hover:text-ink hover:border-line-subtle transition-colors"
              >
                ↗ Link
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {lastStudied && (
          <span className="font-mono text-[10px] text-ink-faint hidden sm:block">
            {new Date(lastStudied).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {status === "in_progress" && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full text-status-green border border-status-green-border bg-status-green-bg">
            In progress
          </span>
        )}
      </div>
    </div>
  );
}
