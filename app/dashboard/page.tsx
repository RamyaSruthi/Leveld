import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { PILLAR_LABELS, PILLAR_ORDER, PILLAR_COLORS } from "@/lib/types";
import type { Pillar, TopicWithProgress } from "@/lib/types";

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

  // Fetch user's own topics + progress
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("user_id", user.id)
    .order("order_index");

  const { data: userTopics } = await supabase
    .from("user_topics")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map(
    (userTopics ?? []).map((ut) => [ut.topic_id, ut])
  );

  const topicsWithProgress: TopicWithProgress[] = (topics ?? []).map((t) => ({
    ...t,
    user_topic: progressMap.get(t.id) ?? null,
  }));

  // Due for review today
  const now = new Date();
  const dueReviews = topicsWithProgress.filter((t) => {
    if (!t.user_topic?.next_review_at) return false;
    return new Date(t.user_topic.next_review_at) <= now;
  });

  // Per-pillar stats
  const pillarStats = PILLAR_ORDER.map((pillar) => {
    const all = topicsWithProgress.filter((t) => t.pillar === pillar);
    const donePillar = all.filter((t) => t.user_topic?.status === "done").length;
    return {
      pillar,
      total: all.length,
      pct: all.length ? Math.round((donePillar / all.length) * 100) : 0,
    };
  });

  const totalDone = topicsWithProgress.filter((t) => t.user_topic?.status === "done").length;
  const totalTopics = topicsWithProgress.length;
  const overallPct = totalTopics ? Math.round((totalDone / totalTopics) * 100) : 0;

  const hasAnyTopics = totalTopics > 0;


  return (
    <div className="min-h-screen bg-base">
      <Nav />

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-[220px] shrink-0">
          <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-4">
            Pillars
          </p>
          <div className="space-y-1">
            {pillarStats.map(({ pillar, total, pct }) => (
              <Link
                key={pillar}
                href={`/curriculum/${pillar}`}
                className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover transition-colors"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: PILLAR_COLORS[pillar as Pillar] }}
                />
                <span className="flex-1 text-[12px] text-ink-dim group-hover:text-ink transition-colors truncate">
                  {PILLAR_LABELS[pillar as Pillar]}
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

          {/* Empty state */}
          {!hasAnyTopics && (
            <div className="pt-8">
              <p className="text-[14px] font-medium text-ink mb-2">
                Start building your curriculum
              </p>
              <p className="text-[13px] text-ink-dim mb-6 leading-relaxed">
                Add topics under each pillar — DSA patterns, system design problems, Java concepts, and more.
              </p>
              <div className="flex flex-wrap gap-2">
                {PILLAR_ORDER.map((pillar) => (
                  <Link
                    key={pillar}
                    href={`/curriculum/${pillar}`}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      border border-line hover:border-line-subtle
                      bg-surface hover:bg-hover transition-colors
                      text-[12px] text-ink-dim hover:text-ink
                    "
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: PILLAR_COLORS[pillar as Pillar] }}
                    />
                    {PILLAR_LABELS[pillar as Pillar]}
                  </Link>
                ))}
              </div>
            </div>
          )}


          {/* Due reviews */}
          <section>
            <p className="text-[11px] font-mono text-ink-muted uppercase tracking-widest mb-3">
              Due for review {dueReviews.length > 0 && `· ${dueReviews.length}`}
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
              <p className="text-[12px] text-ink-muted">Nothing due for review today ✓</p>
            )}
          </section>

          {/* Pillar sections */}
          {PILLAR_ORDER.map((pillar) => {
            const pillarTopics = topicsWithProgress.filter(
              (t) => t.pillar === pillar
            );
            if (pillarTopics.length === 0) return null;

            const inProgress = pillarTopics.filter(
              (t) => t.user_topic?.status === "in_progress"
            );
            const notStarted = pillarTopics.filter(
              (t) => !t.user_topic || t.user_topic.status === "not_started"
            );
            const shown = [...inProgress, ...notStarted].slice(0, 5);

            const allDone = pillarTopics.every(
              (t) => t.user_topic?.status === "done"
            );
            if (allDone) return null;

            return (
              <section key={pillar}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: PILLAR_COLORS[pillar as Pillar] }}
                    />
                    <p className="text-[14px] font-medium text-ink">
                      {PILLAR_LABELS[pillar as Pillar]}
                    </p>
                  </div>
                  <Link
                    href={`/curriculum/${pillar}`}
                    className="text-[11px] font-mono text-ink-muted hover:text-ink transition-colors"
                  >
                    View all →
                  </Link>
                </div>
                <div className="bg-surface rounded-lg border border-line overflow-hidden">
                  {shown.map((t, i) => {
                    const status = t.user_topic?.status ?? "not_started";
                    const isDone = status === "done";
                    return (
                      <Link
                        key={t.id}
                        href={`/topic/${t.id}`}
                        className={`
                          flex items-center gap-3 px-4 py-3
                          ${i < shown.length - 1 ? "border-b border-line" : ""}
                          hover:bg-hover transition-colors group
                        `}
                      >
                        <span
                          className={`
                            w-4 h-4 rounded-[4px] border shrink-0 flex items-center justify-center
                            ${isDone ? "bg-purple border-purple" : "border-line-subtle"}
                          `}
                        >
                          {isDone && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`
                            flex-1 text-[13px]
                            ${isDone
                              ? "line-through text-ink-faint"
                              : "text-ink-dim group-hover:text-ink transition-colors"
                            }
                          `}
                        >
                          {t.title}
                        </span>
                        {status === "in_progress" && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full text-status-green border border-status-green-border bg-status-green-bg">
                            In progress
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
