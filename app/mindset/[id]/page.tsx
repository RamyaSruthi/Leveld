import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { MindsetEditor } from "./mindset-editor";
import type { MindsetEntry } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function MindsetEntryPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: entry } = await supabase
    .from("mindset_entries")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Nav userEmail={user?.email} />
      <MindsetEditor entry={entry as MindsetEntry} userId={user.id} />
    </div>
  );
}
