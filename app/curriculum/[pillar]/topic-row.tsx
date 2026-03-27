"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toggleTopicDone, moveTopicToPillar } from "./actions";
import type { PillarConfig, TopicWithProgress } from "@/lib/types";

interface Props {
  topic: TopicWithProgress;
  userId: string;
  pillars: PillarConfig[];
}

export function TopicRow({ topic, userId, pillars }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(topic.user_topic?.status === "done");
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const moveRef = useRef<HTMLDivElement>(null);
  const status = topic.user_topic?.status ?? "not_started";
  const lastStudied = topic.user_topic?.last_studied_at;

  // Re-sync when server re-renders with fresh data (after router.refresh())
  useEffect(() => {
    setIsDone(topic.user_topic?.status === "done");
  }, [topic.user_topic?.status]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    }
    if (showMoveMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoveMenu]);

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

        {/* Move to pillar */}
        <div ref={moveRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoveMenu((v) => !v);
            }}
            title="Move to another pillar"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-base"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-ink-muted">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showMoveMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-line rounded-lg shadow-lg py-1 min-w-[160px]">
              <p className="px-3 py-1.5 text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                Move to
              </p>
              {pillars.filter((p) => p.slug !== topic.pillar).map((p) => (
                <button
                  key={p.slug}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveMenu(false);
                    startTransition(async () => {
                      await moveTopicToPillar({ topicId: topic.id, userId, newPillar: p.slug });
                      router.refresh();
                    });
                  }}
                  disabled={isPending}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-ink-dim hover:bg-hover hover:text-ink transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
