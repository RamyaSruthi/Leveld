"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuestionAnswer } from "../actions";

interface Question {
  id: string;
  applicationId: string;
  question: string;
  answer: string | null;
}

interface RoundGroup {
  roundName: string;
  questions: Question[];
}

interface AppGroup {
  company: string;
  role: string;
  appId: string;
  rounds: RoundGroup[];
}

export function QuestionsList({ groups, userId }: { groups: AppGroup[]; userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Close edit mode if collapsing
    if (editing === id) setEditing(null);
  }

  function startEdit(q: Question) {
    setEditing(q.id);
    setEditText(q.answer ?? "");
  }

  function handleSave(q: Question) {
    startTransition(async () => {
      await updateQuestionAnswer({ id: q.id, applicationId: q.applicationId, userId, answer: editText });
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {groups.map((appGroup) => (
        <section key={appGroup.appId} className="bg-surface rounded-lg border border-line overflow-hidden">
          {/* Company header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-base">
            <div>
              <p className="text-[14px] font-semibold text-ink">{appGroup.company}</p>
              <p className="text-[11px] text-ink-muted">{appGroup.role}</p>
            </div>
            <span className="font-mono text-[10px] text-ink-faint">
              {appGroup.rounds.reduce((s, r) => s + r.questions.length, 0)} questions
            </span>
          </div>

          {/* Rounds */}
          {appGroup.rounds.map((roundGroup, ri) => (
            <div key={ri} className={`px-5 py-4 ${ri < appGroup.rounds.length - 1 ? "border-b border-line" : ""}`}>
              <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
                {roundGroup.roundName}
              </p>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-line" />

                <ul className="space-y-0">
                  {roundGroup.questions.map((q) => {
                    const isOpen = expanded.has(q.id);
                    const isEditing = editing === q.id;

                    return (
                      <li key={q.id} className="relative pl-6">
                        {/* Dot */}
                        <div className={`absolute left-0 top-[7px] w-[11px] h-[11px] rounded-full border-2 transition-colors z-10
                          ${isOpen ? "border-purple bg-purple" : "border-line-subtle bg-surface"}`}
                        />

                        {/* Question row */}
                        <button onClick={() => toggle(q.id)} className="w-full text-left py-2 group">
                          <div className="flex items-start gap-2">
                            <span className={`flex-1 text-[13px] font-semibold leading-snug transition-colors
                              ${isOpen ? "text-purple" : "text-ink group-hover:text-purple"}`}>
                              {q.question}
                            </span>
                            <span className={`shrink-0 font-mono text-[10px] mt-0.5 transition-colors
                              ${isOpen ? "text-purple" : "text-ink-faint group-hover:text-purple"}`}>
                              {isOpen ? "▲" : "▼"}
                            </span>
                          </div>
                        </button>

                        {/* Answer */}
                        {isOpen && (
                          <div className="pb-3">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <textarea
                                  autoFocus
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={4}
                                  placeholder="Write your answer…"
                                  className="w-full text-[13px] text-ink bg-base border border-line rounded-md px-3 py-2 outline-none focus:border-purple transition-colors placeholder:text-ink-faint resize-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSave(q)}
                                    disabled={isPending}
                                    className="px-3 py-1 rounded-md text-[11px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                                  >
                                    {isPending ? "Saving…" : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditing(null)}
                                    className="px-3 py-1 rounded-md text-[11px] text-ink-muted border border-line hover:bg-hover transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group/answer flex items-start gap-3">
                                <div className="flex-1">
                                  {q.answer ? (
                                    <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                                  ) : (
                                    <p className="text-[12px] text-ink-faint italic">No answer added yet.</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => startEdit(q)}
                                  className="shrink-0 font-mono text-[10px] text-ink-faint hover:text-purple transition-colors opacity-0 group-hover/answer:opacity-100 mt-0.5"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
