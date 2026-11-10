"use client";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Same languages as the app (routing.locales). Plain links, so it works without JS.
const NAMES: Record<string, string> = { es: "Español", ca: "Català", en: "English" };
export default function LangSwitch({ label }: { label: string }) {
  const locale = useLocale();
  const path = usePathname();
  return (
    <nav className="lang" aria-label={label}>
      {routing.locales.map((l) => (
        <Link key={l} href={path} locale={l} lang={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>
          <span aria-hidden="true">{l.toUpperCase()}</span><span className="sr">{NAMES[l]}</span>
        </Link>
      ))}
    </nav>
  );
}
