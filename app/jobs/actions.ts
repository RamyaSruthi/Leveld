"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, RoundOutcome } from "@/lib/types";

export async function createApplication({
  userId,
  company,
  role,
  status,
  appliedAt,
  jobUrl,
  contactName,
  contactEmail,
  contactPhone,
  contactLinkedin,
  notes,
  compensationAsked,
  compensationFinal,
}: {
  userId: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt?: string;
  jobUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLinkedin?: string;
  notes?: string;
  compensationAsked?: string;
  compensationFinal?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_applications").insert({
    user_id: userId,
    company,
    role,
    status,
    applied_at: appliedAt || new Date().toISOString().split("T")[0],
    job_url: jobUrl || null,
    contact_name: contactName || null,
    contact_email: contactEmail || null,
    contact_phone: contactPhone || null,
    contact_linkedin: contactLinkedin || null,
    notes: notes || null,
    compensation_asked: compensationAsked || null,
    compensation_final: compensationFinal || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/jobs");
}

export async function updateApplicationStatus({
  id,
  userId,
  status,
}: {
  id: string;
  userId: string;
  status: ApplicationStatus;
}) {
  const supabase = await createClient();
  await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
}

export async function updateApplicationNotes({
  id,
  userId,
  notes,
  contactName,
  contactEmail,
  contactPhone,
  contactLinkedin,
  jobUrl,
  compensationAsked,
  compAskedBase,
  compAskedJoiningBonus,
  compAskedEsop,
  compAskedRelocation,
  compensationFinal,
  compFinalBase,
  compFinalJoiningBonus,
  compFinalEsop,
  compFinalRelocation,
}: {
  id: string;
  userId: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLinkedin?: string;
  jobUrl?: string;
  compensationAsked?: string;
  compAskedBase?: string;
  compAskedJoiningBonus?: string;
  compAskedEsop?: string;
  compAskedRelocation?: string;
  compensationFinal?: string;
  compFinalBase?: string;
  compFinalJoiningBonus?: string;
  compFinalEsop?: string;
  compFinalRelocation?: string;
}) {
  const supabase = await createClient();
  await supabase
    .from("job_applications")
    .update({
      notes: notes ?? null,
      contact_name: contactName ?? null,
      contact_email: contactEmail ?? null,
      contact_phone: contactPhone ?? null,
      contact_linkedin: contactLinkedin ?? null,
      job_url: jobUrl ?? null,
      compensation_asked: compensationAsked ?? null,
      comp_asked_base: compAskedBase ?? null,
      comp_asked_joining_bonus: compAskedJoiningBonus ?? null,
      comp_asked_esop: compAskedEsop ?? null,
      comp_asked_relocation: compAskedRelocation ?? null,
      compensation_final: compensationFinal ?? null,
      comp_final_base: compFinalBase ?? null,
      comp_final_joining_bonus: compFinalJoiningBonus ?? null,
      comp_final_esop: compFinalEsop ?? null,
      comp_final_relocation: compFinalRelocation ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath(`/jobs/${id}`);
}

export async function deleteApplication({ id, userId }: { id: string; userId: string }) {
  const supabase = await createClient();
  await supabase.from("job_applications").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/jobs");
}

export async function deleteApplications({ ids, userId }: { ids: string[]; userId: string }) {
  if (ids.length === 0) return;
  const supabase = await createClient();
  await supabase.from("job_applications").delete().in("id", ids).eq("user_id", userId);
  revalidatePath("/jobs");
}

export async function addRound({
  applicationId,
  userId,
  name,
  scheduledAt,
  outcome,
  notes,
}: {
  applicationId: string;
  userId: string;
  name: string;
  scheduledAt?: string;
  outcome: RoundOutcome;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("interview_rounds").insert({
    application_id: applicationId,
    user_id: userId,
    name,
    scheduled_at: scheduledAt || null,
    outcome,
    notes: notes || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${applicationId}`);
}

export async function updateRoundNotes({
  id,
  applicationId,
  userId,
  notes,
}: {
  id: string;
  applicationId: string;
  userId: string;
  notes: string;
}) {
  const supabase = await createClient();
  await supabase
    .from("interview_rounds")
    .update({ notes: notes || null })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${applicationId}`);
}

export async function updateRoundOutcome({
  id,
  applicationId,
  userId,
  outcome,
}: {
  id: string;
  applicationId: string;
  userId: string;
  outcome: RoundOutcome;
}) {
  const supabase = await createClient();
  await supabase
    .from("interview_rounds")
    .update({ outcome })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${applicationId}`);
}

export async function addQuestion({
  userId,
  applicationId,
  roundId,
  question,
}: {
  userId: string;
  applicationId: string;
  roundId: string;
  question: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("interview_questions").insert({
    user_id: userId,
    application_id: applicationId,
    round_id: roundId,
    question,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/jobs/${applicationId}`);
  revalidatePath("/jobs/questions");
}

export async function updateQuestionAnswer({
  id,
  applicationId,
  userId,
  answer,
}: {
  id: string;
  applicationId: string;
  userId: string;
  answer: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("interview_questions")
    .update({ answer: answer || null })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/jobs/${applicationId}`);
  revalidatePath("/jobs/questions");
}

export async function deleteQuestion({
  id,
  applicationId,
  userId,
}: {
  id: string;
  applicationId: string;
  userId: string;
}) {
  const supabase = await createClient();
  await supabase.from("interview_questions").delete().eq("id", id).eq("user_id", userId);
  revalidatePath(`/jobs/${applicationId}`);
  revalidatePath("/jobs/questions");
}

export async function deleteRound({
  id,
  applicationId,
  userId,
}: {
  id: string;
  applicationId: string;
  userId: string;
}) {
  const supabase = await createClient();
  await supabase.from("interview_rounds").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${applicationId}`);
}
