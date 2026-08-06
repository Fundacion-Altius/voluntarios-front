'use client';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function OldMensajesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/portal/mensajes'); }, [router]);
  return null;
}
