import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const uid = user.id;

  // ── 1. Insert 20 applications ────────────────────────────────────────────
  const appsPayload = [
    { company: "Google",      role: "SWE II",               status: "rejected",     applied_at: "2025-01-05" },
    { company: "Meta",        role: "Backend Engineer",     status: "offer",        applied_at: "2025-01-08" },
    { company: "Microsoft",   role: "Frontend Developer",   status: "interviewing", applied_at: "2025-01-12" },
    { company: "Amazon",      role: "SDE II",               status: "rejected",     applied_at: "2025-01-15" },
    { company: "Apple",       role: "iOS Engineer",         status: "withdrawn",    applied_at: "2025-01-18" },
    { company: "Netflix",     role: "Senior SWE",           status: "offer",        applied_at: "2025-01-20" },
    { company: "Stripe",      role: "Software Engineer",    status: "rejected",     applied_at: "2025-01-22" },
    { company: "Airbnb",      role: "Full Stack Engineer",  status: "interviewing", applied_at: "2025-01-25" },
    { company: "Uber",        role: "SWE",                  status: "rejected",     applied_at: "2025-01-28" },
    { company: "Lyft",        role: "Backend Engineer",     status: "screening",    applied_at: "2025-02-01" },
    { company: "Spotify",     role: "Software Engineer",    status: "rejected",     applied_at: "2025-02-03" },
    { company: "Adobe",       role: "React Developer",      status: "interviewing", applied_at: "2025-02-05" },
    { company: "Salesforce",  role: "SWE II",               status: "applied",      applied_at: "2025-02-08" },
    { company: "Oracle",      role: "Java Developer",       status: "screening",    applied_at: "2025-02-10" },
    { company: "IBM",         role: "Cloud Engineer",       status: "screening",    applied_at: "2025-02-12" },
    { company: "Atlassian",   role: "Software Engineer",    status: "rejected",     applied_at: "2025-02-14" },
    { company: "GitHub",      role: "DevEx Engineer",       status: "offer",        applied_at: "2025-02-16" },
    { company: "Dropbox",     role: "Software Engineer",    status: "withdrawn",    applied_at: "2025-02-18" },
    { company: "Notion",      role: "Product Engineer",     status: "interviewing", applied_at: "2025-02-20" },
    { company: "Figma",       role: "Frontend Engineer",    status: "rejected",     applied_at: "2025-02-22" },
  ].map((a) => ({ ...a, user_id: uid }));

  const { data: apps, error: appsErr } = await supabase
    .from("job_applications")
    .insert(appsPayload)
    .select("id, company");

  if (appsErr || !apps) {
    return <pre className="p-8 text-red-500">Error inserting applications: {appsErr?.message}</pre>;
  }

  // Map company → id for round insertion
  const idOf = (company: string) => apps.find((a) => a.company === company)?.id!;

  // ── 2. Insert interview rounds ────────────────────────────────────────────
  // Google  – 2 rounds, passed both, still rejected after
  // Meta    – 3 rounds, all passed → offer
  // Microsoft – 2 rounds passed, 1 pending → interviewing
  // Amazon  – 1 round failed → rejected
  // Apple   – 1 round passed → withdrawn
  // Netflix – 4 rounds all passed → offer
  // Stripe  – 2 rounds (1 passed, 1 failed) → rejected
  // Airbnb  – 1 round pending → interviewing
  // Uber    – 0 rounds → rejected directly
  // Spotify – 1 round failed → rejected
  // Adobe   – 2 rounds passed → interviewing (still going)
  // Atlassian – 3 rounds (2 passed, last failed) → rejected
  // GitHub  – 2 rounds passed → offer
  // Dropbox – 0 rounds → withdrawn directly
  // Notion  – 1 round passed → interviewing (still going)
  // Figma   – 2 rounds (1 passed, 1 failed) → rejected

  const roundsPayload = [
    // Google (2 rounds, rejected)
    { application_id: idOf("Google"),    user_id: uid, name: "Phone Screen",    outcome: "passed", scheduled_at: "2025-01-10T10:00" },
    { application_id: idOf("Google"),    user_id: uid, name: "Technical Round", outcome: "passed", scheduled_at: "2025-01-14T11:00" },

    // Meta (3 rounds → offer)
    { application_id: idOf("Meta"),      user_id: uid, name: "Recruiter Screen",  outcome: "passed", scheduled_at: "2025-01-12T09:00" },
    { application_id: idOf("Meta"),      user_id: uid, name: "Technical Round 1", outcome: "passed", scheduled_at: "2025-01-16T10:00" },
    { application_id: idOf("Meta"),      user_id: uid, name: "Technical Round 2", outcome: "passed", scheduled_at: "2025-01-20T11:00" },

    // Microsoft (2 passed + 1 pending → interviewing)
    { application_id: idOf("Microsoft"), user_id: uid, name: "Phone Screen",      outcome: "passed",  scheduled_at: "2025-01-16T14:00" },
    { application_id: idOf("Microsoft"), user_id: uid, name: "Technical Round 1", outcome: "passed",  scheduled_at: "2025-01-20T10:00" },
    { application_id: idOf("Microsoft"), user_id: uid, name: "Technical Round 2", outcome: "pending", scheduled_at: "2025-02-01T10:00" },

    // Amazon (1 round failed → rejected)
    { application_id: idOf("Amazon"),    user_id: uid, name: "OA",                outcome: "failed", scheduled_at: "2025-01-18T09:00" },

    // Apple (1 round passed → withdrawn)
    { application_id: idOf("Apple"),     user_id: uid, name: "Recruiter Call",    outcome: "passed", scheduled_at: "2025-01-22T15:00" },

    // Netflix (4 rounds → offer)
    { application_id: idOf("Netflix"),   user_id: uid, name: "HR Screen",         outcome: "passed", scheduled_at: "2025-01-24T09:00" },
    { application_id: idOf("Netflix"),   user_id: uid, name: "Technical Round 1", outcome: "passed", scheduled_at: "2025-01-27T10:00" },
    { application_id: idOf("Netflix"),   user_id: uid, name: "Technical Round 2", outcome: "passed", scheduled_at: "2025-01-30T10:00" },
    { application_id: idOf("Netflix"),   user_id: uid, name: "Culture Fit",       outcome: "passed", scheduled_at: "2025-02-02T11:00" },

    // Stripe (1 passed, 1 failed → rejected)
    { application_id: idOf("Stripe"),    user_id: uid, name: "Phone Screen",      outcome: "passed", scheduled_at: "2025-01-26T10:00" },
    { application_id: idOf("Stripe"),    user_id: uid, name: "Technical Round",   outcome: "failed", scheduled_at: "2025-01-30T11:00" },

    // Airbnb (1 pending → interviewing)
    { application_id: idOf("Airbnb"),    user_id: uid, name: "Phone Screen",      outcome: "pending", scheduled_at: "2025-02-05T10:00" },

    // Spotify (1 failed → rejected)
    { application_id: idOf("Spotify"),   user_id: uid, name: "Technical Screen",  outcome: "failed", scheduled_at: "2025-02-06T09:00" },

    // Adobe (2 passed → interviewing)
    { application_id: idOf("Adobe"),     user_id: uid, name: "Recruiter Call",    outcome: "passed", scheduled_at: "2025-02-08T10:00" },
    { application_id: idOf("Adobe"),     user_id: uid, name: "Technical Round 1", outcome: "passed", scheduled_at: "2025-02-12T11:00" },

    // Atlassian (2 passed, 1 failed → rejected)
    { application_id: idOf("Atlassian"), user_id: uid, name: "Phone Screen",      outcome: "passed", scheduled_at: "2025-02-17T09:00" },
    { application_id: idOf("Atlassian"), user_id: uid, name: "Technical Round 1", outcome: "passed", scheduled_at: "2025-02-19T10:00" },
    { application_id: idOf("Atlassian"), user_id: uid, name: "Technical Round 2", outcome: "failed", scheduled_at: "2025-02-21T10:00" },

    // GitHub (2 passed → offer)
    { application_id: idOf("GitHub"),    user_id: uid, name: "Recruiter Screen",  outcome: "passed", scheduled_at: "2025-02-18T09:00" },
    { application_id: idOf("GitHub"),    user_id: uid, name: "Technical Round",   outcome: "passed", scheduled_at: "2025-02-21T10:00" },

    // Notion (1 passed → interviewing)
    { application_id: idOf("Notion"),    user_id: uid, name: "Phone Screen",      outcome: "passed", scheduled_at: "2025-02-22T14:00" },

    // Figma (1 passed, 1 failed → rejected)
    { application_id: idOf("Figma"),     user_id: uid, name: "Technical Screen",  outcome: "passed", scheduled_at: "2025-02-24T10:00" },
    { application_id: idOf("Figma"),     user_id: uid, name: "Onsite Round",      outcome: "failed", scheduled_at: "2025-02-26T11:00" },
  ];

  const { error: roundsErr } = await supabase.from("interview_rounds").insert(roundsPayload);

  if (roundsErr) {
    return <pre className="p-8 text-red-500">Apps inserted but rounds failed: {roundsErr.message}</pre>;
  }

  redirect("/jobs");
}
