"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateApplicationStatus, updateApplicationNotes,
  addRound, updateRoundOutcome, updateRoundNotes, deleteRound, deleteApplication,
  addQuestion, deleteQuestion, updateQuestionAnswer,
} from "../actions";
import type { ApplicationStatus, JobApplication, InterviewRound, InterviewQuestion, RoundOutcome } from "@/lib/types";

const STATUS_OPTIONS: ApplicationStatus[] = ["applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "ghosted"];
const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-base border-line text-ink-muted",
  screening: "bg-purple-light border-purple-border text-purple",
  interviewing: "bg-status-green-bg border-status-green-border text-status-green",
  offer: "bg-status-amber-bg border-status-amber-border text-status-amber",
  rejected: "bg-base border-line text-ink-faint",
  withdrawn: "bg-base border-line text-ink-faint",
  ghosted: "bg-orange-50 border-orange-200 text-orange-500",
};
const OUTCOME_STYLES: Record<RoundOutcome, string> = {
  pending: "bg-base border-line text-ink-muted",
  passed: "bg-status-green-bg border-status-green-border text-status-green",
  failed: "bg-red-50 border-red-200 text-red-500",
};

interface Props {
  application: JobApplication;
  rounds: InterviewRound[];
  questions: InterviewQuestion[];
  userId: string;
}

