import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function Nav({ userEmail }: { userEmail?: string } = {}) {
  // Only fetch user if email not passed in from parent page
  let email = userEmail;
  if (!email) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email;
  }

  return (
    <header className="h-11 bg-surface border-b border-line flex items-center px-6 gap-8 sticky top-0 z-10">
      <Link
        href="/dashboard"
        className="font-mono text-[13px] font-medium text-ink tracking-tight"
      >
        leveld
      </Link>
      <nav className="flex items-center gap-6">
        <Link href="/dashboard" className="text-[12px] text-ink-muted hover:text-ink transition-colors">
          Dashboard
        </Link>
        <Link href="/curriculum" className="text-[12px] text-ink-muted hover:text-ink transition-colors">
          Curriculum
        </Link>
        <Link href="/analytics" className="text-[12px] text-ink-muted hover:text-ink transition-colors">
          Analytics
        </Link>
        <Link href="/jobs" className="text-[12px] text-ink-muted hover:text-ink transition-colors">
          Jobs
        </Link>
      </nav>

      {email && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[11px] text-ink-faint truncate max-w-[180px]">{email}</span>
          <SignOutButton />
        </div>
      )}
    </header>
  );
}
