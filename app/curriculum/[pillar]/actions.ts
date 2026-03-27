"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleTopicDone({
  topicId,
  userId,
  currentlyDone,
}: {
  topicId: string;
  userId: string;
  currentlyDone: boolean;
}) {
  const supabase = await createClient();
  const now = new Date();

  if (currentlyDone) {
    await supabase.from("user_topics").upsert({
      user_id: userId,
      topic_id: topicId,
      status: "in_progress",
      next_review_at: null,
    }, { onConflict: 'user_id,topic_id' });
  } else {
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1);
    await supabase.from("user_topics").upsert({
      user_id: userId,
      topic_id: topicId,
      status: "done",
      last_studied_at: now.toISOString(),
      next_review_at: nextReview.toISOString(),
      interval_days: 1,
      review_count: 0,
    }, { onConflict: 'user_id,topic_id' });
  }

  revalidatePath("/", "layout");
}

export async function createTopic({
  pillar,
  userId,
  title,
  description,
  tag,
  roadmap,
  topic_type,
  is_company_specific,
  company,
  source_url,
}: {
  pillar: string;
  userId: string;
  title: string;
  description?: string;
  tag?: string;
  roadmap?: string;
  topic_type?: string;
  is_company_specific?: boolean;
  company?: string;
  source_url?: string;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("topics")
    .select("order_index")
    .eq("user_id", userId)
    .eq("pillar", pillar)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (existing?.order_index ?? 0) + 1;

  const { error } = await supabase.from("topics").insert({
    user_id: userId,
    pillar,
    title,
    description: description || null,
    order_index: nextIndex,
    is_custom: true,
    tag: tag || null,
    roadmap: roadmap || null,
    topic_type: topic_type || null,
    is_company_specific: is_company_specific ?? false,
    company: company || null,
    source_url: source_url || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}


export async function deleteTopic({ topicId, userId }: { topicId: string; userId: string }) {
  const supabase = await createClient();
  await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("user_id", userId);
}

export async function updateTopicTag({
  topicId,
  userId,
  tag,
}: {
  topicId: string;
  userId: string;
  tag: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("topics")
    .update({ tag })
    .eq("id", topicId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function recordSolveAttemptFromList({
  userId,
  topicId,
  attemptType,
  timeTakenMins,
}: {
  userId: string;
  topicId: string;
  attemptType: "first_solve" | "revision_solve" | "skimmed";
  timeTakenMins?: number | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("solve_attempts").insert({
    user_id: userId,
    topic_id: topicId,
    attempt_type: attemptType,
    time_taken_mins: timeTakenMins ?? null,
  });

  if (error) {
    console.error("Error recording solve attempt:", error.message);
  }
  revalidatePath("/", "layout");
}

export async function updateTopicType({
  topicId,
  userId,
  topicType,
}: {
  topicId: string;
  userId: string;
  topicType: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("topics")
    .update({ topic_type: topicType })
    .eq("id", topicId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function moveTopicToPillar({
  topicId,
  userId,
  newPillar,
}: {
  topicId: string;
  userId: string;
  newPillar: string;
}) {
  const supabase = await createClient();

  // Get next order_index in the target pillar
  const { data: existing } = await supabase
    .from("topics")
    .select("order_index")
    .eq("user_id", userId)
    .eq("pillar", newPillar)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (existing?.order_index ?? 0) + 1;

  const { error } = await supabase
    .from("topics")
    .update({ pillar: newPillar, order_index: nextIndex })
    .eq("id", topicId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
