"use client";
import { Link, usePathname } from "@/i18n/navigation";

export default function Nav({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="nav">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={path === i.href ? "page" : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
