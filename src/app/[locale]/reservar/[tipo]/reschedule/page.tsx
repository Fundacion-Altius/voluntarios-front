'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  bookingCalendarLocale,
  bookingErrorMessage,
  dateFromDayKey,
  dayKeyFromLocalDate,
  dayKeyInTz,
  formatDayHeading,
  formatSlotTime,
  groupSlotsByDay,
  type BookingSlot,
} from '../../bookingUi';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function RescheduleInner() {
  const params = useSearchParams();
  const route = useParams<{ tipo: string }>();
  const token = params.get('token') ?? '';
  const tipo = route.tipo;
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const visitorTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
    [],
  );
  const slotsByDay = useMemo(() => groupSlotsByDay(slots, visitorTz), [slots, visitorTz]);
  const availableDays = useMemo(() => new Set(slotsByDay.keys()), [slotsByDay]);
  const daySlots = selectedDay ? (slotsByDay.get(selectedDay) ?? []) : [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/booking/slots?tipo=${encodeURIComponent(tipo)}`);
        if (!res.ok) throw new Error('slots');
        const data = (await res.json()) as { slots: BookingSlot[] };
        if (cancelled) return;
        const next = data.slots ?? [];
        setSlots(next);
        const byDay = groupSlotsByDay(next, visitorTz);
        setSelectedDay(Array.from(byDay.keys()).sort()[0] ?? null);
        setStatus('ready');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage(bookingErrorMessage('slots_failed', 'No se pudieron cargar huecos.'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tipo, visitorTz]);

  function onSelectDay(date: Date | undefined) {
    if (!date) return;
    const key = dayKeyFromLocalDate(date);
    if (!availableDays.has(key)) return;
    setSelectedDay(key);
  }

  async function onPick(slot: BookingSlot) {
    setStatus('saving');
    try {
      const res = await fetch(`${API}/api/booking/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          startUtc: slot.startUtc,
          endUtc: slot.endUtc,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(
          bookingErrorMessage(
            typeof data.error === 'string' ? data.error : undefined,
            'No se pudo reprogramar (enlace inválido o hueco ocupado).',
          ),
        );
        return;
      }
      setStatus('ok');
      setMessage('Reserva reprogramada. Revisa tu correo.');
    } catch {
      setStatus('error');
      setMessage('Error de red.');
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16" data-testid="booking-reschedule-page">
      <h1 className="text-2xl font-semibold">Reprogramar reserva</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Elige un día y un nuevo hueco. El enlace actual se invalidará.
      </p>
      {status === 'loading' || status === 'saving' ? (
        <p className="mt-6 text-sm">{status === 'saving' ? 'Guardando…' : 'Cargando huecos…'}</p>
      ) : null}
      {status === 'ready' ? (
        <div className="mt-6 flex flex-col gap-4">
          {slots.length === 0 ? (
            <p className="text-sm text-neutral-600">No hay huecos disponibles.</p>
          ) : (
            <>
              <div data-testid="booking-reschedule-calendar" className="w-fit rounded border">
                <Calendar
                  mode="single"
                  locale={bookingCalendarLocale}
                  selected={selectedDay ? dateFromDayKey(selectedDay) : undefined}
                  onSelect={onSelectDay}
                  disabled={(date) => !availableDays.has(dayKeyFromLocalDate(date))}
                  defaultMonth={selectedDay ? dateFromDayKey(selectedDay) : undefined}
                />
              </div>
              {selectedDay ? (
                <div>
                  <p className="mb-2 text-sm font-medium capitalize">
                    Huecos del {formatDayHeading(selectedDay, visitorTz)}
                  </p>
                  <ul className="space-y-2">
                    {daySlots.slice(0, 24).map((slot) => (
                      <li key={slot.startUtc}>
                        <button
                          type="button"
                          data-testid="booking-reschedule-slot"
                          data-start-utc={slot.startUtc}
                          data-day-key={dayKeyInTz(slot.startUtc, visitorTz)}
                          className="w-full rounded border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                          onClick={() => onPick(slot)}
                          disabled={!token}
                        >
                          {formatSlotTime(slot.startUtc, visitorTz)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      {(status === 'ok' || status === 'error') && (
        <p
          className="mt-6 text-sm"
          role="status"
          data-testid="booking-reschedule-message"
          data-status={status}
        >
          {message}
        </p>
      )}
    </main>
  );
}

export default function ReschedulePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Cargando…</p>}>
      <RescheduleInner />
    </Suspense>
  );
}
