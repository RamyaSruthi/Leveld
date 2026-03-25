"use client";

import { useMemo } from "react";
import type { JobApplication, ApplicationStatus } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const TERMINAL: ApplicationStatus[] = ["rejected", "withdrawn", "ghosted"];

export function PipelineDashboard({
  applications,
  nextInterview,
}: {
  applications: JobApplication[];
  nextInterview?: { date: string; name: string; company: string } | null;
}) {
  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) => !TERMINAL.includes(a.status) && a.status !== "offer").length;
    const interviewing = applications.filter((a) => a.status === "interviewing").length;
    const offers = applications.filter((a) => a.status === "offer").length;
    return { total, active, interviewing, offers };
  }, [applications]);

  const jobsWithComp = useMemo(
    () => applications.filter((a) => a.compensation_final),
    [applications]
  );

  if (applications.length === 0) return null;

  return (
    <div className="bg-surface rounded-lg border border-line p-4 space-y-3">
      {/* Stats row */}
      <div className="flex items-center gap-5 flex-wrap">
        <div>
          <p className="font-mono text-[20px] font-medium text-ink leading-none">{stats.total}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Total</p>
        </div>
        <div className="w-px h-8 bg-line" />
        <div>
          <p className="font-mono text-[20px] font-medium text-status-green leading-none">{stats.active}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Active</p>
        </div>
        <div className="w-px h-8 bg-line" />
        <div>
          <p className="font-mono text-[20px] font-medium text-purple leading-none">{stats.interviewing}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Interviewing</p>
        </div>
        {stats.offers > 0 && (
          <>
            <div className="w-px h-8 bg-line" />
            <div>
              <p className="font-mono text-[20px] font-medium text-status-amber leading-none">{stats.offers}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">Offer{stats.offers !== 1 ? "s" : ""}</p>
            </div>
          </>
        )}
      </div>

      {/* Jobs with compensation */}
      {jobsWithComp.map((j) => (
        <div key={j.id} className="flex items-center gap-2 pt-1 border-t border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-status-amber shrink-0" />
          <p className="text-[12px] text-ink-dim">
            <span className="text-ink font-medium">{j.company}</span>
            <span className="text-ink-faint mx-1.5">·</span>
            <span className="font-mono text-[10px] text-ink-muted">{j.status}</span>
            <span className="text-ink-faint mx-1.5">·</span>
            <span className="text-status-green font-medium">{j.compensation_final}</span>
          </p>
        </div>
      ))}

      {/* Next interview */}
      {nextInterview && (
        <div className="flex items-center gap-2 pt-1 border-t border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-status-green shrink-0" />
          <p className="text-[12px] text-ink-dim">
            Next interview:{" "}
            <span className="text-ink font-medium">
              {new Date(nextInterview.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </span>
            {" · "}{nextInterview.name} at {nextInterview.company}
          </p>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Conversion Funnel
// ─────────────────────────────────────────────────────────────────────────────

export function ConversionFunnel({
  applications,
  roundCounts,
  passedCounts,
}: {
  applications: JobApplication[];
  roundCounts: Record<string, number>;
  passedCounts: Record<string, number>;
}) {
  const stages = useMemo(() => {
    const total = applications.length;
    const responded = applications.filter((a) => a.status !== "applied").length;
    // Round stages use PASSED counts — an app counts at Round N only if it cleared N rounds
    const r1 = applications.filter((a) => (passedCounts[a.id] ?? 0) >= 1).length;
    const r2 = applications.filter((a) => (passedCounts[a.id] ?? 0) >= 2).length;
    const r3 = applications.filter((a) => (passedCounts[a.id] ?? 0) >= 3).length;
    const offers = applications.filter((a) => a.status === "offer").length;

    return [
      { label: "Applied",   count: total,     color: "#a29bfe" },
      { label: "Responded", count: responded, color: "#6c5ce7" },
      { label: "Round 1",   count: r1,        color: "#74b9ff" },
      { label: "Round 2",   count: r2,        color: "#0984e3" },
      { label: "Round 3+",  count: r3,        color: "#00cec9" },
      { label: "Offer",     count: offers,    color: "#fdcb6e" },
    ].filter((s) => s.count > 0);
  }, [applications, roundCounts, passedCounts]);

  if (stages.length === 0) return null;

  const W = 480;
  const barH = 34;
  const gap = 10;
  const labelW = 76;
  const maxBarW = 300;
  const barCenterX = labelW + 8 + maxBarW / 2;
  const H = stages.length * (barH + gap);
  const total = stages[0].count;

  return (
    <div className="bg-surface rounded-lg border border-line p-5">
      <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-1">
        Conversion funnel
      </p>
      <p className="text-[11px] text-ink-faint mb-4">Drop-off at each stage</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {stages.map((s, i) => {
          const barW = (s.count / total) * maxBarW;
          const x = barCenterX - barW / 2;
          const y = i * (barH + gap);
          const pct = i === 0 ? "100%" : `${Math.round((s.count / total) * 100)}%`;
          return (
            <g key={s.label}>
              {/* Stage label */}
              <text
                x={labelW}
                y={y + barH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fontFamily="monospace"
                fill="#888"
              >
                {s.label}
              </text>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={s.color}
                fillOpacity={0.75}
                rx={5}
              />
              {/* Count inside bar */}
              {barW > 30 && (
                <text
                  x={x + barW / 2}
                  y={y + barH / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontFamily="monospace"
                  fontWeight="600"
                  fill="white"
                  fillOpacity={0.9}
                >
                  {s.count}
                </text>
              )}
              {/* % on the right */}
              <text
                x={barCenterX + maxBarW / 2 + 10}
                y={y + barH / 2}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={10}
                fontFamily="monospace"
                fill="#aaa"
              >
                {pct}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
