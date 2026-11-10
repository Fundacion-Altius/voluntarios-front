'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Slot = { startUtc: string; endUtc: string };

function RescheduleInner() {
  const params = useSearchParams();
  const route = useParams<{ tipo: string }>();
  const token = params.get('token') ?? '';
  const tipo = route.tipo;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/booking/slots?tipo=${encodeURIComponent(tipo)}`);
        if (!res.ok) throw new Error('slots');
        const data = (await res.json()) as { slots: Slot[] };
        if (!cancelled) {
          setSlots(data.slots ?? []);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('No se pudieron cargar huecos.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tipo]);

  async function onPick(slot: Slot) {
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
        setStatus('error');
        setMessage('No se pudo reprogramar (enlace inválido o hueco ocupado).');
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
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">Reprogramar reserva</h1>
      <p className="mt-2 text-sm text-neutral-600">Elige un nuevo hueco. El enlace actual se invalidará.</p>
      {status === 'loading' || status === 'saving' ? (
        <p className="mt-6 text-sm">{status === 'saving' ? 'Guardando…' : 'Cargando huecos…'}</p>
      ) : null}
      {status === 'ready' ? (
        <ul className="mt-6 space-y-2">
          {slots.length === 0 ? (
            <li className="text-sm text-neutral-600">No hay huecos disponibles.</li>
          ) : (
            slots.slice(0, 24).map((slot) => (
              <li key={slot.startUtc}>
                <button
                  type="button"
                  className="w-full rounded border border-neutral-300 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => onPick(slot)}
                  disabled={!token}
                >
                  {new Date(slot.startUtc).toLocaleString()}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      {(status === 'ok' || status === 'error') && (
        <p className="mt-6 text-sm" role="status">
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
