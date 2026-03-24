"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PILLAR_LABELS } from "@/lib/types";
import type { Topic, UserTopic, Note, AiReview } from "@/lib/types";
import { saveNote, markTopicDone, markTopicInProgress, runGapAnalysis } from "./actions";

interface Props {
  topic: Topic;
  userTopic: UserTopic | null;
  latestNote: Note | null;
  aiReview: AiReview | null;
  userId: string;
}

export function TopicEditor({
  topic,
  userTopic,
  latestNote,
  aiReview: initialAiReview,
  userId,
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

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
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

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6">
        <Link
          href="/curriculum"
          className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
        >
          Curriculum
        </Link>
        <span className="text-ink-faint text-[11px]">/</span>
        <Link
          href={`/curriculum/${topic.pillar}`}
          className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
        >
          {PILLAR_LABELS[topic.pillar]}
        </Link>
      </div>

      {/* Topic header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-ink tracking-tight mb-1">
            {topic.title}
          </h1>
          {topic.description && (
            <p className="text-[13px] text-ink-dim leading-relaxed">
              {topic.description}
            </p>
          )}
        </div>

        {/* Status actions */}
        <div className="shrink-0 flex items-center gap-2">
          {isDone ? (
            <button
              onClick={handleMarkInProgress}
              disabled={isPending}
              className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-line text-ink-muted hover:text-ink hover:border-line-subtle transition-colors"
            >
              Mark undone
            </button>
          ) : (
            <button
              onClick={handleMarkDone}
              disabled={isPending}
              className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-purple text-purple hover:bg-purple hover:text-white transition-colors"
            >
              {status === "not_started" ? "Mark done" : "Mark done ✓"}
            </button>
          )}
        </div>
      </div>

      {/* Status badge */}
      {status !== "not_started" && (
        <div className="mb-6">
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

      {/* Notes section */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink">Notes</p>
        <p className="font-mono text-[10px] text-ink-muted">
          Markdown supported
        </p>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        placeholder={`Write your notes on ${topic.title} here…\n\nIncludes code snippets, key concepts, and your understanding.`}
        className="
          w-full min-h-[240px] px-4 py-3 rounded-lg
          bg-base border border-line
          font-mono text-[13px] text-ink-dim leading-relaxed
          placeholder:text-ink-faint
          focus:outline-none focus:border-line-subtle resize-y
          transition-colors
        "
      />

      {error && (
        <p className="mt-2 text-[12px] text-red-600">{error}</p>
      )}

      {isDirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="
            mt-3 px-4 py-2 rounded-md text-[12px] font-medium
            bg-purple text-white
            disabled:opacity-50 hover:opacity-90 transition-opacity
          "
        >
          {isPending ? "Saving…" : "Save notes"}
        </button>
      )}

      {/* AI Gap Analysis */}
      {(aiReview || analysisRunning) && (
        <div className="mt-8 pt-6 border-t border-line">
          {analysisRunning ? (
            <p className="text-[12px] text-ink-muted font-mono">
              Analysing your notes…
            </p>
          ) : aiReview ? (
            <div className="space-y-6">
              <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">
                AI Gap Analysis
              </p>

              {/* Gaps */}
              {aiReview.gaps && aiReview.gaps.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-ink mb-2">
                    Gaps identified
                  </p>
                  <ul className="space-y-1.5">
                    {aiReview.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-status-amber shrink-0" />
                        <span className="text-[13px] text-ink-dim leading-relaxed">
                          {gap}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expected questions */}
              {aiReview.expected_questions && aiReview.expected_questions.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-ink mb-2">
                    Expected interview questions
                  </p>
                  <ol className="space-y-2">
                    {aiReview.expected_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="font-mono text-[11px] text-ink-muted shrink-0 mt-0.5">
                          {i + 1}.
                        </span>
                        <span className="text-[13px] text-ink-dim leading-relaxed">
                          {q}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Study next */}
              {aiReview.next_topics && aiReview.next_topics.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-ink mb-2">
                    Study next
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiReview.next_topics.map((t, i) => (
                      <span
                        key={i}
                        className="
                          font-mono text-[11px] px-3 py-1.5 rounded-full
                          bg-purple-light border border-purple-border text-purple
                        "
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Regenerate */}
              {savedNoteId && (
                <button
                  onClick={() => savedNoteId && handleGapAnalysis(savedNoteId)}
                  disabled={analysisRunning}
                  className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
                >
                  Regenerate analysis ↻
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Prompt to save first */}
      {!aiReview && !analysisRunning && content && !isDirty && savedNoteId && (
        <div className="mt-8 pt-6 border-t border-line">
          <button
            onClick={() => handleGapAnalysis(savedNoteId)}
            className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
          >
            Run AI gap analysis ↻
          </button>
        </div>
      )}
    </div>
  );
}
