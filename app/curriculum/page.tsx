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
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-1">
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">
            Curriculum
          </h1>
          <PillarManager pillars={pillars} userId={user.id} />
        </div>
        <p className="text-[13px] text-ink-dim mb-8">
          {totalDone} of {totalTopics} topics complete
        </p>

        <div className="space-y-6">
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
                className="block bg-surface rounded-lg border border-line hover:border-line-subtle transition-colors overflow-hidden"
              >
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: pillar.color }}
                  />
                  <span className="flex-1 text-[14px] font-medium text-ink">
                    {pillar.label}
                  </span>
                  <span className="font-mono text-[11px] text-ink-muted">
                    {pillarTopics.length === 0
                      ? "No topics yet"
                      : `${done}/${pillarTopics.length} · ${pct}%`}
                  </span>
                  <span className="text-ink-faint text-[12px]">→</span>
                </div>
                {pillarTopics.length > 0 && (
                  <div className="h-0.5 bg-line overflow-hidden">
                    <div
                      className="h-full bg-purple transition-all"
                      style={{ width: `${pct}%` }}
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
