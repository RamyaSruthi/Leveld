import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { getUserPillars } from "@/lib/pillars";
import { TopicList } from "./topic-list";
import { PillarResources } from "./pillar-resources";
import type { TopicWithProgress, Resource } from "@/lib/types";

interface Props {
  params: { pillar: string };
}

export default async function PillarPage({ params }: Props) {
  const slug = params.pillar;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const pillars = await getUserPillars(user.id);
  const pillar = pillars.find((p) => p.slug === slug);
  if (!pillar) notFound();

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("pillar", slug)
    .eq("user_id", user.id)
    .order("order_index");

  const [{ data: userTopics }, { data: pillarResources }] = await Promise.all([
    supabase.from("user_topics").select("*").eq("user_id", user.id),
    supabase.from("resources").select("*").eq("user_id", user.id).eq("pillar_slug", slug).order("created_at", { ascending: false }),
  ]);

  const progressMap = new Map(
    (userTopics ?? []).map((ut) => [ut.topic_id, ut])
  );

  const topicsWithProgress: TopicWithProgress[] = (topics ?? []).map((t) => ({
    ...t,
    user_topic: progressMap.get(t.id) ?? null,
  }));

  const done = topicsWithProgress.filter(
    (t) => t.user_topic?.status === "done"
  ).length;
  const pct = topicsWithProgress.length
    ? Math.round((done / topicsWithProgress.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />
      <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-4">
          <Link
            href="/curriculum"
            className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
          >
            Curriculum
          </Link>
          <span className="text-ink-faint text-[11px]">/</span>
          <span className="font-mono text-[11px] text-ink-dim">
            {pillar.label}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: pillar.color }}
          />
          <h1 className="text-[22px] font-semibold text-ink tracking-tight">
            {pillar.label}
          </h1>
          {topicsWithProgress.length > 0 && (
            <span className="font-mono text-[12px] text-ink-muted ml-auto">
              {done}/{topicsWithProgress.length} · {pct}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {topicsWithProgress.length > 0 && (
          <div className="h-1.5 bg-line/40 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${pillar.color}, ${pillar.color}99)`,
              }}
            />
          </div>
        )}

        {/* Topic list with tag filtering */}
        <TopicList
          topics={topicsWithProgress}
          userId={user.id}
          pillarSlug={slug}
          pillars={pillars}
        />

        {/* Pillar resources */}
        <PillarResources
          resources={(pillarResources ?? []) as Resource[]}
          userId={user.id}
          pillarSlug={slug}
        />
      </div>
    </div>
  );
}
