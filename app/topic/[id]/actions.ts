"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AiReview } from "@/lib/types";

// ── Save note (new version) ───────────────────────────────────────────────────

export async function saveNote({
  userId,
  topicId,
  content,
  currentVersion,
}: {
  userId: string;
  topicId: string;
  content: string;
  currentVersion: number;
}): Promise<{ noteId: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: userId,
      topic_id: topicId,
      content,
      version: currentVersion + 1,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");

  // Set status to in_progress if not already done
  const { data: existing } = await supabase
    .from("user_topics")
    .select("status")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .single();

  if (!existing || existing.status === "not_started") {
    await supabase.from("user_topics").upsert({
      user_id: userId,
      topic_id: topicId,
      status: "in_progress",
      last_studied_at: new Date().toISOString(),
    }, { onConflict: 'user_id,topic_id' });
  } else {
    await supabase
      .from("user_topics")
      .update({ last_studied_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("topic_id", topicId);
  }

  return { noteId: data.id };
}

// ── Mark topic done (sets spaced repetition schedule) ────────────────────────

export async function markTopicDone({
  userId,
  topicId,
}: {
  userId: string;
  topicId: string;
}) {
  const supabase = await createClient();
  const now = new Date();
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

  revalidatePath("/", "layout");
}

// ── Review topic (SM-2 spaced repetition) ────────────────────────────────────

export async function reviewTopic({
  userId,
  topicId,
  quality,           // 0 = forgot, 3 = hard, 4 = good, 5 = easy
  currentInterval,
  currentEasiness,
  currentReviewCount,
}: {
  userId: string;
  topicId: string;
  quality: number;
  currentInterval: number;
  currentEasiness: number;
  currentReviewCount: number;
}) {
  const supabase = await createClient();
  const now = new Date();

  let newInterval: number;
  let newReviewCount: number;

  if (quality < 3) {
    // Failed recall — reset the schedule
    newInterval = 1;
    newReviewCount = 0;
  } else {
    // Successful recall — apply SM-2 interval progression
    if (currentReviewCount === 0) {
      newInterval = 1;
    } else if (currentReviewCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEasiness);
    }
    newReviewCount = currentReviewCount + 1;
  }

  // Update easiness factor (clamped to minimum 1.3)
  const newEasiness = Math.max(
    1.3,
    currentEasiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  await supabase.from("user_topics").upsert({
    user_id: userId,
    topic_id: topicId,
    status: "done",
    last_studied_at: now.toISOString(),
    next_review_at: nextReview.toISOString(),
    interval_days: newInterval,
    easiness_factor: newEasiness,
    review_count: newReviewCount,
  }, { onConflict: 'user_id,topic_id' });

  revalidatePath("/", "layout");
}

// ── Mark topic in-progress ────────────────────────────────────────────────────

export async function markTopicInProgress({
  userId,
  topicId,
}: {
  userId: string;
  topicId: string;
}) {
  const supabase = await createClient();

  await supabase.from("user_topics").upsert({
    user_id: userId,
    topic_id: topicId,
    status: "in_progress",
    next_review_at: null,
  }, { onConflict: 'user_id,topic_id' });

  revalidatePath("/", "layout");
}

// ── Run AI gap analysis ───────────────────────────────────────────────────────

export async function runGapAnalysis({
  noteId,
  userId,
  content,
}: {
  noteId: string;
  userId: string;
  content: string;
}): Promise<AiReview | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/ai/gap-analysis`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, userId, content }),
    }
  );

  if (!response.ok) return null;
  return response.json();
}
