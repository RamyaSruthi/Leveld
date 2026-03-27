"use client";

import type { DayActivity } from "./page";

interface Props {
  days: DayActivity[];
}

export function ActivityHeatmap({ days }: Props) {
  // Build a map for quick lookup
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Generate last 16 weeks (112 days) of cells
  const today = new Date();
  const cells: { date: string; count: number }[] = [];

  for (let i = 111; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const activity = dayMap.get(dateStr);
    cells.push({ date: dateStr, count: activity?.total ?? 0 });
  }

  // Max for color scaling
  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  function getColor(count: number) {
    if (count === 0) return "bg-hover";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-purple/20";
    if (ratio <= 0.5) return "bg-purple/40";
    if (ratio <= 0.75) return "bg-purple/70";
    return "bg-purple";
  }

  // Arrange into columns (weeks), rows = days of week (Mon=0 to Sun=6)
  // First cell's day-of-week determines offset
  const firstDate = new Date(cells[0].date);
  const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0

  const grid: (typeof cells[number] | null)[][] = [];
  let currentWeek: (typeof cells[number] | null)[] = [];

  // Pad first week
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push(null);
  }

  for (const cell of cells) {
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    grid.push(currentWeek);
  }

  const dayLabels = ["M", "", "W", "", "F", "", ""];

  return (
    <div className="bg-surface rounded-lg border border-line p-4 overflow-x-auto">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1.5 shrink-0">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center font-mono text-[8px] text-ink-faint"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell, di) => (
              <div
                key={di}
                title={
                  cell
                    ? `${cell.date}: ${cell.count} topic${cell.count !== 1 ? "s" : ""}`
                    : ""
                }
                className={`w-3 h-3 rounded-[2px] ${
                  cell ? getColor(cell.count) : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="font-mono text-[8px] text-ink-faint">Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-hover" />
        <div className="w-3 h-3 rounded-[2px] bg-purple/20" />
        <div className="w-3 h-3 rounded-[2px] bg-purple/40" />
        <div className="w-3 h-3 rounded-[2px] bg-purple/70" />
        <div className="w-3 h-3 rounded-[2px] bg-purple" />
        <span className="font-mono text-[8px] text-ink-faint">More</span>
      </div>
    </div>
  );
}
