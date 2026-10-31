import { Suspense } from 'react';
import BookingClient from './BookingClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ tipo: string; locale: string }>;
};

export default async function ReservarPage({ params }: PageProps) {
  const { tipo } = await params;
  return (
    <main>
      <Suspense fallback={<p className="p-8 text-sm">Cargando…</p>}>
        <BookingClient tipo={tipo} />
      </Suspense>
    </main>
  );
}
