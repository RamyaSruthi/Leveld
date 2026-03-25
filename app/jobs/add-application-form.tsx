"use client";

import { useState, useTransition } from "react";
import { createApplication } from "./actions";
import type { ApplicationStatus } from "@/lib/types";

const STATUSES: ApplicationStatus[] = ["applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "ghosted"];

export function AddApplicationForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    company: "", role: "", status: "applied" as ApplicationStatus,
    appliedAt: new Date().toISOString().split("T")[0],
    jobUrl: "", contactName: "", contactEmail: "", contactPhone: "", contactLinkedin: "", notes: "",
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createApplication({ userId, ...form });
      setOpen(false);
      setForm({ company: "", role: "", status: "applied", appliedAt: new Date().toISOString().split("T")[0], jobUrl: "", contactName: "", contactEmail: "", contactPhone: "", contactLinkedin: "", notes: "" });
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-purple text-purple hover:bg-purple hover:text-white transition-colors"
      >
        + Add application
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl border border-line shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[15px] font-semibold text-ink mb-5">Add application</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company *">
              <input required value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Google" className={inputCls} />
            </Field>
            <Field label="Role *">
              <input required value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="SWE II" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
            <Field label="Applied date">
              <input type="date" value={form.appliedAt} onChange={(e) => set("appliedAt", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Job URL">
            <input type="url" value={form.jobUrl} onChange={(e) => set("jobUrl", e.target.value)} placeholder="https://…" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact name">
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Jane (HR)" className={inputCls} />
            </Field>
            <Field label="Contact email">
              <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="jane@company.com" className={inputCls} />
            </Field>
          </div>
          <Field label="Contact phone">
            <input type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
          </Field>
          <Field label="LinkedIn / contact URL">
            <input value={form.contactLinkedin} onChange={(e) => set("contactLinkedin", e.target.value)} placeholder="https://linkedin.com/in/…" className={inputCls} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Referral from…" rows={2} className={inputCls + " resize-none"} />
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-md text-[12px] font-medium bg-purple text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
              {isPending ? "Saving…" : "Add application"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md text-[12px] text-ink-muted border border-line hover:bg-hover transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-[12px] text-ink bg-base border border-line rounded-md px-3 py-1.5 outline-none focus:border-purple transition-colors placeholder:text-ink-faint";
