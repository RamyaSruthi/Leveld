"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="font-mono text-[13px] font-medium text-ink tracking-tight">
            leveld
          </span>
          <p className="mt-2 text-[13px] text-ink-muted">
            Interview prep for senior engineers
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-[14px] text-ink font-medium mb-2">
              Check your email
            </p>
            <p className="text-[13px] text-ink-dim leading-relaxed">
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-[12px] text-ink-muted underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[12px] font-medium text-ink-dim mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="
                  w-full h-10 px-3 rounded-md text-[13px] font-sans
                  bg-surface border border-line text-ink
                  placeholder:text-ink-faint
                  focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple
                  transition-colors
                "
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="
                w-full h-10 rounded-md text-[13px] font-medium
                bg-purple text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:opacity-90 transition-opacity
              "
            >
              {loading ? "Sending…" : "Continue with email"}
            </button>

            <p className="text-center text-[11px] text-ink-muted">
              No password needed — we&apos;ll email you a sign-in link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
