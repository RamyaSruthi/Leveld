import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { getUserPillars } from "@/lib/pillars";
import { pillarLabels, pillarColors } from "@/lib/types";
// PillarConfig used via pillarLabels/pillarColors
import { ActivityHeatmap } from "./activity-heatmap";
import { DailyBreakdown } from "./daily-breakdown";

export interface DayActivity {
  date: string; // YYYY-MM-DD
  total: number;
  dsa: number;
  other: number;
  byPillar: Record<string, number>;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const pillars = await getUserPillars(user.id);
  const labels = pillarLabels(pillars);
  const colors = pillarColors(pillars);

  // Fetch all completed daily targets + topics for pillar info
  const [{ data: targets }, { data: topics }, { data: userTopics }] =
    await Promise.all([
      supabase
        .from("daily_targets")
        .select("topic_id, target_date, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("target_date", { ascending: false }),
      supabase
        .from("topics")
        .select("id, pillar, title")
        .eq("user_id", user.id),
      supabase
        .from("user_topics")
        .select("topic_id, status, last_studied_at")
        .eq("user_id", user.id),
    ]);

  const topicMap = new Map(
    (topics ?? []).map((t) => [t.id, t])
  );

  // Build per-day activity from daily_targets (completed)
  const dayMap = new Map<string, DayActivity>();

  for (const target of targets ?? []) {
    const date = target.target_date;
    const topic = topicMap.get(target.topic_id);
    const pillar = topic?.pillar ?? "unknown";

    if (!dayMap.has(date)) {
      dayMap.set(date, { date, total: 0, dsa: 0, other: 0, byPillar: {} });
    }
    const day = dayMap.get(date)!;
    day.total++;
    if (pillar === "dsa") {
      day.dsa++;
    } else {
      day.other++;
    }
    day.byPillar[pillar] = (day.byPillar[pillar] ?? 0) + 1;
  }

  // Also include topics marked done via user_topics.last_studied_at
  // (for topics done before the daily_targets feature existed)
  for (const ut of userTopics ?? []) {
    if (ut.status !== "done" || !ut.last_studied_at) continue;
    const date = ut.last_studied_at.slice(0, 10);
    const topic = topicMap.get(ut.topic_id);
    const pillar = topic?.pillar ?? "unknown";

    // Only add if this date+topic isn't already tracked via daily_targets
    const existingTargets = (targets ?? []).filter(
      (t) => t.target_date === date && t.topic_id === ut.topic_id
    );
    if (existingTargets.length > 0) continue;

    if (!dayMap.has(date)) {
      dayMap.set(date, { date, total: 0, dsa: 0, other: 0, byPillar: {} });
    }
    const day = dayMap.get(date)!;
    day.total++;
    if (pillar === "dsa") {
      day.dsa++;
    } else {
      day.other++;
    }
    day.byPillar[pillar] = (day.byPillar[pillar] ?? 0) + 1;
  }

  const days = Array.from(dayMap.values()).sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  // Compute stats
  const totalDone = (userTopics ?? []).filter((ut) => ut.status === "done").length;
  const totalTopics = (topics ?? []).length;
  const activeDays = days.length;

  // Current streak
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  // Check if today has activity, if not start from yesterday
  const todayStr = checkDate.toISOString().slice(0, 10);
  if (!dayMap.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (dayMap.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Total DSA and Other across all time
  const totalDsa = days.reduce((s, d) => s + d.dsa, 0);
  const totalOther = days.reduce((s, d) => s + d.other, 0);

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-[20px] font-semibold text-ink tracking-tight mb-6">
          Analytics
        </h1>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Current Streak" value={`${streak} day${streak !== 1 ? "s" : ""}`} accent />
          <StatCard label="Active Days" value={String(activeDays)} />
          <StatCard label="Topics Done" value={`${totalDone}/${totalTopics}`} />
          <StatCard
            label="DSA / Other"
            value={`${totalDsa} / ${totalOther}`}
          />
        </div>

        {/* Activity heatmap */}
        <section className="mb-8">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-3">
            Activity
          </p>
          <ActivityHeatmap days={days} />
        </section>

        {/* Per-pillar overall stats */}
        <section className="mb-8">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-3">
            By Pillar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {pillars.map((p) => {
              const pillarTotal = days.reduce(
                (s, d) => s + (d.byPillar[p.slug] ?? 0),
                0
              );
              return (
                <div
                  key={p.slug}
                  className="bg-surface rounded-lg border border-line px-4 py-3 flex items-center gap-3"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink-dim truncate">
                      {p.label}
                    </p>
                    <p className="font-mono text-[14px] font-medium text-ink">
                      {pillarTotal}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Daily breakdown table */}
        <section>
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-3">
            Daily Summary
          </p>
          <DailyBreakdown
            days={days}
            pillars={pillars}
            labels={labels}
            colors={colors}
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface rounded-lg border border-line px-4 py-3">
      <p className="text-[10px] font-mono text-ink-muted uppercase tracking-widest mb-1">
        {label}
      </p>
      <p
        className={`font-mono text-[20px] font-medium leading-none ${
          accent ? "text-purple" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
