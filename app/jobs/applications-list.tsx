"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deleteApplications } from "./actions";
import type { ApplicationStatus, JobApplication, RoundOutcome } from "@/lib/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  ghosted: "Ghosted",
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-base border-line text-ink-muted",
  screening: "bg-purple-light border-purple-border text-purple",
  interviewing: "bg-status-green-bg border-status-green-border text-status-green",
  offer: "bg-status-amber-bg border-status-amber-border text-status-amber",
  rejected: "bg-base border-line text-ink-faint",
  withdrawn: "bg-base border-line text-ink-faint",
  ghosted: "bg-orange-50 border-orange-200 text-orange-500",
};

const DOT_COLOR: Record<RoundOutcome, string> = {
  passed:  "#00b894",
  failed:  "#d63031",
  pending: "#b2bec3",
};

const COLS = "grid-cols-[20px_2fr_1.5fr_1fr_1fr_1fr_1fr]";

type SortKey = "newest" | "oldest" | "next_interview" | "company_az" | "rounds_desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest:         "Newest applied",
  oldest:         "Oldest applied",
  next_interview: "Upcoming interview",
  company_az:     "Company A → Z",
  rounds_desc:    "Most rounds",
};

interface Props {
  apps: JobApplication[];
  roundCounts: Record<string, number>;
  roundsByApp: Record<string, { outcome: RoundOutcome }[]>;
  nextInterviewByApp: Record<string, { date: string; name: string }>;
  userId: string;
}

function formatNextInterview(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function ApplicationsList({ apps, roundCounts, roundsByApp, nextInterviewByApp, userId }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const anySelected = selected.size > 0;

  // Count per status for chips
  const statusCounts = useMemo(() => {
    const counts = {} as Record<ApplicationStatus, number>;
    for (const a of apps) counts[a.status] = (counts[a.status] ?? 0) + 1;
    return counts;
  }, [apps]);

  // Active statuses (only show chips that have apps)
  const activeStatuses = (Object.keys(STATUS_LABELS) as ApplicationStatus[]).filter(
    (s) => (statusCounts[s] ?? 0) > 0
  );

  // Filter + sort
  const visible = useMemo(() => {
    const list = statusFilter ? apps.filter((a) => a.status === statusFilter) : [...apps];

    switch (sortKey) {
      case "newest":
        list.sort((a, b) => new Date(b.applied_at ?? b.created_at).getTime() - new Date(a.applied_at ?? a.created_at).getTime());
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.applied_at ?? a.created_at).getTime() - new Date(b.applied_at ?? b.created_at).getTime());
        break;
      case "next_interview":
        list.sort((a, b) => {
          const da = nextInterviewByApp[a.id]?.date;
          const db = nextInterviewByApp[b.id]?.date;
          if (da && db) return new Date(da).getTime() - new Date(db).getTime();
          if (da) return -1;
          if (db) return 1;
          return 0;
        });
        break;
      case "company_az":
        list.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case "rounds_desc":
        list.sort((a, b) => (roundCounts[b.id] ?? 0) - (roundCounts[a.id] ?? 0));
        break;
    }
    return list;
  }, [apps, statusFilter, sortKey, nextInterviewByApp, roundCounts]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRowClick(e: React.MouseEvent, id: string) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggle(id); return; }
    if (anySelected) { toggle(id); return; }
    router.push(`/jobs/${id}`);
  }

  function handleDeleteSelected() {
    if (!confirm(`Delete ${selected.size} application${selected.size > 1 ? "s" : ""}?`)) return;
    startTransition(async () => {
      await deleteApplications({ ids: Array.from(selected), userId });
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Filter bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter(null)}
            className={`font-mono text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
              statusFilter === null
                ? "bg-ink text-white border-ink"
                : "bg-surface border-line text-ink-muted hover:text-ink hover:border-ink-muted"
            }`}
          >
            All ({apps.length})
          </button>
          {activeStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={`font-mono text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === s
                  ? STATUS_STYLES[s] + " opacity-100"
                  : "bg-surface border-line text-ink-muted hover:text-ink hover:border-ink-muted"
              }`}
            >
              {STATUS_LABELS[s]} ({statusCounts[s]})
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="font-mono text-[10px] text-ink-muted bg-surface border border-line rounded-md px-2.5 py-1 outline-none hover:border-ink-muted cursor-pointer transition-colors"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>{SORT_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        {/* Selection action bar */}
        {anySelected && (
          <div className="flex items-center justify-between px-4 py-2 bg-purple-light border-b border-purple-border">
            <span className="font-mono text-[11px] text-purple">{selected.size} selected</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelected(new Set())}
                className="font-mono text-[10px] text-ink-muted hover:text-ink transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isPending}
                className="font-mono text-[10px] text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting…" : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        )}

        {/* Table header */}
        <div className={`grid ${COLS} gap-4 px-4 py-2.5 border-b border-line bg-base`}>
          <div />
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Company / Role</span>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Next Interview</span>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Rounds</span>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Applied</span>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Comp. Final</span>
          <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">Status</span>
        </div>

        {/* Rows */}
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-ink-muted">No applications match this filter</p>
        ) : (
          visible.map((app, i) => {
            const isSelected = selected.has(app.id);
            const nextInterview = nextInterviewByApp[app.id];
            const dots = roundsByApp[app.id] ?? [];

            return (
              <div
                key={app.id}
                onClick={(e) => handleRowClick(e, app.id)}
                className={`group grid ${COLS} gap-4 px-4 py-3.5 items-center cursor-pointer select-none transition-colors
                  ${isSelected ? "bg-purple-light" : "hover:bg-hover"}
                  ${i < visible.length - 1 ? "border-b border-line" : ""}`}
              >
                {/* Checkbox */}
                <div onClick={(e) => { e.stopPropagation(); toggle(app.id); }} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(app.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-3.5 h-3.5 accent-purple cursor-pointer transition-opacity
                      ${anySelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                  />
                </div>

                {/* Company / Role */}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">{app.company}</p>
                  <p className="text-[11px] text-ink-dim truncate">{app.role}</p>
                </div>

                {/* Next Interview */}
                <div className="min-w-0">
                  {nextInterview ? (
                    <div>
                      <p className="font-mono text-[11px] text-status-green">{formatNextInterview(nextInterview.date)}</p>
                      <p className="text-[10px] text-ink-faint truncate">{nextInterview.name}</p>
                    </div>
                  ) : (
                    <span className="text-[12px] text-ink-faint">—</span>
                  )}
                </div>

                {/* Round progress dots */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {dots.length > 0 ? (
                    dots.map((r, idx) => (
                      <span
                        key={idx}
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: DOT_COLOR[r.outcome] }}
                        title={r.outcome}
                      />
                    ))
                  ) : (
                    <span className="text-[12px] text-ink-faint">—</span>
                  )}
                </div>

                {/* Applied date */}
                <div>
                  {app.applied_at ? (
                    <span className="font-mono text-[11px] text-ink-muted">
                      {new Date(app.applied_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  ) : (
                    <span className="text-[12px] text-ink-faint">—</span>
                  )}
                </div>

                {/* Comp. Final */}
                <div className="min-w-0">
                  {app.compensation_final ? (
                    <span className="font-mono text-[11px] text-status-green truncate">{app.compensation_final}</span>
                  ) : (
                    <span className="text-[12px] text-ink-faint">—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
