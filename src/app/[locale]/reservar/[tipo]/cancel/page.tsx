'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function CancelInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onCancel() {
    setStatus('loading');
    try {
      const res = await fetch(`${API}/api/booking/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        setStatus('error');
        setMessage('No se pudo cancelar (enlace inválido o ya usado).');
        return;
      }
      setStatus('ok');
      setMessage('Reserva cancelada.');
    } catch {
      setStatus('error');
      setMessage('Error de red.');
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">Cancelar reserva</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Confirma si quieres liberar este hueco. El enlace solo funciona una vez.
      </p>
      {status === 'idle' || status === 'loading' ? (
        <button
          type="button"
          className="mt-6 rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={!token || status === 'loading'}
          onClick={onCancel}
        >
          {status === 'loading' ? 'Cancelando…' : 'Confirmar cancelación'}
        </button>
      ) : (
        <p className="mt-6 text-sm" role="status">
          {message}
        </p>
      )}
    </main>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Cargando…</p>}>
      <CancelInner />
    </Suspense>
  );
}
