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
  pillarSlug,
}: {
  userId: string;
  category: ResourceCategory;
  title: string;
  url?: string;
  description?: string;
  pillarSlug?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("resources").insert({
    user_id: userId,
    category,
    title,
    url: url || null,
    description: description || null,
    pillar_slug: pillarSlug || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/resources");
  if (pillarSlug) revalidatePath(`/curriculum/${pillarSlug}`);
}

export async function deleteResource({
  id,
  userId,
  pillarSlug,
}: {
  id: string;
  userId: string;
  pillarSlug?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/resources");
  if (pillarSlug) revalidatePath(`/curriculum/${pillarSlug}`);
}
