import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { getUserPillars } from "@/lib/pillars";
import { pillarLabels, pillarColors } from "@/lib/types";
import type { TopicWithProgress, DailyTarget } from "@/lib/types";
import { DailyTargets } from "./daily-targets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Check onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("start_date, timeline_months")
    .eq("id", user.id)
    .single();

  if (!profile?.start_date) redirect("/onboarding");

  const pillars = await getUserPillars(user.id);
  const labels = pillarLabels(pillars);
  const colors = pillarColors(pillars);
  const slugs = pillars.map((p) => p.slug);

  // Today's date in YYYY-MM-DD (user's local date is approximated by server date)
  const today = new Date().toISOString().slice(0, 10);

  // Fetch topics, progress, and today's daily targets in parallel
  const [{ data: topics }, { data: userTopics }, { data: dailyTargetRows }] =
    await Promise.all([
      supabase
        .from("topics")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index"),
      supabase.from("user_topics").select("*").eq("user_id", user.id),
      supabase
        .from("daily_targets")
        .select("*")
        .eq("user_id", user.id)
        .eq("target_date", today)
        .order("created_at"),
    ]);

  const progressMap = new Map(
    (userTopics ?? []).map((ut) => [ut.topic_id, ut])
  );

  const topicsWithProgress: TopicWithProgress[] = (topics ?? []).map((t) => ({
    ...t,
    user_topic: progressMap.get(t.id) ?? null,
  }));

  const topicMap = new Map(topicsWithProgress.map((t) => [t.id, t]));

  // Enrich daily targets with topic data
  const dailyTargets: (DailyTarget & { topic: TopicWithProgress | null })[] = (
    dailyTargetRows ?? []
  ).map((dt) => ({
    ...dt,
    topic: topicMap.get(dt.topic_id) ?? null,
  }));

  // Due for review today
  const now = new Date();
  const dueReviews = topicsWithProgress.filter((t) => {
    if (!t.user_topic?.next_review_at) return false;
    return new Date(t.user_topic.next_review_at) <= now;
  });

  // Per-pillar stats
  const pillarStats = slugs.map((slug) => {
    const all = topicsWithProgress.filter((t) => t.pillar === slug);
    const donePillar = all.filter(
      (t) => t.user_topic?.status === "done"
    ).length;
    return {
      slug,
      total: all.length,
      pct: all.length ? Math.round((donePillar / all.length) * 100) : 0,
    };
  });

  const totalDone = topicsWithProgress.filter(
    (t) => t.user_topic?.status === "done"
  ).length;
  const totalTopics = topicsWithProgress.length;
  const overallPct = totalTopics
    ? Math.round((totalDone / totalTopics) * 100)
    : 0;

  // Pretty date
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-[220px] shrink-0">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-4">
            Pillars
          </p>
          <div className="space-y-1">
            {pillarStats.map(({ slug, total, pct }) => (
              <Link
                key={slug}
                href={`/curriculum/${slug}`}
                className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[slug] ?? "#6c5ce7" }}
                />
                <span className="flex-1 text-[12px] text-ink-dim group-hover:text-ink transition-colors truncate">
                  {labels[slug] ?? slug}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  {total === 0 ? "—" : `${pct}%`}
                </span>
              </Link>
            ))}
          </div>

          {/* Readiness score */}
          <div className="mt-6 pt-6 border-t border-line">
            <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-2">
              Readiness
            </p>
            <p className="font-mono text-[26px] font-medium text-purple leading-none">
              {overallPct}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">
              {totalDone} of {totalTopics} topics done
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Date header */}
          <div>
            <p className="text-[13px] text-ink-muted">{dateStr}</p>
          </div>

          {/* Daily targets */}
          <DailyTargets
            targets={dailyTargets}
            allTopics={topicsWithProgress}
            pillars={pillars}
            userId={user.id}
            today={today}
          />

          {/* Due reviews */}
          <section>
            <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-3">
              Due for review{" "}
              {dueReviews.length > 0 && `· ${dueReviews.length}`}
            </p>
            {dueReviews.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dueReviews.map((t) => (
                  <Link
                    key={t.id}
                    href={`/topic/${t.id}`}
                    className="
                      px-3 py-1.5 rounded-full border border-status-amber-border
                      bg-status-amber-bg text-status-amber
                      font-mono text-[11px] hover:border-status-amber transition-colors
                    "
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-ink-muted">
                Nothing due for review today ✓
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
