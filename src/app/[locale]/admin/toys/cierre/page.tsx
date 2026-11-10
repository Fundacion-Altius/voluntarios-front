"use client";
import { Flag, Search, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth/useAuth";
import { useAdminFixedBar } from "@/components/admin/AdminChrome";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiBaseUrl } from "@/lib/apiUrl";
import { cn } from "@/lib/utils";
import { Field } from "../_components/Field";
import { ToysHeader } from "../_components/ToysHeader";
import { useToys } from "../useToys";
import { type Disposition, type Item, type Kind, leftovers, planTotals } from "./closing";

interface Summary {
  delivered: number;
  to_collect: number;
}

export default function ToysClosingPage() {
  const t = useTranslations("admin.toys");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  useAdminFixedBar("4.5rem");
  const [items, setItems] = useState<Item[] | null>(null);
  const [dispositions, setDispositions] = useState<Disposition[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [requested, setRequested] = useState(false);
  const [defaultKind, setDefaultKind] = useState<Kind>("stored");
  const [destination, setDestination] = useState("");
  const [kinds, setKinds] = useState<Record<string, Kind>>({});
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    const [i, d, s] = await Promise.all([api.listItems(), api.listDispositions(), api.handoverSummary()]);
    setItems(i.success ? (i.data as Item[]) : []);
    setDispositions(d.success ? (d.data as Disposition[]) : []);
    setSummary(s.success ? (s.data as Summary) : null);
  }, [api]);

  useEffect(() => {
    if (requested || !api.ready || !api.status?.enabled) return;
    setRequested(true);
    void load();
  }, [api.ready, api.status, requested, load]);

  const rows = useMemo(() => leftovers(items ?? [], dispositions), [items, dispositions]);
  const kindOf = (id: string): Kind => kinds[id] ?? defaultKind;
  const isIn = (id: string): boolean => include[id] ?? true;
  const allKinds = Object.fromEntries(rows.map((r) => [r.id, kindOf(r.id)]));
  const allIn = Object.fromEntries(rows.map((r) => [r.id, isIn(r.id)]));
  const plan = planTotals(rows, allIn, allKinds);
  const chosen = rows.filter((r) => allIn[r.id]);
  const visible = query.trim() ? rows.filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase())) : rows;
  const left = rows.reduce((n, r) => n + r.left, 0);
  const closed = dispositions.reduce((n, d) => n + d.quantity, 0);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t("loginRequerido")}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t("apagado")}</p>;

  const setAll = (value: boolean) => setInclude(Object.fromEntries(rows.map((r) => [r.id, value])));

  const openConfirm = () => {
    if (!destination.trim()) return setResult({ text: t("cierreGuiado.error.destino"), error: true });
    if (chosen.length === 0) return setResult({ text: t("cierreGuiado.error.nada"), error: true });
    setResult(null);
    setConfirmOpen(true);
  };

  const close = async () => {
    setConfirmOpen(false);
    let ok = 0;
    for (const r of chosen) {
      const res = await api.closeItem(r.id, r.left, kindOf(r.id), destination.trim());
      if (res.success) ok += 1;
    }
    setResult(
      ok === chosen.length
        ? { text: t("cierreGuiado.hecho", { n: ok }) }
        : { text: t("cierreGuiado.error.parcial", { ok, n: chosen.length }), error: true },
    );
    setInclude({});
    setKinds({});
    void load();
  };

  const undo = async (id: string) => {
    const r = await api.deleteDisposition(id);
    if (!r.success) return setResult({ text: r.error, error: true });
    setResult({ text: t("cierreGuiado.deshecho") });
    void load();
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8" data-testid="toys-cierre">
      <ToysHeader active="cierre" title={t("cierreGuiado.titulo")} subtitle={t("cierreGuiado.sub")} />
      {!items ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t("cierreGuiado.resumen")}>
            <Stat
              label={t("cierreGuiado.entregados")}
              value={summary?.delivered ?? "—"}
              testid="toys-close-delivered"
              tone="ok"
            />
            <Stat
              label={t("cierreGuiado.porRecoger")}
              value={summary?.to_collect ?? "—"}
              testid="toys-close-tocollect"
            />
            <Stat label={t("cierreGuiado.quedan")} value={left} testid="toys-close-left" tone="warn" />
            <Stat label={t("cierreGuiado.cerrados")} value={closed} testid="toys-close-closed" />
          </section>

          <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs">
            <h2 className="font-heading text-xl font-bold">{t("cierreGuiado.paso1", { n: left })}</h2>
            <div
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
              role="radiogroup"
              aria-label={t("cierreGuiado.paso1", { n: left })}
            >
              {(["stored", "redistributed"] as const).map((k) => (
                <label
                  key={k}
                  className={cn(
                    "flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border-2 p-4",
                    defaultKind === k ? "border-primary bg-accent" : "hover:border-primary/50",
                  )}
                >
                  <input
                    type="radio"
                    name="close-kind"
                    value={k}
                    checked={defaultKind === k}
                    onChange={() => {
                      setDefaultKind(k);
                      setKinds({});
                    }}
                    data-testid={`toys-close-default-${k}`}
                    className="mt-1 size-5 accent-[#3d3fa8]"
                  />
                  <span>
                    <span className="block font-semibold">{t(`cierreGuiado.kind.${k}`)}</span>
                    <span className="block text-sm text-muted-foreground">{t(`cierreGuiado.kindAyuda.${k}`)}</span>
                  </span>
                </label>
              ))}
            </div>
            <Field id="close-dest" label={t("cierreGuiado.destino")} hint={t("cierreGuiado.destinoAyuda")}>
              <Input
                id="close-dest"
                data-testid="toys-close-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-11"
                maxLength={500}
              />
            </Field>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-bold">{t("cierreGuiado.paso2")}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    data-testid="toys-close-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("cierreGuiado.buscar")}
                    aria-label={t("cierreGuiado.buscar")}
                    className="h-11 w-56 pl-9"
                  />
                </div>
                <Button variant="outline" className="h-11" data-testid="toys-close-all" onClick={() => setAll(true)}>
                  {t("cierreGuiado.todos")}
                </Button>
                <Button variant="outline" className="h-11" data-testid="toys-close-none" onClick={() => setAll(false)}>
                  {t("cierreGuiado.ninguno")}
                </Button>
              </div>
            </div>
            {rows.length === 0 ? (
              <p data-testid="toys-close-empty" className="py-6 text-center text-muted-foreground">
                {t("cierreGuiado.nadaQueCerrar")}
              </p>
            ) : (
              <ul className="divide-y" data-testid="toys-close-list">
                {visible.map((r) => (
                  <li
                    key={r.id}
                    data-testid={`toys-close-row-${r.id}`}
                    className="flex flex-wrap items-center gap-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={isIn(r.id)}
                      onChange={(e) => setInclude((m) => ({ ...m, [r.id]: e.target.checked }))}
                      aria-label={t("cierreGuiado.incluir", { title: r.title })}
                      data-testid={`toys-close-include-${r.id}`}
                      className="size-5 accent-[#3d3fa8]"
                    />
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {r.cover ? (
                        <img src={`${getApiBaseUrl()}${r.cover}`} alt="" className="size-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{r.title}</span>
                      {r.ageBand && <span className="text-xs text-muted-foreground">{t(`bandas.${r.ageBand}`)}</span>}
                    </span>
                    <span className="w-20 text-right text-sm tabular-nums">
                      {t("cierreGuiado.unidades", { n: r.left })}
                    </span>
                    <select
                      aria-label={t("cierreGuiado.queHacemos", { title: r.title })}
                      data-testid={`toys-close-kind-${r.id}`}
                      value={kindOf(r.id)}
                      onChange={(e) => setKinds((m) => ({ ...m, [r.id]: e.target.value as Kind }))}
                      className="h-11 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="stored">{t("cierreGuiado.kind.stored")}</option>
                      <option value="redistributed">{t("cierreGuiado.kind.redistributed")}</option>
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {dispositions.length > 0 && (
            <section
              className="flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-xs"
              data-testid="toys-close-done-list"
            >
              <h2 className="font-heading text-xl font-bold">{t("cierreGuiado.yaCerrados")}</h2>
              <ul className="divide-y">
                {dispositions.map((d) => (
                  <li
                    key={d.id}
                    data-testid={`toys-close-done-${d.id}`}
                    className="flex flex-wrap items-center gap-3 py-2 text-sm"
                  >
                    <span className="flex-1 font-medium">
                      {(items ?? []).find((i) => i.id === d.toy_id)?.title ?? t("cierreGuiado.jugueteBorrado")}
                    </span>
                    <span>{t("cierreGuiado.unidades", { n: d.quantity })}</span>
                    <span className="text-muted-foreground">
                      {t(`cierreGuiado.kind.${d.kind}`)} · {d.destination}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11"
                      data-testid={`toys-close-undo-${d.id}`}
                      onClick={() => undo(d.id)}
                    >
                      <Undo2 aria-hidden="true" />
                      {t("cierreGuiado.deshacer")}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result && (
            <p
              data-testid="toys-close-result"
              role={result.error ? "alert" : "status"}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                result.error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
              )}
            >
              {result.text}
            </p>
          )}

          <div
            className="fixed inset-x-0 z-30 border-t bg-card/95 py-3 pl-4 pr-4 shadow-sm backdrop-blur lg:left-[var(--sidebar-width)] lg:pl-8 lg:pr-8"
            style={{ bottom: "var(--admin-bottom-nav-h, 0px)" }}
            data-testid="toys-close-bar"
          >
            <div className="flex flex-wrap items-center gap-3 pr-[var(--admin-fab-h)]">
              <p className="flex-1 text-sm" data-testid="toys-close-plan">
                <span className="font-semibold">
                  {t("cierreGuiado.plan", { stored: plan.stored, redistributed: plan.redistributed })}
                </span>
              </p>
              <Button variant="cta" className="h-12 px-6 text-base" data-testid="toys-close-open" onClick={openConfirm}>
                <Flag aria-hidden="true" />
                {t("cierreGuiado.cerrar")}
              </Button>
            </div>
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent data-testid="toys-close-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("cierreGuiado.confirmarTitulo")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("cierreGuiado.confirmarTexto", {
                    n: chosen.length,
                    stored: plan.stored,
                    redistributed: plan.redistributed,
                    destination: destination.trim(),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {(summary?.to_collect ?? 0) > 0 && (
                <p data-testid="toys-close-warning" className="rounded-lg bg-cta/15 px-3 py-2 text-sm">
                  {t("cierreGuiado.avisoPendientes", { n: summary?.to_collect ?? 0 })}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="toys-close-cancel">{t("cancelar")}</AlertDialogCancel>
                <AlertDialogAction data-testid="toys-close-confirm" onClick={close}>
                  {t("cierreGuiado.cerrarSi")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  testid,
  tone,
}: {
  label: string;
  value: number | string;
  testid: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", tone === "warn" && "border-cta/60")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        data-testid={testid}
        className={cn("font-heading text-3xl font-bold tabular-nums", tone === "ok" && "text-success")}
      >
        {value}
      </p>
    </div>
  );
}
