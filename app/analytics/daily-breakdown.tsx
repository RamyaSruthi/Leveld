"use client";

import { useState } from "react";
import type { DayActivity } from "./page";
import type { PillarConfig } from "@/lib/types";

interface Props {
  days: DayActivity[];
  pillars: PillarConfig[];
  labels: Record<string, string>;
  colors: Record<string, string>;
}

export function DailyBreakdown({ days, pillars, labels, colors }: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? days : days.slice(0, 14);

  if (days.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-line px-4 py-10 text-center">
        <p className="text-[13px] text-ink-dim mb-1">No activity yet</p>
        <p className="text-[12px] text-ink-muted">
          Start completing daily targets to see your summary here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-line overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[120px_60px_60px_1fr] gap-2 px-4 py-2 border-b border-line bg-base">
        <span className="font-mono text-[9px] text-ink-faint uppercase tracking-widest">
          Date
        </span>
        <span className="font-mono text-[9px] text-ink-faint uppercase tracking-widest text-center">
          DSA
        </span>
        <span className="font-mono text-[9px] text-ink-faint uppercase tracking-widest text-center">
          Other
        </span>
        <span className="font-mono text-[9px] text-ink-faint uppercase tracking-widest">
          Breakdown
        </span>
      </div>

      {/* Rows */}
      {displayed.map((day, i) => {
        const dateObj = new Date(day.date + "T00:00:00");
        const isToday =
          day.date === new Date().toISOString().slice(0, 10);
        const dateLabel = isToday
          ? "Today"
          : dateObj.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

        return (
          <div
            key={day.date}
            className={`
              grid grid-cols-[120px_60px_60px_1fr] gap-2 px-4 py-2.5 items-center
              ${i < displayed.length - 1 ? "border-b border-line" : ""}
              hover:bg-hover transition-colors
            `}
          >
            {/* Date */}
            <div>
              <p
                className={`font-mono text-[11px] ${
                  isToday ? "text-purple font-medium" : "text-ink-dim"
                }`}
              >
                {dateLabel}
              </p>
            </div>

            {/* DSA count */}
            <div className="text-center">
              <span
                className={`font-mono text-[13px] font-medium ${
                  day.dsa > 0 ? "text-purple" : "text-ink-faint"
                }`}
              >
                {day.dsa}
              </span>
            </div>

            {/* Other count */}
            <div className="text-center">
              <span
                className={`font-mono text-[13px] font-medium ${
                  day.other > 0 ? "text-ink" : "text-ink-faint"
                }`}
              >
                {day.other}
              </span>
            </div>

            {/* Pillar breakdown pills */}
            <div className="flex flex-wrap gap-1">
              {pillars
                .filter((p) => (day.byPillar[p.slug] ?? 0) > 0)
                .map((p) => (
                  <span
                    key={p.slug}
                    className="font-mono text-[9px] px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: colors[p.slug] ?? "#6c5ce7",
                      borderColor: colors[p.slug] ?? "#6c5ce7",
                      backgroundColor: `${colors[p.slug] ?? "#6c5ce7"}15`,
                    }}
                  >
                    {labels[p.slug] ?? p.slug} ×{day.byPillar[p.slug]}
                  </span>
                ))}
            </div>
          </div>
        );
      })}

      {/* Show more */}
      {days.length > 14 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full px-4 py-3 text-[11px] font-mono text-ink-muted hover:text-ink hover:bg-hover transition-colors border-t border-line"
        >
          Show all {days.length} days ↓
        </button>
      )}
      {showAll && days.length > 14 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full px-4 py-3 text-[11px] font-mono text-ink-muted hover:text-ink hover:bg-hover transition-colors border-t border-line"
        >
          Show less ↑
        </button>
      )}
    </div>
  );
}
