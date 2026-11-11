"use client";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ScrollChipRow } from "@/components/navigation/ScrollChipRow";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ToysTab = "resumen" | "inventario" | "familias" | "turnos" | "entrega" | "cierre";

const TABS: { key: ToysTab; href: string; testid: string }[] = [
  { key: "resumen", href: "/admin/toys", testid: "toys-tab-resumen" },
  { key: "inventario", href: "/admin/toys/stock", testid: "toys-tab-inventario" },
  { key: "familias", href: "/admin/toys/familias", testid: "toys-tab-familias" },
  { key: "turnos", href: "/admin/toys/turnos", testid: "toys-tab-turnos" },
  { key: "entrega", href: "/admin/toys/entrega", testid: "toys-tab-entrega" },
  { key: "cierre", href: "/admin/toys/cierre", testid: "toys-tab-cierre" },
];

/** Campaign header shared by every toys admin screen: title, status, tabs. */
export function ToysHeader({
  active,
  title,
  subtitle,
  actions,
}: {
  active: ToysTab;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const t = useTranslations("admin.toys");
  return (
    <header className="flex flex-col gap-4" data-testid="toys-header">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("campana.eyebrow")}</p>
          <h1 className="font-heading text-3xl font-bold leading-tight">{title}</h1>
          {subtitle && <div className="mt-1 text-muted-foreground">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <ScrollChipRow
        activeKey={active}
        aria-label={t("campana.navegacion")}
        data-testid="toys-tabs"
        scrollerClassName="-mx-1 border-b [scrollbar-width:thin]"
      >
        <ul className="flex w-max min-w-full flex-nowrap gap-x-1 px-1 pr-4">
          {TABS.map((tab) => {
            const on = tab.key === active;
            return (
              <li key={tab.key} className="shrink-0">
                <Link
                  href={tab.href}
                  data-testid={tab.testid}
                  data-scroll-active={on ? "true" : undefined}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "-mb-px inline-flex min-h-11 min-w-11 items-center whitespace-nowrap border-b-[3px] px-3 text-sm font-medium outline-none transition-colors focus-visible:rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    on
                      ? "border-primary font-semibold text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`campana.tabs.${tab.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </ScrollChipRow>
    </header>
  );
}
