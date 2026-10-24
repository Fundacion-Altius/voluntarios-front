"use client";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";

const items = [{ href: "/", label: "Inicio" }, { href: "/planes", label: "Planes" }];
export default function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="nav">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={path === i.href ? "page" : undefined}>{i.label}</Link>
      ))}
    </nav>
  );
}
