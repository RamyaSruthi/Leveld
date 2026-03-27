import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { AddApplicationForm } from "./add-application-form";
import { ConversionFunnel, PipelineDashboard } from "./charts";
import { ApplicationsList } from "./applications-list";
import { TargetCompanies } from "./target-companies";
import type { JobApplication, RoundOutcome } from "@/lib/types";

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: applications }, { data: rounds }, { data: profile }] = await Promise.all([
    supabase.from("job_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("interview_rounds").select("application_id, outcome, scheduled_at, name").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("users").select("target_companies").eq("id", user.id).single(),
  ]);

  const targetCompanies: string[] = profile?.target_companies ?? [];

  // Rounds per app (ordered) for dots + funnel
  const roundsByApp: Record<string, { outcome: RoundOutcome }[]> = {};
  const nextInterviewByApp: Record<string, { date: string; name: string }> = {};
  const roundCounts = new Map<string, number>();
  const passedCounts = new Map<string, number>();
  const now = new Date();

  for (const r of rounds ?? []) {
    // For dots
    if (!roundsByApp[r.application_id]) roundsByApp[r.application_id] = [];
    roundsByApp[r.application_id].push({ outcome: r.outcome as RoundOutcome });

    // For funnel — total rounds
    roundCounts.set(r.application_id, (roundCounts.get(r.application_id) ?? 0) + 1);

    // For funnel — passed rounds only
    if (r.outcome === "passed")
      passedCounts.set(r.application_id, (passedCounts.get(r.application_id) ?? 0) + 1);

    // Next upcoming interview: earliest pending round with a future scheduled_at
    if (
      r.outcome === "pending" &&
      r.scheduled_at &&
      new Date(r.scheduled_at) >= now &&
      !nextInterviewByApp[r.application_id]
    ) {
      nextInterviewByApp[r.application_id] = { date: r.scheduled_at, name: r.name };
    }
  }
  const roundCountsObj = Object.fromEntries(roundCounts);
  const passedCountsObj = Object.fromEntries(passedCounts);

  const apps = (applications ?? []) as JobApplication[];

  // Earliest upcoming interview across all apps
  let globalNextInterview: { date: string; name: string; company: string } | null = null;
  for (const [appId, interview] of Object.entries(nextInterviewByApp)) {
    if (!globalNextInterview || new Date(interview.date) < new Date(globalNextInterview.date)) {
      const company = apps.find((a) => a.id === appId)?.company ?? "";
      globalNextInterview = { ...interview, company };
    }
  }

  const stats = {
    total: apps.length,
    interviewing: apps.filter((a) => a.status === "interviewing").length,
    offer: apps.filter((a) => a.status === "offer").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-base">
      <Nav userEmail={user?.email} />
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-ink tracking-tight">Job Applications</h1>
            <p className="text-[13px] text-ink-muted mt-0.5">
              {stats.total} application{stats.total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/jobs/questions"
              className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-line text-ink-muted hover:border-ink-muted hover:text-ink transition-colors"
            >
              Question bank
            </Link>
            <AddApplicationForm userId={user.id} />
          </div>
        </div>

        {/* Pipeline Dashboard */}
        {apps.length > 0 && (
          <div className="mb-4">
            <PipelineDashboard applications={apps} nextInterview={globalNextInterview} />
          </div>
        )}

        {/* Conversion Funnel */}
        {apps.length > 1 && (
          <div className="mb-6">
            <ConversionFunnel applications={apps} passedCounts={passedCountsObj} />
          </div>
        )}

        {/* Target Companies */}
        <div className="mb-6">
          <TargetCompanies userId={user.id} companies={targetCompanies} />
        </div>

        {/* List */}
        {apps.length === 0 ? (
          <div className="bg-surface rounded-xl border border-line/60 px-6 py-16 text-center">
            <p className="text-[28px] mb-3">📋</p>
            <p className="text-[14px] font-medium text-ink mb-1">No applications yet</p>
            <p className="text-[12px] text-ink-muted">Add your first job application to start tracking</p>
          </div>
        ) : (
          <ApplicationsList
            apps={apps}
            roundCounts={roundCountsObj}
            roundsByApp={roundsByApp}
            nextInterviewByApp={nextInterviewByApp}
            userId={user.id}
          />
        )}
      </div>
    </div>
  );
}
