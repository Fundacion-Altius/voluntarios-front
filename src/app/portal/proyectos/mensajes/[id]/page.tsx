'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OldMensajesDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => { router.replace(`/portal/mensajes/${id}`); }, [router, id]);
  return null;
}
