import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { getUserPillars } from "@/lib/pillars";
import { TopicEditor } from "./topic-editor";
import type { SolveAttempt } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function TopicPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!topic) notFound();

  // Get user_topic, latest note, and solve attempts in parallel
  const [{ data: userTopic }, { data: latestNote }, { data: solveAttempts }] =
    await Promise.all([
      supabase
        .from("user_topics")
        .select("*")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .single(),
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .order("version", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("solve_attempts")
        .select("*")
        .eq("user_id", user.id)
        .eq("topic_id", topic.id)
        .order("attempted_at", { ascending: false }),
    ]);

  // Get latest AI review for this note
  let aiReview = null;
  if (latestNote) {
    const { data } = await supabase
      .from("ai_reviews")
      .select("*")
      .eq("note_id", latestNote.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    aiReview = data;
  }

  const pillars = await getUserPillars(user.id);
  const pillarConfig = pillars.find((p) => p.slug === topic.pillar) ?? null;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Nav userEmail={user?.email} />
      <TopicEditor
        topic={topic}
        userTopic={userTopic ?? null}
        latestNote={latestNote ?? null}
        aiReview={aiReview}
        userId={user.id}
        pillarConfig={pillarConfig}
        solveAttempts={(solveAttempts ?? []) as SolveAttempt[]}
      />
    </div>
  );
}
