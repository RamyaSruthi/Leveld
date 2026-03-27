"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Rename a pillar ──────────────────────────────────────────────────────────

export async function renamePillar({
  pillarId,
  userId,
  newLabel,
}: {
  pillarId: string;
  userId: string;
  newLabel: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pillars")
    .update({ label: newLabel })
    .eq("id", pillarId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ── Update pillar color ──────────────────────────────────────────────────────

export async function updatePillarColor({
  pillarId,
  userId,
  color,
}: {
  pillarId: string;
  userId: string;
  color: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pillars")
    .update({ color })
    .eq("id", pillarId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ── Add a new pillar ─────────────────────────────────────────────────────────

export async function addPillar({
  userId,
  label,
  color,
}: {
  userId: string;
  label: string;
  color?: string;
}): Promise<{ slug: string }> {
  const supabase = await createClient();

  // Generate slug from label
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // Get next order_index
  const { data: last } = await supabase
    .from("pillars")
    .select("order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (last?.order_index ?? 0) + 1;

  const { error } = await supabase.from("pillars").insert({
    user_id: userId,
    slug,
    label,
    color: color ?? "#6c5ce7",
    order_index: nextIndex,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return { slug };
}

// ── Delete a pillar ──────────────────────────────────────────────────────────

export async function deletePillar({
  pillarId,
  userId,
  slug,
}: {
  pillarId: string;
  userId: string;
  slug: string;
}) {
  const supabase = await createClient();

  // Check if there are topics under this pillar
  const { count } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("pillar", slug);

  if (count && count > 0) {
    throw new Error("Move or delete all topics in this pillar first.");
  }

  const { error } = await supabase
    .from("pillars")
    .delete()
    .eq("id", pillarId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