export function ApplicationDetail({ application, rounds, questions, userId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit contact/notes state
  const [editing, setEditing] = useState(false);
  const [contactName, setContactName] = useState(application.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(application.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(application.contact_phone ?? "");
  const [contactLinkedin, setContactLinkedin] = useState(application.contact_linkedin ?? "");
  const [jobUrl, setJobUrl] = useState(application.job_url ?? "");
  const [notes, setNotes] = useState(application.notes ?? "");
  const [compensationAsked, setCompensationAsked] = useState(application.compensation_asked ?? "");
  const [compAskedBase, setCompAskedBase] = useState(application.comp_asked_base ?? "");
  const [compAskedJoiningBonus, setCompAskedJoiningBonus] = useState(application.comp_asked_joining_bonus ?? "");
  const [compAskedEsop, setCompAskedEsop] = useState(application.comp_asked_esop ?? "");
  const [compAskedRelocation, setCompAskedRelocation] = useState(application.comp_asked_relocation ?? "");
  const [compensationFinal, setCompensationFinal] = useState(application.compensation_final ?? "");
  const [compFinalBase, setCompFinalBase] = useState(application.comp_final_base ?? "");
  const [compFinalJoiningBonus, setCompFinalJoiningBonus] = useState(application.comp_final_joining_bonus ?? "");
  const [compFinalEsop, setCompFinalEsop] = useState(application.comp_final_esop ?? "");
  const [compFinalRelocation, setCompFinalRelocation] = useState(application.comp_final_relocation ?? "");

  // Round feedback editing state
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Questions state
  const [newQuestion, setNewQuestion] = useState<Record<string, string>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  // Add round state
  const [addingRound, setAddingRound] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [roundOutcome, setRoundOutcome] = useState<RoundOutcome>("pending");
  const [roundNotes, setRoundNotes] = useState("");

  function handleStatusChange(status: ApplicationStatus) {
    startTransition(async () => {
      await updateApplicationStatus({ id: application.id, userId, status });
      router.refresh();
    });
  }

  function handleSaveDetails() {
    startTransition(async () => {
      await updateApplicationNotes({ id: application.id, userId, notes, contactName, contactEmail, contactPhone, contactLinkedin, jobUrl, compensationAsked, compAskedBase, compAskedJoiningBonus, compAskedEsop, compAskedRelocation, compensationFinal, compFinalBase, compFinalJoiningBonus, compFinalEsop, compFinalRelocation });
      setEditing(false);
      router.refresh();
    });
  }

  function handleAddRound(e: React.FormEvent) {
    e.preventDefault();
    if (!roundName.trim()) return;
    startTransition(async () => {
      await addRound({ applicationId: application.id, userId, name: roundName, scheduledAt: roundDate || undefined, outcome: roundOutcome, notes: roundNotes || undefined });
      setRoundName(""); setRoundDate(""); setRoundOutcome("pending"); setRoundNotes(""); setAddingRound(false);
      router.refresh();
    });
  }

  function handleRoundOutcome(round: InterviewRound, outcome: RoundOutcome) {
    startTransition(async () => {
      await updateRoundOutcome({ id: round.id, applicationId: application.id, userId, outcome });
      router.refresh();
    });
  }

  function handleEditFeedback(round: InterviewRound) {
    setEditingFeedbackId(round.id);
    setFeedbackText(round.notes ?? "");
  }

  function handleSaveFeedback(round: InterviewRound) {
    startTransition(async () => {
      await updateRoundNotes({ id: round.id, applicationId: application.id, userId, notes: feedbackText });
      setEditingFeedbackId(null);
      router.refresh();
    });
  }

  function handleAddQuestion(roundId: string) {
    const q = (newQuestion[roundId] ?? "").trim();
    if (!q) return;
    startTransition(async () => {
      await addQuestion({ userId, applicationId: application.id, roundId, question: q });
      setNewQuestion((prev) => ({ ...prev, [roundId]: "" }));
      router.refresh();
    });
  }

  function handleDeleteQuestion(id: string) {
    startTransition(async () => {
      await deleteQuestion({ id, applicationId: application.id, userId });
      router.refresh();
    });
  }

  function handleSaveAnswer(qId: string) {
    startTransition(async () => {
      try {
        await updateQuestionAnswer({ id: qId, applicationId: application.id, userId, answer: answerText[qId] ?? "" });
        setExpandedQuestion(null);
        router.refresh();
      } catch (e) {
        alert("Failed to save answer: " + (e as Error).message);
      }
    });
  }

  function handleDeleteRound(round: InterviewRound) {
    startTransition(async () => {
      await deleteRound({ id: round.id, applicationId: application.id, userId });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete application for ${application.company}?`)) return;
    startTransition(async () => {
      await deleteApplication({ id: application.id, userId });
      router.push("/jobs");
    });
  }

  const passedCount = rounds.filter((r) => r.outcome === "passed").length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6">
        <Link href="/jobs" className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors">
          Jobs
        </Link>
        <span className="text-ink-faint text-[11px]">/</span>
        <span className="font-mono text-[11px] text-ink-dim">{application.company}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[22px] font-semibold text-ink tracking-tight">{application.company}</h1>
          <p className="text-[14px] text-ink-dim mt-0.5">{application.role}</p>
        </div>
        <button onClick={handleDelete} disabled={isPending} className="font-mono text-[10px] text-ink-faint hover:text-red-500 transition-colors mt-1">
          Delete
        </button>
      </div>

      {/* Status selector */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            disabled={isPending}
            className={`font-mono text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              application.status === s
                ? STATUS_STYLES[s] + " opacity-100"
                : "bg-base border-line text-ink-faint hover:text-ink-muted opacity-60 hover:opacity-100"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Details section */}
        <section className="bg-surface rounded-lg border border-line p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">Details</p>
            <button onClick={() => setEditing(!editing)} className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors">
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact name">
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane (HR)" className={inputCls} />
                </Field>
                <Field label="Contact email">
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="jane@company.com" className={inputCls} />
                </Field>
              </div>
              <Field label="Contact phone">
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
              </Field>
              <Field label="LinkedIn / contact URL">
                <input value={contactLinkedin} onChange={(e) => setContactLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className={inputCls} />
              </Field>
              <Field label="Job URL">
                <input type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://…" className={inputCls} />
              </Field>
              {/* Compensation subsections */}
              <div className="grid grid-cols-2 gap-4">
                {/* Asked */}
                <div className="flex flex-col gap-2 p-3 rounded-md border border-line bg-base">
                  <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">Compensation Asked</p>
                  <Field label="Total">
                    <input value={compensationAsked} onChange={(e) => setCompensationAsked(e.target.value)} placeholder="e.g. 18 LPA" className={inputCls} />
                  </Field>
                  <Field label="Base">
                    <input value={compAskedBase} onChange={(e) => setCompAskedBase(e.target.value)} placeholder="e.g. 15 LPA" className={inputCls} />
                  </Field>
                  <Field label="Joining bonus">
                    <input value={compAskedJoiningBonus} onChange={(e) => setCompAskedJoiningBonus(e.target.value)} placeholder="e.g. ₹1,50,000" className={inputCls} />
                  </Field>
                  <Field label="ESOPs">
                    <input value={compAskedEsop} onChange={(e) => setCompAskedEsop(e.target.value)} placeholder="e.g. $50k / 4 yrs" className={inputCls} />
                  </Field>
                  <Field label="Relocation bonus">
                    <input value={compAskedRelocation} onChange={(e) => setCompAskedRelocation(e.target.value)} placeholder="e.g. ₹50,000" className={inputCls} />
                  </Field>
                </div>
                {/* Final */}
                <div className="flex flex-col gap-2 p-3 rounded-md border border-line bg-base">
                  <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">Compensation Final</p>
                  <Field label="Total">
                    <input value={compensationFinal} onChange={(e) => setCompensationFinal(e.target.value)} placeholder="e.g. 22 LPA" className={inputCls} />
                  </Field>
                  <Field label="Base">
                    <input value={compFinalBase} onChange={(e) => setCompFinalBase(e.target.value)} placeholder="e.g. 18 LPA" className={inputCls} />
                  </Field>
                  <Field label="Joining bonus">
                    <input value={compFinalJoiningBonus} onChange={(e) => setCompFinalJoiningBonus(e.target.value)} placeholder="e.g. ₹2,00,000" className={inputCls} />
                  </Field>
                  <Field label="ESOPs">
                    <input value={compFinalEsop} onChange={(e) => setCompFinalEsop(e.target.value)} placeholder="e.g. $60k / 4 yrs" className={inputCls} />
                  </Field>
                  <Field label="Relocation bonus">
                    <input value={compFinalRelocation} onChange={(e) => setCompFinalRelocation(e.target.value)} placeholder="e.g. ₹75,000" className={inputCls} />
                  </Field>
                </div>
              </div>
              <Field label="Notes">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Referral, notes about the role…" className={inputCls + " resize-none"} />
              </Field>
              <button onClick={handleSaveDetails} disabled={isPending} className="self-start px-4 py-1.5 rounded-md text-[12px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <DetailRow label="Applied">{application.applied_at ? new Date(application.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}</DetailRow>
              <DetailRow label="Contact">
                {application.contact_name ? (
                  <span className="text-[12px] text-ink-dim">
                    {application.contact_name}
                    {application.contact_email && <span className="text-ink-faint"> · {application.contact_email}</span>}
                    {application.contact_phone && <span className="text-ink-faint"> · {application.contact_phone}</span>}
                  </span>
                ) : "—"}
              </DetailRow>
              {application.contact_linkedin && (
                <DetailRow label="LinkedIn">
                  <a href={application.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-[12px] text-purple hover:opacity-75 transition-opacity">
                    {application.contact_linkedin}
                  </a>
                </DetailRow>
              )}
              {application.job_url && (
                <DetailRow label="Job URL">
                  <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-purple hover:opacity-75 transition-opacity truncate block">
                    {application.job_url}
                  </a>
                </DetailRow>
              )}
              {(application.compensation_asked || application.compensation_final ||
                application.comp_asked_base || application.comp_asked_joining_bonus || application.comp_asked_esop || application.comp_asked_relocation ||
                application.comp_final_base || application.comp_final_joining_bonus || application.comp_final_esop || application.comp_final_relocation) && (
                <DetailRow label="Comp">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Asked */}
                    {(application.compensation_asked || application.comp_asked_base || application.comp_asked_joining_bonus || application.comp_asked_esop || application.comp_asked_relocation) && (
                      <div className="space-y-1">
                        <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">Asked</p>
                        {application.compensation_asked && <p className="text-[12px] font-medium text-ink">{application.compensation_asked}</p>}
                        {application.comp_asked_base && <p className="text-[11px] text-ink-muted">Base: <span className="text-ink-dim">{application.comp_asked_base}</span></p>}
                        {application.comp_asked_joining_bonus && <p className="text-[11px] text-ink-muted">Joining: <span className="text-ink-dim">{application.comp_asked_joining_bonus}</span></p>}
                        {application.comp_asked_esop && <p className="text-[11px] text-ink-muted">ESOPs: <span className="text-ink-dim">{application.comp_asked_esop}</span></p>}
                        {application.comp_asked_relocation && <p className="text-[11px] text-ink-muted">Relocation: <span className="text-ink-dim">{application.comp_asked_relocation}</span></p>}
                      </div>
                    )}
                    {/* Final */}
                    {(application.compensation_final || application.comp_final_base || application.comp_final_joining_bonus || application.comp_final_esop || application.comp_final_relocation) && (
                      <div className="space-y-1">
                        <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">Final</p>
                        {application.compensation_final && <p className="text-[12px] font-medium text-status-green">{application.compensation_final}</p>}
                        {application.comp_final_base && <p className="text-[11px] text-ink-muted">Base: <span className="text-ink-dim">{application.comp_final_base}</span></p>}
                        {application.comp_final_joining_bonus && <p className="text-[11px] text-ink-muted">Joining: <span className="text-ink-dim">{application.comp_final_joining_bonus}</span></p>}
                        {application.comp_final_esop && <p className="text-[11px] text-ink-muted">ESOPs: <span className="text-ink-dim">{application.comp_final_esop}</span></p>}
                        {application.comp_final_relocation && <p className="text-[11px] text-ink-muted">Relocation: <span className="text-ink-dim">{application.comp_final_relocation}</span></p>}
                      </div>
                    )}
                  </div>
                </DetailRow>
              )}
              {application.notes && (
                <DetailRow label="Notes">
                  <p className="text-[12px] text-ink-dim leading-relaxed whitespace-pre-wrap">{application.notes}</p>
                </DetailRow>
              )}
            </div>
          )}
        </section>

        {/* Interview rounds */}
        <section className="bg-surface rounded-lg border border-line overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
            <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">
              Interview rounds {rounds.length > 0 && `· ${passedCount}/${rounds.length} passed`}
            </p>
            <button
              onClick={() => setAddingRound(!addingRound)}
              className="font-mono text-[10px] text-purple hover:opacity-75 transition-opacity"
            >
              {addingRound ? "Cancel" : "+ Add round"}
            </button>
          </div>

          {/* Add round form */}
          {addingRound && (
            <form onSubmit={handleAddRound} className="px-5 py-4 border-b border-line bg-base flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Round name *">
                  <input required value={roundName} onChange={(e) => setRoundName(e.target.value)} placeholder="Technical Round 1" className={inputCls} />
                </Field>
                <Field label="Date">
                  <input type="datetime-local" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Outcome">
                  <select value={roundOutcome} onChange={(e) => setRoundOutcome(e.target.value as RoundOutcome)} className={inputCls}>
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </Field>
                <Field label="Notes">
                  <input value={roundNotes} onChange={(e) => setRoundNotes(e.target.value)} placeholder="DSA + System design…" className={inputCls} />
                </Field>
              </div>
              <button type="submit" disabled={isPending} className="self-start px-4 py-1.5 rounded-md text-[12px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
                {isPending ? "Adding…" : "Add round"}
              </button>
            </form>
          )}

          {/* Rounds list */}
          {rounds.length === 0 && !addingRound ? (
            <p className="px-5 py-6 text-[12px] text-ink-muted text-center">No rounds added yet</p>
          ) : (
            rounds.map((round, i) => (
              <div key={round.id} className={`px-5 py-3.5 ${i < rounds.length - 1 ? "border-b border-line" : ""}`}>
                {/* Round header row */}
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-ink">{round.name}</p>
                    {round.scheduled_at && (
                      <p className="font-mono text-[10px] text-ink-muted mt-0.5">
                        {new Date(round.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={round.outcome}
                      onChange={(e) => handleRoundOutcome(round, e.target.value as RoundOutcome)}
                      disabled={isPending}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full border outline-none cursor-pointer ${OUTCOME_STYLES[round.outcome]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <button onClick={() => handleDeleteRound(round)} disabled={isPending} className="text-ink-faint hover:text-red-500 transition-colors text-[12px]">
                      ×
                    </button>
                  </div>
                </div>

                {/* Feedback section */}
                {editingFeedbackId === round.id ? (
                  <div className="mt-2.5 flex flex-col gap-2">
                    <textarea
                      autoFocus
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={3}
                      placeholder="What happened in this round? Topics covered, questions asked, how it went…"
                      className={inputCls + " resize-none text-[11px]"}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveFeedback(round)}
                        disabled={isPending}
                        className="px-3 py-1 rounded-md text-[11px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        {isPending ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingFeedbackId(null)}
                        className="px-3 py-1 rounded-md text-[11px] text-ink-muted border border-line hover:bg-hover transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleEditFeedback(round)}
                    className="mt-2 cursor-pointer group"
                  >
                    {round.notes ? (
                      <p className="text-[11px] text-ink-dim leading-relaxed whitespace-pre-wrap group-hover:text-ink transition-colors">
                        {round.notes}
                      </p>
                    ) : (
                      <p className="text-[11px] text-ink-faint group-hover:text-ink-muted transition-colors italic">
                        Add feedback notes…
                      </p>
                    )}
                  </div>
                )}

                {/* Questions asked */}
                <div className="mt-3 pt-3 border-t border-line">
                  <p className="font-mono text-[9px] text-ink-muted uppercase tracking-widest mb-2">Questions asked</p>
                  <div className="space-y-2 mb-2">
                    {questions.filter((q) => q.round_id === round.id).map((q) => (
                      <div key={q.id} className="group">
                        <div className="flex items-start gap-2">
                          <span className="text-ink-faint mt-0.5 shrink-0">·</span>
                          <button
                            onClick={() => {
                              if (expandedQuestion === q.id) { setExpandedQuestion(null); }
                              else { setExpandedQuestion(q.id); setAnswerText((p) => ({ ...p, [q.id]: q.answer ?? "" })); }
                            }}
                            className="flex-1 text-left text-[12px] text-ink-dim hover:text-ink transition-colors"
                          >
                            {q.question}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            disabled={isPending}
                            className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-red-500 transition-all text-[12px] shrink-0"
                          >
                            ×
                          </button>
                        </div>
                        {expandedQuestion === q.id ? (
                          <div className="ml-4 mt-1.5 flex flex-col gap-1.5">
                            <textarea
                              autoFocus
                              value={answerText[q.id] ?? ""}
                              onChange={(e) => setAnswerText((p) => ({ ...p, [q.id]: e.target.value }))}
                              rows={3}
                              placeholder="Write your answer…"
                              className={inputCls + " resize-none text-[11px]"}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveAnswer(q.id)} disabled={isPending} className="px-3 py-1 rounded-md text-[11px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
                                {isPending ? "Saving…" : "Save"}
                              </button>
                              <button onClick={() => setExpandedQuestion(null)} className="px-3 py-1 rounded-md text-[11px] text-ink-muted border border-line hover:bg-hover transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : q.answer ? (
                          <p className="ml-4 mt-0.5 text-[11px] text-ink-muted leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                        ) : (
                          <p className="ml-4 mt-0.5 text-[10px] text-ink-faint italic">Click to add answer…</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newQuestion[round.id] ?? ""}
                      onChange={(e) => setNewQuestion((prev) => ({ ...prev, [round.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddQuestion(round.id); } }}
                      placeholder="Type a question and press Enter…"
                      className={inputCls + " text-[11px]"}
                    />
                    <button
                      onClick={() => handleAddQuestion(round.id)}
                      disabled={isPending || !(newQuestion[round.id] ?? "").trim()}
                      className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-purple text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest w-20 shrink-0 mt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children ?? <span className="text-[12px] text-ink-faint">—</span>}</div>
    </div>
  );
}

const inputCls = "w-full text-[12px] text-ink bg-white border border-line rounded-md px-3 py-1.5 outline-none focus:border-purple transition-colors placeholder:text-ink-faint";
