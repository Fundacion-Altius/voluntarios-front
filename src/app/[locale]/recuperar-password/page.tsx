'use client';
import { useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

function RecuperarPasswordContent() {
  const t = useTranslations('recuperarPassword');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('introduceCorreo'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errorEnviar'));
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('revisaCorreo')}</CardTitle>
            <CardDescription>
              {t('revisaCorreoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t('enlaceValido')}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t('titulo')}</CardTitle>
          <CardDescription>
            {t('descripcion')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">{t('correoElectronico')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('placeholderCorreo')}
                  required
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('enviando') : t('enviarEnlace')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RecuperarPasswordPage() {
  return (
    <Suspense>
      <RecuperarPasswordContent />
    </Suspense>
  );
}
