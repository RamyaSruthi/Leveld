"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Topic, UserTopic, Note, AiReview, PillarConfig, SolveAttempt } from "@/lib/types";
import { saveNote, markTopicDone, markTopicInProgress, runGapAnalysis, reviewTopic, revisitTopic, recordSolveAttempt } from "./actions";
import dynamic from "next/dynamic";

const RichEditor = dynamic(
  () => import("@/components/editor/rich-editor").then((m) => m.RichEditor),
  { ssr: false, loading: () => <div className="min-h-[280px] rounded-lg bg-base border border-line animate-pulse" /> }
);

interface Props {
  topic: Topic;
  userTopic: UserTopic | null;
  latestNote: Note | null;
  aiReview: AiReview | null;
  userId: string;
  pillarConfig?: PillarConfig | null;
  solveAttempts?: SolveAttempt[];
}

export function TopicEditor({
  topic,
  userTopic,
  latestNote,
  aiReview: initialAiReview,
  userId,
  pillarConfig,
  solveAttempts: initialSolveAttempts = [],
}: Props) {
  const [content, setContent] = useState(latestNote?.content ?? "");
  const [isDirty, setIsDirty] = useState(false);
  const [aiReview, setAiReview] = useState(initialAiReview);
  const [status, setStatus] = useState(userTopic?.status ?? "not_started");
  const [lastStudiedAt, setLastStudiedAt] = useState(userTopic?.last_studied_at ?? null);
  const [savedNoteId, setSavedNoteId] = useState(latestNote?.id ?? null);
  const [solveAttempts, setSolveAttempts] = useState<SolveAttempt[]>(initialSolveAttempts);
  // Time-taken prompt states
  const [showTimePrompt, setShowTimePrompt] = useState(false);
  const [timeTaken, setTimeTaken] = useState("");
  const [pendingAction, setPendingAction] = useState<"mark_done" | "revision_solve" | null>(null);
  // Revision mode states
  const [showRevisionChoice, setShowRevisionChoice] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);

  const isCodingProblem = topic.pillar === "dsa" && topic.topic_type !== "concept";

  function daysAgoText(dateStr: string) {
    const diff = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
  }

  // Keep ref in sync for the save callback
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const doSave = useCallback(() => {
    const currentContent = contentRef.current;
    setSaveStatus("saving");
    startTransition(async () => {
      setError(null);
      try {
        const result = await saveNote({
          userId,
          topicId: topic.id,
          content: currentContent,
          currentVersion: latestNote?.version ?? 0,
        });
        if (result.noteId) {
          setSavedNoteId(result.noteId);
          setIsDirty(false);
          setSaveStatus("saved");
          // Auto-run gap analysis
          handleGapAnalysis(result.noteId);
        }
      } catch {
        setError("Failed to save. Please try again.");
        setSaveStatus("idle");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, topic.id, latestNote?.version]);

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
  }, [isDirty, content, doSave]);

  // Clear "saved" indicator after a few seconds
  useEffect(() => {
    if (saveStatus === "saved") {
      const t = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  function handleChange(html: string) {
    setContent(html);
    setIsDirty(true);
    setSaveStatus("idle");
    setError(null);
  }

  async function handleGapAnalysis(noteId: string) {
    setAnalysisRunning(true);
    try {
      const review = await runGapAnalysis({ noteId, userId, content: contentRef.current });
      if (review) setAiReview(review);
    } catch {
      // Gap analysis failing shouldn't block the user
    } finally {
      setAnalysisRunning(false);
    }
  }

  function handleMarkDone() {
    if (isCodingProblem) {
      // Show time prompt for coding problems
      setPendingAction("mark_done");
      setTimeTaken("");
      setShowTimePrompt(true);
      return;
    }
    // Non-coding: mark done directly
    doMarkDone(null);
  }

  function doMarkDone(mins: number | null) {
    startTransition(async () => {
      await markTopicDone({ userId, topicId: topic.id });
      if (isCodingProblem || mins) {
        await recordSolveAttempt({
          userId,
          topicId: topic.id,
          attemptType: "first_solve",
          timeTakenMins: mins,
        });
      }
      setStatus("done");
      setShowTimePrompt(false);
      setPendingAction(null);
      router.refresh();
    });
  }

  function handleMarkInProgress() {
    startTransition(async () => {
      await markTopicInProgress({ userId, topicId: topic.id });
      setStatus("in_progress");
      router.refresh();
    });
  }

  // Sync status & lastStudiedAt from server after router.refresh()
  useEffect(() => {
    setStatus(userTopic?.status ?? "not_started");
    setLastStudiedAt(userTopic?.last_studied_at ?? null);
  }, [userTopic?.status, userTopic?.last_studied_at]);

  // Sync solve attempts from server
  useEffect(() => {
    setSolveAttempts(initialSolveAttempts);
  }, [initialSolveAttempts]);

  function handleRevisit() {
    startTransition(async () => {
      await revisitTopic({ userId, topicId: topic.id });
      setLastStudiedAt(new Date().toISOString());
      router.refresh();
    });
  }

  const isDone = status === "done";
  const isDueForReview =
    isDone &&
    userTopic?.next_review_at != null &&
    new Date(userTopic.next_review_at) <= new Date();

  function handleSkimmed(quality: number) {
    startTransition(async () => {
      await recordSolveAttempt({
        userId,
        topicId: topic.id,
        attemptType: "skimmed",
        timeTakenMins: null,
      });
      await reviewTopic({
        userId,
        topicId: topic.id,
        quality,
        currentInterval: userTopic?.interval_days ?? 1,
        currentEasiness: userTopic?.easiness_factor ?? 2.5,
        currentReviewCount: userTopic?.review_count ?? 0,
      });
      setShowRevisionChoice(false);
      router.refresh();
    });
  }

  function handleSolvedAgainPrompt() {
    // Show time prompt for "solved again"
    setPendingAction("revision_solve");
    setTimeTaken("");
    setShowTimePrompt(true);
  }

  function doRevisionSolve(mins: number | null, quality: number) {
    startTransition(async () => {
      await recordSolveAttempt({
        userId,
        topicId: topic.id,
        attemptType: "revision_solve",
        timeTakenMins: mins,
      });
      await reviewTopic({
        userId,
        topicId: topic.id,
        quality,
        currentInterval: userTopic?.interval_days ?? 1,
        currentEasiness: userTopic?.easiness_factor ?? 2.5,
        currentReviewCount: userTopic?.review_count ?? 0,
      });
      setShowTimePrompt(false);
      setShowRevisionChoice(false);
      setPendingAction(null);
      router.refresh();
    });
  }

  function handleTimePromptSubmit() {
    const mins = timeTaken.trim() ? parseInt(timeTaken.trim(), 10) : null;
    const validMins = mins && !isNaN(mins) && mins > 0 ? mins : null;

    if (pendingAction === "mark_done") {
      doMarkDone(validMins);
    } else if (pendingAction === "revision_solve") {
      // Default quality 4 (good) for solved-again
      doRevisionSolve(validMins, 4);
    }
  }

  function handleReview(quality: number) {
    startTransition(async () => {
      await reviewTopic({
        userId,
        topicId: topic.id,
        quality,
        currentInterval: userTopic?.interval_days ?? 1,
        currentEasiness: userTopic?.easiness_factor ?? 2.5,
        currentReviewCount: userTopic?.review_count ?? 0,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left panel — topic details (25%) ─────────────────────────────── */}
      <div className="w-64 xl:w-72 shrink-0 border-r border-line bg-base flex flex-col overflow-y-auto">
        <div className="p-5 flex flex-col gap-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/curriculum"
              className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors"
            >
              Curriculum
            </Link>
            <span className="text-ink-faint text-[10px]">/</span>
            <Link
              href={`/curriculum/${topic.pillar}`}
              className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors"
            >
              {pillarConfig?.label ?? topic.pillar}
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-[16px] font-semibold text-ink tracking-tight leading-snug">
            {topic.title}
          </h1>

          {/* Source link */}
          {topic.source_url && (
            <a
              href={topic.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-purple hover:opacity-75 transition-opacity -mt-2"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open resource ↗
            </a>
          )}

          {/* Description */}
          {topic.description && (
            <p className="text-[12px] text-ink-dim leading-relaxed -mt-2">
              {topic.description}
            </p>
          )}

          {/* Status badge + last studied info */}
          {status !== "not_started" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {isDone ? (
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-purple-light border border-purple-border text-purple">
                    Done
                  </span>
                ) : (
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-status-green-bg border border-status-green-border text-status-green">
                    In progress
                  </span>
                )}
              </div>
              {lastStudiedAt && (
                <p className="font-mono text-[10px] text-ink-muted">
                  Last studied: {daysAgoText(lastStudiedAt)}
                  <span className="text-ink-faint ml-1">
                    ({new Date(lastStudiedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })})
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Time-taken prompt (overlay within panel) */}
          {showTimePrompt && (
            <div className="bg-base border border-purple-border rounded-lg p-3 flex flex-col gap-2">
              <p className="font-mono text-[10px] text-purple uppercase tracking-widest">
                {pendingAction === "mark_done" ? "Solved!" : "Solved Again!"}
              </p>
              <p className="text-[11px] text-ink-dim">
                How many minutes did it take?
              </p>
              <input
                autoFocus
                type="number"
                min="1"
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTimePromptSubmit();
                }}
                placeholder="e.g. 25"
                className="
                  w-full h-8 px-3 rounded-md text-[12px] font-mono
                  bg-surface border border-line text-ink
                  placeholder:text-ink-faint
                  focus:outline-none focus:border-purple
                "
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTimePromptSubmit}
                  disabled={isPending}
                  className="flex-1 font-mono text-[11px] px-3 py-1.5 rounded-full bg-purple text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    // Skip time tracking, proceed without
                    const action = pendingAction;
                    if (action === "mark_done") {
                      doMarkDone(null);
                    } else if (action === "revision_solve") {
                      doRevisionSolve(null, 4);
                    }
                  }}
                  disabled={isPending}
                  className="font-mono text-[11px] px-3 py-1.5 text-ink-muted hover:text-ink transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Revisited button (for done topics) */}
          {isDone && !showTimePrompt && !showRevisionChoice && (
            <button
              onClick={handleRevisit}
              disabled={isPending}
              className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-status-green-border text-status-green hover:bg-status-green-bg transition-colors disabled:opacity-50"
            >
              {isPending ? "Updating…" : "Mark revisited ↻"}
            </button>
          )}

          {/* Review UI (due) or Mark done/undone */}
          {!showTimePrompt && !showRevisionChoice && (
            <>
              {isDueForReview ? (
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-[10px] text-status-amber uppercase tracking-widest">
                    Review due
                  </p>
                  {isCodingProblem ? (
                    <>
                      <p className="text-[11px] text-ink-dim">How did you review?</p>
                      <button
                        onClick={() => handleSkimmed(4)}
                        disabled={isPending}
                        className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-status-green-border text-status-green hover:bg-status-green-bg transition-colors disabled:opacity-50"
                      >
                        👀 Skimmed through
                      </button>
                      <button
                        onClick={handleSolvedAgainPrompt}
                        disabled={isPending}
                        className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-purple text-purple hover:bg-purple hover:text-white transition-colors disabled:opacity-50"
                      >
                        💻 Solved again
                      </button>
                      <button
                        onClick={() => handleReview(1)}
                        disabled={isPending}
                        className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Forgot
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-ink-dim">How well did you recall this?</p>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleReview(1)}
                          disabled={isPending}
                          className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Forgot
                        </button>
                        <button
                          onClick={() => handleReview(3)}
                          disabled={isPending}
                          className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-status-amber-border text-status-amber hover:bg-status-amber-bg transition-colors disabled:opacity-50"
                        >
                          Hard
                        </button>
                        <button
                          onClick={() => handleReview(4)}
                          disabled={isPending}
                          className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-status-green-border text-status-green hover:bg-status-green-bg transition-colors disabled:opacity-50"
                        >
                          Good
                        </button>
                        <button
                          onClick={() => handleReview(5)}
                          disabled={isPending}
                          className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-purple text-purple hover:bg-purple hover:text-white transition-colors disabled:opacity-50"
                        >
                          Easy
                        </button>
                      </div>
                    </>
                  )}
                  <button
                    onClick={handleMarkInProgress}
                    disabled={isPending}
                    className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors text-left"
                  >
                    Mark undone
                  </button>
                </div>
              ) : isDone ? (
                <button
                  onClick={handleMarkInProgress}
                  disabled={isPending}
                  className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-line text-ink-muted hover:text-ink hover:border-line-subtle transition-colors"
                >
                  Mark undone
                </button>
              ) : (
                <button
                  onClick={handleMarkDone}
                  disabled={isPending}
                  className="w-full font-mono text-[11px] px-3 py-1.5 rounded-full border border-purple text-purple hover:bg-purple hover:text-white transition-colors"
                >
                  {status === "not_started" ? "Mark done" : "Mark done ✓"}
                </button>
              )}
            </>
          )}

          {/* Solve History */}
          {solveAttempts.length > 0 && (
            <div className="pt-3 mt-1 border-t border-line">
              <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
                Solve History
              </p>
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                {solveAttempts.map((a) => {
                  const dateStr = new Date(a.attempted_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = a.time_taken_mins
                    ? `${a.time_taken_mins} min`
                    : null;
                  const label =
                    a.attempt_type === "first_solve"
                      ? "Solved"
                      : a.attempt_type === "revision_solve"
                      ? "Solved again"
                      : "Skimmed";
                  const icon =
                    a.attempt_type === "first_solve"
                      ? "✅"
                      : a.attempt_type === "revision_solve"
                      ? "🔄"
                      : "👀";

                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 text-[11px] text-ink-dim"
                    >
                      <span className="text-[10px]">{icon}</span>
                      <span className="font-mono text-[10px] text-ink-faint shrink-0">
                        {dateStr}
                      </span>
                      <span className="text-[10px] text-ink-muted">{label}</span>
                      {timeStr && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-purple-light border border-purple-border text-purple ml-auto shrink-0">
                          {timeStr}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* AI Gap Analysis */}
        {(aiReview || analysisRunning) && (
          <div className="px-5 pt-5 mt-2 border-t border-line flex flex-col gap-5">
            {analysisRunning ? (
              <p className="text-[11px] text-ink-muted font-mono">Analysing…</p>
            ) : aiReview ? (
              <>
                <p className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">
                  AI Gap Analysis
                </p>

                {aiReview.gaps && aiReview.gaps.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-ink mb-2">Gaps</p>
                    <ul className="space-y-2">
                      {aiReview.gaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-amber shrink-0" />
                          <span className="text-[11px] text-ink-dim leading-relaxed">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiReview.expected_questions && aiReview.expected_questions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-ink mb-2">Expected questions</p>
                    <ol className="space-y-2">
                      {aiReview.expected_questions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono text-[10px] text-ink-muted shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="text-[11px] text-ink-dim leading-relaxed">{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {aiReview.next_topics && aiReview.next_topics.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-ink mb-2">Study next</p>
                    <div className="flex flex-wrap gap-1.5">
                      {aiReview.next_topics.map((t, i) => (
                        <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-light border border-purple-border text-purple">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {savedNoteId && (
                  <button
                    onClick={() => handleGapAnalysis(savedNoteId)}
                    disabled={analysisRunning}
                    className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors pb-4"
                  >
                    Regenerate ↻
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Prompt to run analysis */}
        {!aiReview && !analysisRunning && content && !isDirty && savedNoteId && (
          <div className="px-5 pt-5 mt-2 border-t border-line">
            <button
              onClick={() => handleGapAnalysis(savedNoteId)}
              className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors"
            >
              Run AI gap analysis ↻
            </button>
          </div>
        )}
      </div>

      {/* ── Right panel — editor (75%) ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-10 pt-5 pb-1 shrink-0 flex items-center justify-between">
          <p className="font-mono text-[10px] text-ink-faint">
            Type <kbd className="px-1 py-0.5 rounded bg-hover border border-line text-[10px]">/</kbd> for headings, lists, code blocks and more
          </p>
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
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-4">
          <RichEditor
            content={content}
            onChange={handleChange}
            placeholder={`Write your notes on ${topic.title}…`}
          />
        </div>

        {error && (
          <p className="px-10 pb-2 text-[12px] text-red-600">{error}</p>
        )}
      </div>

    </div>
  );
}
