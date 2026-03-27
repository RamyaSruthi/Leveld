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
      className="font-mono text-[11px] text-ink-muted hover:text-ink px-2.5 py-1 rounded-md hover:bg-hover transition-all duration-200"
    >
      Sign out
    </button>
  );
}
