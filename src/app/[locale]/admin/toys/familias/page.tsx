"use client";
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/auth/useAuth";
import { DemoDataBadge } from "@/components/DemoDataBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { isDemoHouseholdCode } from "@/lib/demoData";
import { cn } from "@/lib/utils";
import { Field } from "../_components/Field";
import { ToysHeader } from "../_components/ToysHeader";
import type { Slot } from "../turnos/slots";
import { useToys } from "../useToys";
import { countByStatus, FAMILY_STATUSES, type Family, type FamilyStatus, familyPage, filterFamilies } from "./families";

type Panel = { family: Family | null };

const STATUS_STYLE: Record<FamilyStatus, string> = {
  inscrita: "bg-muted text-foreground",
  reservado: "bg-accent text-primary",
  recogido: "bg-success/10 text-success",
};

export default function ToysFamiliesPage() {
  const t = useTranslations("admin.toys");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [families, setFamilies] = useState<Family[] | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [notice, setNotice] = useState("");
  const [requested, setRequested] = useState(false);

  const load = useCallback(async () => {
    const [f, s] = await Promise.all([api.listFamilies(), api.listSlots()]);
    setFamilies(f.success ? (f.data as Family[]) : []);
    setSlots(s.success ? (s.data as Slot[]) : []);
  }, [api]);

  useEffect(() => {
    if (requested || !api.ready || !api.status?.enabled) return;
    setRequested(true);
    void load();
  }, [api.ready, api.status, requested, load]);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t("loginRequerido")}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t("apagado")}</p>;

  const done = (text: string) => {
    setPanel(null);
    setNotice(text);
    void load();
  };

  return (
    <div className="flex flex-col gap-5 p-4 pb-24 md:p-8 md:pb-8" data-testid="toys-familias">
      <ToysHeader
        active="familias"
        title={t("familias.titulo")}
        subtitle={t("familias.sub")}
        actions={
          <Button
            data-testid="toys-family-add"
            variant="cta"
            className="h-11 px-5"
            onClick={() => setPanel({ family: null })}
          >
            <Plus aria-hidden="true" />
            {t("familias.anadirFamilia")}
          </Button>
        }
      />
      {notice && (
        <p data-testid="toys-fam-notice" role="status" className="text-sm text-success">
          {notice}
        </p>
      )}
      {!families ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <FamilyList families={families} slots={slots} onEdit={(family) => setPanel({ family })} />
      )}
      {panel && (
        <FamilyPanel
          key={panel.family?.code ?? "new"}
          family={panel.family}
          onClose={() => setPanel(null)}
          onDone={done}
        />
      )}
    </div>
  );
}

function FamilyPager({
  page,
  pages,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const t = useTranslations("admin.toys");
  return (
    <nav
      aria-label={t("familias.paginacion")}
      className="flex flex-wrap items-center justify-between gap-3"
      data-testid="toys-fam-pager"
    >
      <p className="text-sm text-muted-foreground" data-testid="toys-fam-range" aria-live="polite">
        {t("familias.rango", { from, to, total })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-11"
          data-testid="toys-fam-prev"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          {t("familias.anterior")}
        </Button>
        <span className="min-w-24 text-center text-sm font-medium" data-testid="toys-fam-page">
          {t("familias.paginaN", { page: page + 1, pages })}
        </span>
        <Button
          variant="outline"
          className="h-11"
          data-testid="toys-fam-next"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          {t("familias.siguiente")}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

function FamilyList({ families, slots, onEdit }: { families: Family[]; slots: Slot[]; onEdit: (f: Family) => void }) {
  const t = useTranslations("admin.toys");
  const locale = useLocale();
  const [status, setStatus] = useState<FamilyStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const counts = countByStatus(families);
  const shown = familyPage(filterFamilies(families, status, query), page);
  const rows = shown.rows;
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" });
  const slotText = (id: string | null) => {
    const s = slots.find((x) => x.id === id);
    if (!s) return t("familias.sinTurno");
    const time = s.start_time ? ` · ${s.start_time}` : "";
    return `${fmt.format(new Date(`${s.date}T12:00:00`))}${time}`;
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            data-testid="toys-fam-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t("familias.buscarCodigo")}
            aria-label={t("familias.buscarCodigo")}
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("familias.filtrar")}>
          {(["all", ...FAMILY_STATUSES] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={status === key}
              data-testid={`toys-fam-filter-${key}`}
              onClick={() => {
                setStatus(key);
                setPage(0);
              }}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                status === key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
              )}
            >
              {key === "all"
                ? t("familias.todas", { n: families.length })
                : t(`familias.estadoN.${key}`, { n: counts[key] })}
            </button>
          ))}
        </div>
      </div>
      {families.length === 0 ? (
        <p data-testid="toys-fam-empty" className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          {t("familias.vacio")}
        </p>
      ) : rows.length === 0 ? (
        <p
          data-testid="toys-fam-no-results"
          className="rounded-xl border bg-card p-8 text-center text-muted-foreground"
        >
          {t("familias.sinResultados")}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-xl border bg-card shadow-xs" data-testid="toys-fam-list">
            {rows.map((f) => (
              <li
                key={f.code}
                data-testid={`toys-fam-row-${f.code}`}
                data-status={f.status}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
              >
                <span className="inline-flex min-w-28 items-center gap-2 font-mono text-base font-semibold uppercase">
                  {f.code}
                  {isDemoHouseholdCode(f.code) && <DemoDataBadge />}
                </span>
                <span
                  className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[f.status])}
                  data-testid={`toys-fam-status-${f.code}`}
                >
                  {t(`familias.estado.${f.status}`)}
                </span>
                <span className="text-sm text-muted-foreground">{t("familias.cupo", { n: f.toy_quota })}</span>
                <span className="text-sm text-muted-foreground">{slotText(f.slot_id)}</span>
                {f.problem_note && (
                  <span className="inline-flex items-center gap-1 text-sm text-[#8a6420]" title={f.problem_note}>
                    <AlertTriangle className="size-4" aria-hidden="true" />
                    {t("familias.incidencia")}
                  </span>
                )}
                <span className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11"
                  data-testid={`toys-fam-edit-${f.code}`}
                  onClick={() => onEdit(f)}
                >
                  <Pencil aria-hidden="true" />
                  {t("editar")}
                </Button>
              </li>
            ))}
          </ul>
          {shown.pages > 1 && <FamilyPager {...shown} onPage={setPage} />}
        </>
      )}
    </section>
  );
}

