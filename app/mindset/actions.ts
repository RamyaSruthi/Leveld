"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Create a new mindset entry ───────────────────────────────────────────────

export async function createMindsetEntry({
  userId,
  title,
}: {
  userId: string;
  title: string;
}): Promise<{ id: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mindset_entries")
    .insert({ user_id: userId, title, content: "" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/mindset");
  return { id: data.id };
}

// ── Save mindset entry content ───────────────────────────────────────────────

export async function saveMindsetEntry({
  id,
  userId,
  title,
  content,
}: {
  id: string;
  userId: string;
  title: string;
  content: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("mindset_entries")
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/mindset");
  revalidatePath(`/mindset/${id}`);
}

// ── Delete a mindset entry ───────────────────────────────────────────────────

export async function deleteMindsetEntry({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("mindset_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/mindset");
}
