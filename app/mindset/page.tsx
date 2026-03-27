import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import type { MindsetEntry } from "@/lib/types";
import { MindsetList } from "./mindset-list";

export default async function MindsetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: entries } = await supabase
    .from("mindset_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[20px] font-semibold text-ink tracking-tight">
              Mindset
            </h1>
            <p className="text-[12px] text-ink-muted mt-1">
              Ideas, mental models, and frameworks you're building.
            </p>
          </div>
        </div>

        <MindsetList
          entries={(entries ?? []) as MindsetEntry[]}
          userId={user.id}
        />
      </main>
    </div>
  );
}
