"use client";

import Link from "next/link";

const links = [
  { href: "/platform/dashboard", label: "Dashboard" },
  { href: "/platform/tenants", label: "Tenants" },
  { href: "/platform/tenants/new", label: "New tenant" },
];

export function PlatformSidebar() {
  return (
    <aside className="w-48 shrink-0 border-r pr-4">
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
