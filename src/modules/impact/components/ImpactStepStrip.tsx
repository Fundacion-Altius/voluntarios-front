"use client";

import { useTranslations } from "next-intl";
import { ScrollChipRow } from "@/components/navigation/ScrollChipRow";
import type { ImpactAdminView } from "@/modules/impact/catalog";

const STEPS: { id: ImpactAdminView; labelKey: "start" | "mine" | "public" | "paths"; n: number }[] = [
  { id: "library-start", labelKey: "start", n: 1 },
  { id: "library-mine", labelKey: "mine", n: 2 },
  { id: "editor", labelKey: "public", n: 3 },
  { id: "paths", labelKey: "paths", n: 4 },
];

export function ImpactStepStrip({ active, onGo }: { active: ImpactAdminView; onGo: (view: ImpactAdminView) => void }) {
  const t = useTranslations("admin.impact.steps");
  const activeStep =
    STEPS.find((s) => s.id === active)?.n ??
    (active === "library-add" || active === "library-setup" ? 2 : active === "home" ? 0 : 1);

  return (
    <div className="mb-4 pt-10 lg:pt-0" data-testid="impact-step-strip">
      <ScrollChipRow
        activeKey={`${active}-${activeStep}`}
        scrollerClassName="-mx-1 flex items-center gap-2 px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {activeStep > 0 && (
          <span className="shrink-0 whitespace-nowrap text-xs font-bold text-muted-foreground">
            {t("of", { n: activeStep })}
          </span>
        )}
        {STEPS.map((step) => {
          const isOn =
            step.id === active ||
            ((active === "library-add" || active === "library-setup") && step.id === "library-mine");
          const isDone = activeStep > step.n;
          return (
            <button
              key={step.id}
              type="button"
              data-scroll-active={isOn ? "true" : undefined}
              onClick={() => onGo(step.id)}
              className={[
                "shrink-0 whitespace-nowrap rounded-[5px] border px-2.5 py-1 text-xs font-semibold",
                isOn
                  ? "border-primary bg-primary text-primary-foreground"
                  : isDone
                    ? "border-transparent bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
              ].join(" ")}
            >
              {step.n}. {t(step.labelKey)}
            </button>
          );
        })}
      </ScrollChipRow>
    </div>
  );
}
