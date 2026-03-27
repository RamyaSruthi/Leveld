"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TopicWithProgress, DailyTarget, PillarConfig } from "@/lib/types";
import { pillarLabels, pillarColors } from "@/lib/types";
import {
  addMultipleDailyTargets,
  removeDailyTarget,
  toggleDailyTargetDone,
} from "./actions";

interface Props {
  targets: (DailyTarget & { topic: TopicWithProgress | null })[];
  allTopics: TopicWithProgress[];
  pillars: PillarConfig[];
  userId: string;
  today: string; // YYYY-MM-DD
}

export function DailyTargets({
  targets,
  allTopics,
  pillars,
  userId,
  today,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pickerRef = useRef<HTMLDivElement>(null);

  const labels = pillarLabels(pillars);
  const colors = pillarColors(pillars);

  // Already-targeted topic IDs for today
  const targetedIds = new Set(targets.map((t) => t.topic_id));

  // Filter available topics (exclude already targeted)
  const available = allTopics.filter((t) => !targetedIds.has(t.id));
  const filtered = search.trim()
    ? available.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.tag && t.tag.toLowerCase().includes(search.toLowerCase())) ||
          t.pillar.toLowerCase().includes(search.toLowerCase()) ||
          (labels[t.pillar] ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : available;

  // Group by pillar
  const grouped = pillars
    .map((p) => ({
      pillar: p,
      topics: filtered.filter((t) => t.pillar === p.slug),
    }))
    .filter((g) => g.topics.length > 0);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
        setSearch("");
        setSelected(new Set());
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  function handleToggle(topicId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  function handleAddTargets() {
    if (selected.size === 0) return;
    startTransition(async () => {
      await addMultipleDailyTargets({
        userId,
        topicIds: Array.from(selected),
        targetDate: today,
      });
      setShowPicker(false);
      setSearch("");
      setSelected(new Set());
      router.refresh();
    });
  }

  function handleToggleDone(target: DailyTarget) {
    startTransition(async () => {
      await toggleDailyTargetDone({
        id: target.id,
        userId,
        completed: !target.completed,
      });
      router.refresh();
    });
  }

  function handleRemove(target: DailyTarget) {
    startTransition(async () => {
      await removeDailyTarget({ id: target.id, userId });
      router.refresh();
    });
  }

  const completedCount = targets.filter((t) => t.completed).length;
  const totalCount = targets.length;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">
            Today&apos;s Target
          </p>
          {totalCount > 0 && (
            <span className="font-mono text-[11px] text-ink-muted">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-full
            border border-line hover:border-purple
            text-[11px] font-mono text-ink-muted hover:text-purple
            transition-colors
          "
        >
          <span className="text-[14px] leading-none">+</span>
          Add topics
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1 bg-line rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-purple rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
          />
        </div>
      )}

      {/* Target list */}
      {totalCount === 0 ? (
        <div className="bg-surface rounded-lg border border-line px-4 py-10 text-center">
          <p className="text-[13px] text-ink-dim mb-1">No targets set for today</p>
          <p className="text-[12px] text-ink-muted mb-4">
            Pick the topics you want to study today
          </p>
          <button
            onClick={() => setShowPicker(true)}
            className="
              inline-flex items-center gap-1.5 px-4 py-2 rounded-md
              bg-purple text-white text-[12px] font-medium
              hover:opacity-90 transition-opacity
            "
          >
            Set today&apos;s target
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-line overflow-hidden">
          {targets.map((target, i) => {
            const topic = target.topic;
            if (!topic) return null;
            return (
              <div
                key={target.id}
                className={`
                  flex items-center gap-3 px-4 py-3 group
                  ${i < targets.length - 1 ? "border-b border-line" : ""}
                  hover:bg-hover transition-colors
                `}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleDone(target)}
                  disabled={isPending}
                  className={`
                    w-4 h-4 rounded-[4px] border shrink-0 flex items-center justify-center transition-colors
                    ${target.completed ? "bg-purple border-purple" : "border-line-subtle hover:border-purple"}
                  `}
                >
                  {target.completed && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Topic info */}
                <Link
                  href={`/topic/${topic.id}`}
                  className={`
                    flex-1 min-w-0 text-[13px]
                    ${target.completed
                      ? "line-through text-ink-faint"
                      : "text-ink-dim hover:text-ink transition-colors"
                    }
                  `}
                >
                  {topic.title}
                </Link>

                {/* Pillar badge */}
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded-full border shrink-0"
                  style={{
                    color: colors[topic.pillar] ?? "#6c5ce7",
                    borderColor: colors[topic.pillar] ?? "#6c5ce7",
                    backgroundColor: `${colors[topic.pillar] ?? "#6c5ce7"}15`,
                  }}
                >
                  {labels[topic.pillar] ?? topic.pillar}
                </span>

                {/* Tag */}
                {topic.tag && (
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple-light border border-purple-border text-purple shrink-0 hidden sm:block">
                    {topic.tag}
                  </span>
                )}

                {/* Remove */}
                <button
                  onClick={() => handleRemove(target)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-red-500 p-0.5"
                  title="Remove from today"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Topic picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            ref={pickerRef}
            className="bg-surface border border-line rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
          >
            {/* Picker header */}
            <div className="px-5 pt-5 pb-3 border-b border-line shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-semibold text-ink">
                  Add to today&apos;s target
                </h2>
                <button
                  onClick={() => {
                    setShowPicker(false);
                    setSearch("");
                    setSelected(new Set());
                  }}
                  className="text-ink-muted hover:text-ink transition-colors p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics, tags, pillars…"
                className="
                  w-full h-9 px-3 rounded-md text-[13px]
                  bg-base border border-line text-ink
                  placeholder:text-ink-faint
                  focus:outline-none focus:border-line-subtle
                "
              />
              {selected.size > 0 && (
                <p className="mt-2 font-mono text-[10px] text-purple">
                  {selected.size} topic{selected.size > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Picker body */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {grouped.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-[12px] text-ink-muted">
                    {available.length === 0
                      ? "All topics are already in today's target"
                      : "No topics match your search"}
                  </p>
                </div>
              ) : (
                grouped.map(({ pillar, topics }) => (
                  <div key={pillar.slug} className="mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: pillar.color }}
                      />
                      <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider">
                        {pillar.label}
                      </p>
                    </div>
                    {topics.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleToggle(t.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                          transition-colors
                          ${selected.has(t.id)
                            ? "bg-purple-light"
                            : "hover:bg-hover"
                          }
                        `}
                      >
                        <span
                          className={`
                            w-4 h-4 rounded-[4px] border shrink-0 flex items-center justify-center transition-colors
                            ${selected.has(t.id) ? "bg-purple border-purple" : "border-line-subtle"}
                          `}
                        >
                          {selected.has(t.id) && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 text-[12px] text-ink-dim min-w-0 truncate">
                          {t.title}
                        </span>
                        {t.tag && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-surface border border-line text-ink-faint shrink-0">
                            {t.tag}
                          </span>
                        )}
                        {t.user_topic?.status === "done" && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-purple-light border border-purple-border text-purple shrink-0">
                            Done
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Picker footer */}
            <div className="px-5 py-3 border-t border-line shrink-0 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowPicker(false);
                  setSearch("");
                  setSelected(new Set());
                }}
                className="px-3 py-1.5 text-[12px] text-ink-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTargets}
                disabled={isPending || selected.size === 0}
                className="
                  px-4 py-1.5 rounded-md text-[12px] font-medium
                  bg-purple text-white
                  disabled:opacity-50 hover:opacity-90 transition-opacity
                "
              >
                {isPending
                  ? "Adding…"
                  : `Add ${selected.size || ""} topic${selected.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
