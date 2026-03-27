"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/analytics", label: "Analytics" },
  { href: "/jobs", label: "Jobs" },
  { href: "/mindset", label: "Mindset" },
  { href: "/resources", label: "Resources" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            className={`
              relative text-[12px] px-2.5 py-1.5 rounded-md transition-all duration-200
              ${isActive
                ? "text-purple font-medium bg-purple-light"
                : "text-ink-muted hover:text-ink hover:bg-hover"
              }
            `}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
