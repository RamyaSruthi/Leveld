"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addDailyTarget({
  userId,
  topicId,
  targetDate,
}: {
  userId: string;
  topicId: string;
  targetDate: string; // YYYY-MM-DD
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("daily_targets").insert({
    user_id: userId,
    topic_id: topicId,
    target_date: targetDate,
    completed: false,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function removeDailyTarget({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_targets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function toggleDailyTargetDone({
  id,
  userId,
  completed,
}: {
  id: string;
  userId: string;
  completed: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_targets")
    .update({ completed })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function addMultipleDailyTargets({
  userId,
  topicIds,
  targetDate,
}: {
  userId: string;
  topicIds: string[];
  targetDate: string;
}) {
  const supabase = await createClient();

  const rows = topicIds.map((topicId) => ({
    user_id: userId,
    topic_id: topicId,
    target_date: targetDate,
    completed: false,
  }));

  const { error } = await supabase.from("daily_targets").insert(rows);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
