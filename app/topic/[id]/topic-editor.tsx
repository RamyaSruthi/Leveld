"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Topic, UserTopic, Note, AiReview, PillarConfig } from "@/lib/types";
import { saveNote, markTopicDone, markTopicInProgress, runGapAnalysis, reviewTopic } from "./actions";
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
}

export function TopicEditor({
  topic,
  userTopic,
  latestNote,
  aiReview: initialAiReview,
  userId,
  pillarConfig,
}: Props) {
  const [content, setContent] = useState(latestNote?.content ?? "");
  const [isDirty, setIsDirty] = useState(false);
  const [aiReview, setAiReview] = useState(initialAiReview);
  const [status, setStatus] = useState(userTopic?.status ?? "not_started");
  const [savedNoteId, setSavedNoteId] = useState(latestNote?.id ?? null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(html: string) {
    setContent(html);
    setIsDirty(true);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      try {
        const result = await saveNote({
          userId,
          topicId: topic.id,
          content,
          currentVersion: latestNote?.version ?? 0,
        });
        if (result.noteId) {
          setSavedNoteId(result.noteId);
          setIsDirty(false);
          // Auto-run gap analysis
          handleGapAnalysis(result.noteId);
        }
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  async function handleGapAnalysis(noteId: string) {
    setAnalysisRunning(true);
    try {
      const review = await runGapAnalysis({ noteId, userId, content });
      if (review) setAiReview(review);
    } catch {
      // Gap analysis failing shouldn't block the user
    } finally {
      setAnalysisRunning(false);
    }
  }

  function handleMarkDone() {
    startTransition(async () => {
      await markTopicDone({ userId, topicId: topic.id });
      setStatus("done");
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

  // Sync status from server after router.refresh()
  useEffect(() => {
    setStatus(userTopic?.status ?? "not_started");
  }, [userTopic?.status]);

  const isDone = status === "done";
  const isDueForReview =
    isDone &&
    userTopic?.next_review_at != null &&
    new Date(userTopic.next_review_at) <= new Date();

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

          {/* Status badge */}
          {status !== "not_started" && (
            <div>
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
          )}

          {/* Review UI (due) or Mark done/undone */}
          {isDueForReview ? (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10px] text-status-amber uppercase tracking-widest">
                Review due
              </p>
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
        <div className="px-10 pt-5 pb-1 shrink-0">
          <p className="font-mono text-[10px] text-ink-faint">
            Type <kbd className="px-1 py-0.5 rounded bg-hover border border-line text-[10px]">/</kbd> for headings, lists, code blocks and more
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-4">
          <RichEditor
            content={content}
            onChange={handleChange}
            placeholder={`Write your notes on ${topic.title}…`}
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
              {isPending ? "Saving…" : "Save notes"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
