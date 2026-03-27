import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { getUserPillars } from "@/lib/pillars";
import { PillarManager } from "./pillar-manager";

export default async function CurriculumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const pillars = await getUserPillars(user.id);

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

  const totalTopics = topics?.length ?? 0;
  const totalDone = (topics ?? []).filter(
    (t) => progressMap.get(t.id)?.status === "done"
  ).length;

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />
      <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
        <div className="flex items-end justify-between mb-1">
          <h1 className="text-[22px] font-semibold text-ink tracking-tight">
            Curriculum
          </h1>
          <PillarManager pillars={pillars} userId={user.id} />
        </div>
        <p className="text-[13px] text-ink-muted mb-8">
          {totalDone} of {totalTopics} topics complete
        </p>

        <div className="space-y-3">
          {pillars.map((pillar) => {
            const pillarTopics = (topics ?? []).filter(
              (t) => t.pillar === pillar.slug
            );
            const done = pillarTopics.filter(
              (t) => progressMap.get(t.id)?.status === "done"
            ).length;
            const pct = pillarTopics.length
              ? Math.round((done / pillarTopics.length) * 100)
              : 0;

            return (
              <Link
                key={pillar.slug}
                href={`/curriculum/${pillar.slug}`}
                className="group block bg-surface rounded-xl border border-line hover:border-line-subtle hover:shadow-sm transition-all duration-200 overflow-hidden"
              >
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
                    style={{ backgroundColor: pillar.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-medium text-ink group-hover:text-ink transition-colors">
                      {pillar.label}
                    </span>
                    {pillarTopics.length > 0 && (
                      <span className="ml-2 font-mono text-[11px] text-ink-faint">
                        {done}/{pillarTopics.length}
                      </span>
                    )}
                  </div>
                  {pillarTopics.length === 0 ? (
                    <span className="font-mono text-[11px] text-ink-faint">
                      No topics yet
                    </span>
                  ) : (
                    <span className="font-mono text-[13px] font-medium text-ink-dim">
                      {pct}%
                    </span>
                  )}
                  <span className="text-ink-faint text-[12px] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200">
                    →
                  </span>
                </div>
                {pillarTopics.length > 0 && (
                  <div className="h-1 bg-line/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${pillar.color}, ${pillar.color}99)`,
                      }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
