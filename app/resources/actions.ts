"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResourceCategory } from "@/lib/types";

export async function addResource({
  userId,
  category,
  title,
  url,
  description,
}: {
  userId: string;
  category: ResourceCategory;
  title: string;
  url?: string;
  description?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("resources").insert({
    user_id: userId,
    category,
    title,
    url: url || null,
    description: description || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/resources");
}

export async function deleteResource({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/resources");
}
