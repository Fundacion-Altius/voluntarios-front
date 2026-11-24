"use client";

import { useTranslations } from "next-intl";
import { ScrollChipRow } from "@/components/navigation/ScrollChipRow";
import { cn } from "@/lib/utils";

export type AdminStep = "carta" | "abrir" | "sala" | "cierre";

const STEPS: AdminStep[] = ["carta", "abrir", "sala", "cierre"];

function isLocked(id: AdminStep, on: boolean, canOpenSala: boolean, canOpenCierre: boolean): boolean {
  if (on) return false;
  if (id === "sala") return !canOpenSala;
  if (id === "cierre") return !canOpenCierre;
  return false;
}

function chipClass(on: boolean, done: boolean, locked: boolean): string {
  return cn(
    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
    on && "border-primary bg-primary text-primary-foreground",
    done && !on && "border-primary/30 bg-primary/10 text-primary",
    !on && !done && "border-border bg-muted/40 text-muted-foreground",
    locked && "cursor-not-allowed opacity-50",
  );
}

function badgeClass(on: boolean, done: boolean): string {
  if (on) return "bg-primary-foreground text-primary";
  if (done) return "bg-primary text-primary-foreground";
  return "bg-border text-muted-foreground";
}

function StepChip({ id, label, index, done, on, locked, onStep }: {
  id: AdminStep;
  label: string;
  index: number;
  done: boolean;
  on: boolean;
  locked: boolean;
  onStep: (step: AdminStep) => void;
}) {
  return (
    <button
      type="button"
      data-testid={`comandero-step-${id}`}
      data-scroll-active={on ? "true" : undefined}
      disabled={locked}
      onClick={() => onStep(id)}
      className={chipClass(on, done, locked)}
    >
      <span className={cn("grid size-5 place-items-center rounded-full text-xs font-bold", badgeClass(on, done))}>
        {done ? "✓" : index + 1}
      </span>
      {label}
    </button>
  );
}

/** Four-phase docente flow: Carta → Abrir servicio → Sala en vivo → Cierre. */
export function AdminStepper({
  step,
  onStep,
  canOpenSala,
  canOpenCierre,
}: {
  step: AdminStep;
  onStep: (step: AdminStep) => void;
  canOpenSala: boolean;
  canOpenCierre: boolean;
}) {
  const t = useTranslations("comandero.admin.steps");
  const activeIndex = STEPS.indexOf(step);

  return (
    <ScrollChipRow activeKey={step} aria-label={t("aria")} data-testid="comandero-admin-steps" scrollerClassName="pb-1">
      <div className="flex w-max gap-2 pr-4">
        {STEPS.map((id, index) => (
          <StepChip
            key={id}
            id={id}
            label={t(id)}
            index={index}
            done={index < activeIndex}
            on={id === step}
            locked={isLocked(id, id === step, canOpenSala, canOpenCierre)}
            onStep={onStep}
          />
        ))}
      </div>
    </ScrollChipRow>
  );
}
