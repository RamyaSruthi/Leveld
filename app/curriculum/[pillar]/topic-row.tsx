"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toggleTopicDone, moveTopicToPillar, updateTopicTag, updateTopicType, recordSolveAttemptFromList } from "./actions";
import type { PillarConfig, TopicWithProgress } from "@/lib/types";

interface Props {
  topic: TopicWithProgress;
  userId: string;
  pillars: PillarConfig[];
  existingTags?: string[];
}

export function TopicRow({ topic, userId, pillars, existingTags }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(topic.user_topic?.status === "done");
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [timeTaken, setTimeTaken] = useState("");
  const [tagValue, setTagValue] = useState(topic.tag || "");
  const moveRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const status = topic.user_topic?.status ?? "not_started";
  const lastStudied = topic.user_topic?.last_studied_at;
  const isCodingProblem = topic.pillar === "dsa" && topic.topic_type !== "concept";

  // Re-sync when server re-renders with fresh data (after router.refresh())
  useEffect(() => {
    setIsDone(topic.user_topic?.status === "done");
  }, [topic.user_topic?.status]);

  useEffect(() => {
    setTagValue(topic.tag || "");
  }, [topic.tag]);

  // Close move menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    }
    if (showMoveMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoveMenu]);

  // Close type menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false);
      }
    }
    if (showTypeMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTypeMenu]);

  // Close tag input on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
        handleTagSave();
      }
    }
    if (showTagInput) {
      document.addEventListener("mousedown", handleClickOutside);
      tagInputRef.current?.focus();
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTagInput]);

  function handleRowClick() {
    if (isPending || showTagInput) return;
    router.push(`/topic/${topic.id}`);
  }

  // Focus time input when prompt shows
  useEffect(() => {
    if (showTimePrompt) timeInputRef.current?.focus();
  }, [showTimePrompt]);

  function handleCheckbox(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !isDone;

    if (next && isCodingProblem) {
      // About to mark done a coding problem — ask for time
      setShowTimePrompt(true);
      return;
    }

    setIsDone(next);
    startTransition(async () => {
      await toggleTopicDone({ topicId: topic.id, userId, currentlyDone: !next });
      router.refresh();
    });
  }

  function handleTimeSubmit() {
    const mins = timeTaken.trim() ? parseInt(timeTaken.trim(), 10) : null;
    const validMins = mins && !isNaN(mins) && mins > 0 ? mins : null;
    setIsDone(true);
    setShowTimePrompt(false);
    setTimeTaken("");
    startTransition(async () => {
      await toggleTopicDone({ topicId: topic.id, userId, currentlyDone: false });
      await recordSolveAttemptFromList({
        userId,
        topicId: topic.id,
        attemptType: "first_solve",
        timeTakenMins: validMins,
      });
      router.refresh();
    });
  }

  function handleLinkClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function handleTagSave() {
    const trimmed = tagValue.trim();
    const oldTag = topic.tag || "";
    setShowTagInput(false);
    if (trimmed !== oldTag) {
      startTransition(async () => {
        await updateTopicTag({
          topicId: topic.id,
          userId,
          tag: trimmed || null,
        });
        router.refresh();
      });
    }
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTagSave();
    }
    if (e.key === "Escape") {
      setTagValue(topic.tag || "");
      setShowTagInput(false);
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className="relative flex items-start gap-3 px-4 py-3.5 group border-b border-line hover:bg-hover transition-colors cursor-pointer"
    >
      {/* Time prompt overlay */}
      {showTimePrompt && (
        <div
          className="absolute left-0 top-0 right-0 bottom-0 z-40 bg-surface/95 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 w-full max-w-xs">
            <span className="text-[11px] text-ink-dim whitespace-nowrap">Time (min):</span>
            <input
              ref={timeInputRef}
              type="number"
              min="1"
              value={timeTaken}
              onChange={(e) => setTimeTaken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTimeSubmit();
                if (e.key === "Escape") {
                  setShowTimePrompt(false);
                  setTimeTaken("");
                }
              }}
              placeholder="25"
              className="w-16 h-7 px-2 rounded text-[12px] font-mono bg-base border border-line text-ink focus:outline-none focus:border-purple"
            />
            <button
              onClick={handleTimeSubmit}
              disabled={isPending}
              className="font-mono text-[10px] px-2 py-1 rounded bg-purple text-white hover:opacity-90 disabled:opacity-50"
            >
              Done
            </button>
            <button
              onClick={() => {
                setShowTimePrompt(false);
                setTimeTaken("");
                // Mark done without time
                setIsDone(true);
                startTransition(async () => {
                  await toggleTopicDone({ topicId: topic.id, userId, currentlyDone: false });
                  router.refresh();
                });
              }}
              className="font-mono text-[10px] text-ink-muted hover:text-ink"
            >
              Skip
            </button>
          </div>
        </div>
      )}

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
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tag display / edit */}
          {showTagInput ? (
            <div ref={tagRef} onClick={(e) => e.stopPropagation()}>
              <input
                ref={tagInputRef}
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag…"
                list={`tags-${topic.id}`}
                className="
                  font-mono text-[10px] px-2 py-0.5 rounded-full
                  bg-surface border border-purple-border text-ink
                  focus:outline-none focus:border-purple
                  w-28
                "
              />
              {existingTags && existingTags.length > 0 && (
                <datalist id={`tags-${topic.id}`}>
                  {existingTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              )}
            </div>
          ) : topic.tag ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTagInput(true);
              }}
              className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-light border border-purple-border text-purple hover:bg-purple-border transition-colors"
            >
              {topic.tag}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTagInput(true);
              }}
              className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-dashed border-line-subtle text-ink-faint hover:border-purple hover:text-purple opacity-0 group-hover:opacity-100 transition-all"
            >
              + tag
            </button>
          )}

          {topic.pillar === "dsa" && (
            <div ref={typeRef} className="relative" onClick={(e) => e.stopPropagation()}>
              {topic.topic_type ? (
                <button
                  onClick={() => setShowTypeMenu((v) => !v)}
                  disabled={isPending}
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    topic.topic_type === "concept"
                      ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                      : "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                  }`}
                >
                  {topic.topic_type === "concept" ? "📖 Concept" : "💻 Code"}
                </button>
              ) : (
                <button
                  onClick={() => setShowTypeMenu((v) => !v)}
                  disabled={isPending}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-dashed border-line-subtle text-ink-faint hover:border-green-300 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  + type
                </button>
              )}

              {showTypeMenu && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-surface border border-line rounded-lg shadow-lg py-1 min-w-[150px]">
                  <p className="px-3 py-1.5 text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                    Set type
                  </p>
                  <button
                    onClick={() => {
                      setShowTypeMenu(false);
                      startTransition(async () => {
                        await updateTopicType({ topicId: topic.id, userId, topicType: "coding_problem" });
                        router.refresh();
                      });
                    }}
                    disabled={isPending}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-hover transition-colors disabled:opacity-50 flex items-center gap-2 ${
                      topic.topic_type === "coding_problem" ? "text-green-600 font-medium" : "text-ink-dim"
                    }`}
                  >
                    💻 Coding Problem
                    {topic.topic_type === "coding_problem" && <span className="ml-auto text-[10px]">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setShowTypeMenu(false);
                      startTransition(async () => {
                        await updateTopicType({ topicId: topic.id, userId, topicType: "concept" });
                        router.refresh();
                      });
                    }}
                    disabled={isPending}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-hover transition-colors disabled:opacity-50 flex items-center gap-2 ${
                      topic.topic_type === "concept" ? "text-blue-600 font-medium" : "text-ink-dim"
                    }`}
                  >
                    📖 Concept
                    {topic.topic_type === "concept" && <span className="ml-auto text-[10px]">✓</span>}
                  </button>
                </div>
              )}
            </div>
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
