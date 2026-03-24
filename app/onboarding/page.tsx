"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const COMPANIES = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple",
  "Flipkart", "Razorpay", "Swiggy", "PhonePe", "Zepto",
  "Meesho", "Groww", "CRED", "Zomato", "Ola",
];

const TIMELINES = [
  { label: "1 month", value: 1 },
  { label: "2 months", value: 2 },
  { label: "3 months", value: 3 },
  { label: "6 months", value: 6 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<number>(3);
  const [saving, setSaving] = useState(false);

  function toggleCompany(c: string) {
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleDone() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email,
        target_companies: selected,
        timeline_months: timeline,
        start_date: new Date().toISOString().split("T")[0],
      });
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <span className="font-mono text-[12px] text-ink-muted">leveld</span>
          <h1 className="mt-3 text-[22px] font-semibold text-ink leading-tight tracking-tight">
            Let&apos;s personalise your prep
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-dim">
            Takes 30 seconds. You can change this later.
          </p>
        </div>

        {/* Target companies */}
        <div className="mb-8">
          <p className="text-[13px] font-medium text-ink mb-3">
            Which companies are you targeting?
          </p>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => {
              const on = selected.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCompany(c)}
                  className={`
                    px-3 py-1.5 rounded-full border text-[12px] font-mono transition-colors
                    ${on
                      ? "bg-purple border-purple text-white"
                      : "bg-surface border-line text-ink-dim hover:border-line-subtle"
                    }
                  `}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-10">
          <p className="text-[13px] font-medium text-ink mb-3">
            How long until your target interviews?
          </p>
          <div className="flex gap-2">
            {TIMELINES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTimeline(t.value)}
                className={`
                  px-4 py-2 rounded-md border text-[12px] font-mono transition-colors
                  ${timeline === t.value
                    ? "bg-purple border-purple text-white"
                    : "bg-surface border-line text-ink-dim hover:border-line-subtle"
                  }
                `}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleDone}
          disabled={saving}
          className="
            w-full h-10 rounded-md text-[13px] font-medium
            bg-purple text-white
            disabled:opacity-50 hover:opacity-90 transition-opacity
          "
        >
          {saving ? "Setting up…" : "Start prepping →"}
        </button>
      </div>
    </div>
  );
}
