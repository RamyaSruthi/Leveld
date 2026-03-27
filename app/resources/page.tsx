import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import type { Resource } from "@/lib/types";
import { ResourcesList } from "./resources-list";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">
            Resources
          </h1>
          <p className="text-[12px] text-ink-muted mt-1">
            Books, articles, and repos you want to keep track of.
          </p>
        </div>

        <ResourcesList
          resources={(resources ?? []) as Resource[]}
          userId={user.id}
        />
      </main>
    </div>
  );
}
