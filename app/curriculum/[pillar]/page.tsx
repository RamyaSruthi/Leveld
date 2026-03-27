import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { getUserPillars } from "@/lib/pillars";
import { AddTopicForm } from "./add-topic-form";
import { TopicRow } from "./topic-row";
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
      <div className="max-w-3xl mx-auto px-6 py-8">
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
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: pillar.color }}
          />
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">
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
          <div className="h-0.5 bg-line rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-purple rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Topic list */}
        <div className="bg-surface rounded-lg border border-line overflow-hidden">
          {topicsWithProgress.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-ink-dim mb-1">No topics yet</p>
              <p className="text-[12px] text-ink-muted">
                Add your first topic below
              </p>
            </div>
          ) : (
            topicsWithProgress.map((t) => (
              <TopicRow key={t.id} topic={t} userId={user.id} pillars={pillars} />
            ))
          )}

          <AddTopicForm pillar={slug} userId={user.id} />
        </div>

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
