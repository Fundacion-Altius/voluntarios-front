'use client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';

export default function OldMensajesDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => { router.replace(`/portal/mensajes/${id}`); }, [router, id]);
  return null;
}