function PanelShell({
  testid,
  eyebrow,
  title,
  onClose,
  footer,
  children,
}: {
  testid: string;
  eyebrow: string;
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin.toys");
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        data-testid={testid}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button.absolute]:hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <SheetDescription className="text-xs">{eyebrow}</SheetDescription>
            <SheetTitle className="font-heading text-xl font-bold">{title}</SheetTitle>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={t("cerrar")}
            data-testid={`${testid}-close`}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">{children}</div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}

function DeleteStrip({
  testid,
  question,
  onCancel,
  onConfirm,
}: {
  testid: string;
  question: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("admin.toys");
  return (
    <div
      data-testid={`${testid}-dialog`}
      role="alertdialog"
      aria-label={question}
      className="flex flex-col gap-3 border-t border-destructive/30 bg-destructive/5 px-5 py-4"
    >
      <p className="font-semibold">{question}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-11" data-testid={`${testid}-cancel`} onClick={onCancel}>
          {t("cancelar")}
        </Button>
        <Button variant="destructive" className="h-11" data-testid={`${testid}-confirm`} onClick={onConfirm}>
          {t("inv.borrarSi")}
        </Button>
      </div>
    </div>
  );
}

function Footer({
  testid,
  canDelete,
  onDelete,
  onCancel,
  onSave,
  saveLabel,
}: {
  testid: string;
  canDelete: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  const t = useTranslations("admin.toys");
  return (
    <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3">
      {canDelete && (
        <Button
          variant="ghost"
          data-testid={`${testid}-delete`}
          className="h-11 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
          {t("eliminar")}
        </Button>
      )}
      <span className="flex-1" />
      <Button variant="outline" className="h-11" data-testid={`${testid}-cancel`} onClick={onCancel}>
        {t("cancelar")}
      </Button>
      <Button className="h-11" data-testid={`${testid}-save`} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}

function FamilyPanel({
  family,
  onClose,
  onDone,
}: {
  family: Family | null;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const t = useTranslations("admin.toys");
  const api = useToys();
  const [code, setCode] = useState(family?.code ?? "");
  const [quota, setQuota] = useState(String(family?.toy_quota ?? 1));
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  const save = async () => {
    const n = Number(quota);
    const r = family ? await api.updateHousehold(family.code, n) : await api.addHousehold(n, code.trim() || undefined);
    if (!r.success) return setError(r.code === "household_exists" ? t("familias.error.existe") : r.error);
    onDone(
      family
        ? t("familias.guardada", { code: family.code.toUpperCase() })
        : t("familias.creada", { code: String(r.data.code).toUpperCase() }),
    );
  };
  const remove = async () => {
    if (!family) return;
    const r = await api.deleteHousehold(family.code);
    if (!r.success) return setError(r.error);
    onDone(t("familias.borrada", { code: family.code.toUpperCase() }));
  };

  return (
    <PanelShell
      testid="toys-family-panel"
      eyebrow={family ? t("familias.editarFamilia") : t("familias.nuevaFamilia")}
      title={family ? family.code.toUpperCase() : t("familias.anadirFamilia")}
      onClose={onClose}
      footer={
        <>
          {confirm && (
            <DeleteStrip
              testid="toys-family-delete"
              question={t("familias.borrarFamilia")}
              onCancel={() => setConfirm(false)}
              onConfirm={remove}
            />
          )}
          <Footer
            testid="toys-family"
            canDelete={!!family}
            onDelete={() => setConfirm(true)}
            onCancel={onClose}
            onSave={save}
            saveLabel={family ? t("guardarCambios") : t("anadir")}
          />
        </>
      }
    >
      {!family && (
        <Field id="fam-code" label={t("familias.codigo")} hint={t("familias.codigoAyuda")}>
          <Input
            id="fam-code"
            data-testid="toys-family-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-11 font-mono"
            autoComplete="off"
          />
        </Field>
      )}
      <Field id="fam-quota" label={t("familias.cupoLabel")} hint={t("familias.cupoAyuda")}>
        <Input
          id="fam-quota"
          type="number"
          min={0}
          max={50}
          data-testid="toys-family-quota"
          value={quota}
          onChange={(e) => setQuota(e.target.value)}
          className="h-11"
        />
      </Field>
      {error && (
        <p
          role="alert"
          data-testid="toys-family-error"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </PanelShell>
  );
}
