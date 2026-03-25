import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { ApplicationDetail } from "./application-detail";
import type { JobApplication, InterviewRound, InterviewQuestion } from "@/lib/types";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: app } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!app) notFound();

  const { data: rounds } = await supabase
    .from("interview_rounds")
    .select("*")
    .eq("application_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: questions } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("application_id", params.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />
      <ApplicationDetail
        application={app as JobApplication}
        rounds={(rounds ?? []) as InterviewRound[]}
        questions={(questions ?? []) as InterviewQuestion[]}
        userId={user.id}
      />
    </div>
  );
}
