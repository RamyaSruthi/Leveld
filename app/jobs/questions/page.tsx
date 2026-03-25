import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { QuestionsList } from "./questions-list";

export default async function QuestionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: questions } = await supabase
    .from("interview_questions")
    .select("*, interview_rounds(name), job_applications(company, role)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Group by application → round
  const appMap = new Map<string, {
    company: string;
    role: string;
    appId: string;
    rounds: Map<string, { roundName: string; questions: { id: string; applicationId: string; question: string; answer: string | null }[] }>;
  }>();

  for (const q of questions ?? []) {
    const app = q.job_applications as { company: string; role: string } | null;
    const round = q.interview_rounds as { name: string } | null;
    if (!app || !round) continue;

    if (!appMap.has(q.application_id)) {
      appMap.set(q.application_id, { company: app.company, role: app.role, appId: q.application_id, rounds: new Map() });
    }
    const appGroup = appMap.get(q.application_id)!;
    if (!appGroup.rounds.has(q.round_id)) {
      appGroup.rounds.set(q.round_id, { roundName: round.name, questions: [] });
    }
    appGroup.rounds.get(q.round_id)!.questions.push({ id: q.id, applicationId: q.application_id, question: q.question, answer: q.answer ?? null });
  }

  const groups = Array.from(appMap.values()).map((g) => ({
    ...g,
    rounds: Array.from(g.rounds.values()),
  }));

  const totalQuestions = questions?.length ?? 0;

  return (
    <div className="min-h-screen bg-base">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/jobs" className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors">
              Jobs
            </Link>
            <span className="text-ink-faint text-[11px]">/</span>
            <span className="font-mono text-[11px] text-ink-dim">Question Bank</span>
          </div>
          <h1 className="text-[20px] font-semibold text-ink tracking-tight">Question Bank</h1>
          <p className="text-[12px] text-ink-muted mt-0.5">
            {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} across {groups.length} company{groups.length !== 1 ? "s" : ""}
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="bg-surface rounded-lg border border-line px-6 py-12 text-center">
            <p className="text-[14px] font-medium text-ink mb-1">No questions logged yet</p>
            <p className="text-[12px] text-ink-muted">Open a job application and add questions from each interview round</p>
          </div>
        ) : (
          <QuestionsList groups={groups} userId={user.id} />
        )}
      </div>
    </div>
  );
}
