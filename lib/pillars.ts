import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PILLARS } from "@/lib/types";
import type { PillarConfig } from "@/lib/types";

/**
 * Fetch the user's pillar configs from DB.
 * Auto-seeds defaults on first access.
 */
export async function getUserPillars(userId: string): Promise<PillarConfig[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pillars")
    .select("*")
    .eq("user_id", userId)
    .order("order_index");

  if (data && data.length > 0) return data as PillarConfig[];

  // First visit — seed defaults
  const rows = DEFAULT_PILLARS.map((p) => ({ ...p, user_id: userId }));
  await supabase.from("pillars").insert(rows);

  const { data: seeded } = await supabase
    .from("pillars")
    .select("*")
    .eq("user_id", userId)
    .order("order_index");

  return (seeded ?? []) as PillarConfig[];
}
