import Link from "next/link";

export function Nav() {
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
      </nav>
    </header>
  );
}
