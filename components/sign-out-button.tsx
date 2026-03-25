"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <button
      onClick={handleSignOut}
      className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors"
    >
      Sign out
    </button>
  );
}
