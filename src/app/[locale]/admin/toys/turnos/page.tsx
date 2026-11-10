"use client";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/auth/useAuth";
import { DemoDataBadge } from "@/components/DemoDataBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { isDemoSlotLabel } from "@/lib/demoData";
import { cn } from "@/lib/utils";
import { Field } from "../_components/Field";
import { ToysHeader } from "../_components/ToysHeader";
import { useToys } from "../useToys";
import {
  addDays,
  type Booking,
  bookedCount,
  initialWeek,
  placesTotal,
  type Slot,
  slotFill,
  sortSlots,
  weekDays,
} from "./slots";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Editing = { slot: Slot | null; date: string };

export default function ToysSlotsPage() {
  const t = useTranslations("admin.toys");
  const locale = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [families, setFamilies] = useState<{ slot_id: string | null }[] | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [requested, setRequested] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const [s, b, f] = await Promise.all([api.listSlots(), api.listBookings(), api.listFamilies()]);
    if (!s.success) return setLoadError(s.error);
    const list = s.data as Slot[];
    setSlots(list);
    setBookings(b.success ? (b.data as Booking[]) : []);
    setFamilies(f.success ? (f.data as { slot_id: string | null }[]) : null);
    setWeek((w) => w ?? initialWeek(list, todayIso()));
  }, [api]);

  useEffect(() => {
    if (requested || !api.ready || !api.status?.enabled) return;
    setRequested(true);
    void load();
  }, [api.ready, api.status, requested, load]);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t("loginRequerido")}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t("apagado")}</p>;

  const days = week ? weekDays(week) : [];
  const fmtDay = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const fmtRange = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
  const places = placesTotal(slots ?? [], bookings);
  const withoutSlot = families ? families.filter((f) => !f.slot_id).length : null;

  return (
    <div className="flex flex-col gap-5 p-4 pb-24 md:p-8 md:pb-8" data-testid="toys-turnos">
      <ToysHeader
        active="turnos"
        title={t("agenda.titulo")}
        subtitle={t("agenda.sub")}
        actions={
          <Button
            data-testid="toys-slot-add"
            variant="cta"
            className="h-11 px-5"
            onClick={() => setEditing({ slot: null, date: days[0] ?? todayIso() })}
          >
            <Plus aria-hidden="true" />
            {t("agenda.anadir")}
          </Button>
        }
      />
      {loadError && (
        <p role="alert" className="text-destructive">
          {loadError}
        </p>
      )}
      {!slots || !week ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t("agenda.resumen")}>
            <Stat label={t("agenda.nTurnos")} value={String(slots.length)} testid="toys-slots-count" />
            <Stat
              label={t("agenda.plazas")}
              value={places.capacity > 0 ? `${places.booked} / ${places.capacity}` : "—"}
              testid="toys-slots-places"
              bar={places.capacity > 0 ? places.booked / places.capacity : undefined}
            />
            <Stat label={t("agenda.reservas")} value={String(bookings.length)} testid="toys-slots-bookings" />
            <Stat
              label={t("agenda.sinTurno")}
              value={withoutSlot === null ? "—" : String(withoutSlot)}
              testid="toys-slots-without"
              tone="warn"
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label={t("agenda.semanaAnterior")}
                data-testid="toys-week-prev"
                onClick={() => setWeek(addDays(week, -7))}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <h2 className="font-heading text-xl font-bold" data-testid="toys-week-label">
                {fmtRange.format(new Date(`${days[0]}T12:00:00`))} – {fmtRange.format(new Date(`${days[6]}T12:00:00`))}
              </h2>
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                aria-label={t("agenda.semanaSiguiente")}
                data-testid="toys-week-next"
                onClick={() => setWeek(addDays(week, 7))}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                {t("agenda.conPlazas")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground" aria-hidden="true" />
                {t("agenda.completo")}
              </span>
            </div>
          </div>

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7" data-testid="toys-week">
            {days.map((day) => {
              const daySlots = sortSlots(slots.filter((s) => s.date === day));
              return (
                <li
                  key={day}
                  data-testid={`toys-day-${day}`}
                  className={cn(
                    "flex min-h-40 flex-col gap-2 rounded-xl border p-3",
                    daySlots.length ? "bg-card shadow-xs" : "bg-muted/30",
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm capitalize text-muted-foreground">
                      {fmtDay.format(new Date(`${day}T12:00:00`))}
                    </span>
                    <span className="font-heading text-2xl font-bold">{Number(day.slice(8))}</span>
                  </div>
                  {daySlots.length === 0 && <p className="text-sm text-muted-foreground">{t("agenda.sinReparto")}</p>}
                  {daySlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      booked={bookedCount(slot.id, bookings)}
                      onOpen={() => setEditing({ slot, date: slot.date })}
                    />
                  ))}
                  <button
                    type="button"
                    data-testid={`toys-slot-add-${day}`}
                    onClick={() => setEditing({ slot: null, date: day })}
                    className="mt-auto min-h-11 rounded-lg border-2 border-dashed text-sm text-muted-foreground outline-none hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    + {t("agenda.anadirCorto")}
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {editing && (
        <SlotPanel
          key={editing.slot?.id ?? `new-${editing.date}`}
          editing={editing}
          booked={editing.slot ? bookedCount(editing.slot.id, bookings) : 0}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  testid,
  bar,
  tone,
}: {
  label: string;
  value: string;
  testid: string;
  bar?: number;
  tone?: "warn";
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", tone === "warn" && "border-cta/60 bg-cta/10")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p data-testid={testid} className="font-heading text-2xl font-bold tabular-nums">
        {value}
      </p>
      {bar !== undefined && (
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, bar * 100)}%` }} />
        </span>
      )}
    </div>
  );
}

function SlotCard({ slot, booked, onOpen }: { slot: Slot; booked: number; onOpen: () => void }) {
  const t = useTranslations("admin.toys");
  const fill = slotFill(slot, booked);
  const time = slot.start_time && slot.end_time ? `${slot.start_time} – ${slot.end_time}` : t("agenda.sinHora");
  return (
    <button
      type="button"
      data-testid={`toys-slot-${slot.id}`}
      data-fill={fill}
      onClick={onOpen}
      className={cn(
        "flex flex-col gap-1 rounded-lg border-l-4 p-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        fill === "full" ? "border-muted-foreground bg-muted" : "border-primary bg-accent hover:bg-accent/70",
      )}
    >
      <span className="font-semibold tabular-nums">{time}</span>
      {slot.label && (
        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <span className="truncate">{slot.label}</span>
          {isDemoSlotLabel(slot.label) && <DemoDataBadge className="shrink-0 normal-case" />}
        </span>
      )}
      {typeof slot.capacity === "number" ? (
        <>
          <span className="h-1.5 overflow-hidden rounded-full bg-background" aria-hidden="true">
            <span
              className={cn("block h-full rounded-full", fill === "full" ? "bg-muted-foreground" : "bg-primary")}
              style={{ width: `${Math.min(100, (booked / slot.capacity) * 100)}%` }}
            />
          </span>
          <span className="text-xs" data-testid={`toys-slot-fill-${slot.id}`}>
            {t("agenda.ocupacion", { booked, capacity: slot.capacity })}
          </span>
          <span className={cn("text-xs font-semibold", fill === "full" ? "text-muted-foreground" : "text-primary")}>
            {fill === "full" ? t("agenda.completo") : t("agenda.libres", { n: slot.capacity - booked })}
          </span>
        </>
      ) : (
        <span className="text-xs" data-testid={`toys-slot-fill-${slot.id}`}>
          {t("agenda.sinLimite", { booked })}
        </span>
      )}
    </button>
  );
}

function SlotPanel({
  editing,
  booked,
  onClose,
  onSaved,
}: {
  editing: Editing;
  booked: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("admin.toys");
  const api = useToys();
  const s = editing.slot;
  const [date, setDate] = useState(s?.date ?? editing.date);
  const [start, setStart] = useState(s?.start_time ?? "10:00");
  const [end, setEnd] = useState(s?.end_time ?? "12:00");
  const [label, setLabel] = useState(s?.label ?? "");
  const [capacity, setCapacity] = useState(s?.capacity ? String(s.capacity) : "");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    if (start && end && end <= start) return setError(t("agenda.error.horas"));
    if (capacity && (!Number.isInteger(Number(capacity)) || Number(capacity) < 1))
      return setError(t("agenda.error.plazas"));
    const fields = { start_time: start || null, end_time: end || null, capacity: capacity ? Number(capacity) : null };
    const r = s ? await api.updateSlot(s.id, { date, label, ...fields }) : await api.addSlot(date, label, fields);
    if (!r.success)
      return setError(r.code === "capacity_below_bookings" ? t("agenda.error.capacidad", { n: booked }) : r.error);
    onSaved();
  };

  const remove = async () => {
    if (!s) return;
    const r = await api.deleteSlot(s.id);
    if (!r.success) {
      setConfirmDelete(false);
      return setError(r.code === "slot_has_bookings" ? t("agenda.error.conReservas", { n: booked }) : r.error);
    }
    onSaved();
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        data-testid="toys-slot-panel"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button.absolute]:hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <SheetDescription className="text-xs">{s ? t("agenda.editar") : t("agenda.nuevo")}</SheetDescription>
            <SheetTitle className="font-heading text-xl font-bold">
              {s ? t("agenda.editarTitulo") : t("agenda.anadir")}
            </SheetTitle>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={t("cerrar")}
            data-testid="toys-slot-close"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          {s && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm" data-testid="toys-slot-booked">
              {t("agenda.reservasEnTurno", { n: booked })}
            </p>
          )}
          <Field id="slot-date" label={t("agenda.fecha")}>
            <Input
              id="slot-date"
              type="date"
              data-testid="toys-slot-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="slot-start" label={t("agenda.desde")}>
              <Input
                id="slot-start"
                type="time"
                data-testid="toys-slot-start"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field id="slot-end" label={t("agenda.hasta")}>
              <Input
                id="slot-end"
                type="time"
                data-testid="toys-slot-end"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-11"
              />
            </Field>
          </div>
          <Field id="slot-capacity" label={t("agenda.capacidad")} hint={t("agenda.capacidadAyuda")}>
            <Input
              id="slot-capacity"
              type="number"
              min={1}
              inputMode="numeric"
              data-testid="toys-slot-capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="h-11"
            />
          </Field>
          <Field id="slot-label" label={t("agenda.nombre")} hint={t("agenda.nombreAyuda")}>
            <Input
              id="slot-label"
              data-testid="toys-slot-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-11"
            />
          </Field>
          {error && (
            <p
              role="alert"
              data-testid="toys-slot-error"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
        {confirmDelete && (
          <div
            data-testid="toys-slot-delete-dialog"
            role="alertdialog"
            aria-labelledby="slot-del"
            className="flex flex-col gap-3 border-t border-destructive/30 bg-destructive/5 px-5 py-4"
          >
            <p id="slot-del" className="font-semibold">
              {t("agenda.borrarPregunta")}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="h-11"
                data-testid="toys-slot-delete-cancel"
                onClick={() => setConfirmDelete(false)}
              >
                {t("cancelar")}
              </Button>
              <Button variant="destructive" className="h-11" data-testid="toys-slot-delete-confirm" onClick={remove}>
                {t("agenda.borrarSi")}
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3">
          {s && (
            <Button
              variant="ghost"
              data-testid="toys-slot-delete"
              className="h-11 text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 aria-hidden="true" />
              {t("eliminar")}
            </Button>
          )}
          <span className="flex-1" />
          <Button variant="outline" className="h-11" data-testid="toys-slot-cancel" onClick={onClose}>
            {t("cancelar")}
          </Button>
          <Button className="h-11" data-testid="toys-slot-save" onClick={save}>
            {s ? t("guardarCambios") : t("anadir")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
