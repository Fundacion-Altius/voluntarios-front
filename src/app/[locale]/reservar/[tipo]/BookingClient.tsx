'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/apiUrl';

type Slot = { startUtc: string; endUtc: string };

type Props = {
  tipo: string;
};

export default function BookingClient({ tipo }: Props) {
  const searchParams = useSearchParams();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [hangoutLink, setHangoutLink] = useState('');

  const visitorTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid',
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/api/booking/slots?tipo=${encodeURIComponent(tipo)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error('slots_failed');
        const data = (await res.json()) as { slots: Slot[] };
        if (!cancelled) setSlots(data.slots ?? []);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('No se pudieron cargar los huecos disponibles.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tipo]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      setStatus('error');
      setMessage('Elige un hueco.');
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const body: Record<string, unknown> = {
        tipo,
        startUtc: selected.startUtc,
        endUtc: selected.endUtc,
        visitorTz,
        visitorEmail: email,
        visitorName: name,
        visitorOrg: org || undefined,
        notes: notes || undefined,
        consent,
      };
      const ref = searchParams.get('ref');
      if (ref) body.ref = ref;
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const value = searchParams.get(key);
        if (value) body[key] = value;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(typeof data.error === 'string' ? data.error : 'No se pudo completar la reserva.');
        return;
      }
      setStatus('ok');
      setHangoutLink(data.booking?.hangoutLink ?? '');
      setMessage('Reserva confirmada. Revisa tu correo (ICS adjunto).');
    } catch {
      setStatus('error');
      setMessage('Error de red al reservar.');
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Reservar — {tipo}</h1>
      <p className="mb-8 text-sm opacity-80">Elige un hueco y confirma tu reunión con ShiftCitizen.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Huecos disponibles</legend>
          {slots.length === 0 ? (
            <p className="text-sm opacity-70">No hay huecos en la ventana actual.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-auto rounded border p-2">
              {slots.map((slot) => {
                const label = new Date(slot.startUtc).toLocaleString(undefined, {
                  timeZone: visitorTz,
                });
                const checked = selected?.startUtc === slot.startUtc;
                return (
                  <li key={slot.startUtc}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="slot"
                        checked={checked}
                        onChange={() => setSelected(slot)}
                      />
                      {label}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            required
            className="rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            required
            type="email"
            className="rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Organización
          <input className="rounded border px-3 py-2" value={org} onChange={(e) => setOrg(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Notas
          <textarea
            className="rounded border px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />
          Consiento el tratamiento de mis datos para gestionar esta reunión.
        </label>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === 'loading' ? 'Reservando…' : 'Confirmar reserva'}
        </button>
      </form>

      {message ? (
        <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-700' : 'text-green-800'}`}>
          {message}
          {hangoutLink ? (
            <>
              {' '}
              <a className="underline" href={hangoutLink}>
                Enlace de videollamada
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
