import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { NavLinks } from "./nav-links";

export async function Nav({ userEmail }: { userEmail?: string } = {}) {
  // Only fetch user if email not passed in from parent page
  let email = userEmail;
  if (!email) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email;
  }

  return (
    <header className="h-12 bg-white/80 backdrop-blur-md border-b border-line/60 flex items-center px-6 gap-6 sticky top-0 z-50">
      <Link
        href="/dashboard"
        className="font-mono text-[14px] font-semibold text-ink tracking-tight flex items-center gap-2"
      >
        <span className="w-5 h-5 rounded-md bg-purple flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">L</span>
        </span>
        leveld
      </Link>

      <NavLinks />

      {email && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[11px] text-ink-faint truncate max-w-[180px] font-mono">{email}</span>
          <SignOutButton />
        </div>
      )}
    </header>
  );
}
