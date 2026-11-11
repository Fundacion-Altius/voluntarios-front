"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Discrete chip next to seeded demo rows (families, slots, services). */
export function DemoDataBadge({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      data-testid="demo-data-badge"
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {t("demoData")}
    </span>
  );
}
