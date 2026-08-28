'use client';
import { useState, Suspense } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

function RestablecerPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const t = useTranslations('restablecerPassword');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('contrasenaMinima'));
      return;
    }
    if (password !== confirm) {
      setError(t('contrasenaNoCoinciden'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('errorRestablecer'));
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('enlaceInvalido')}</CardTitle>
            <CardDescription>
              {t('enlaceInvalidoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/recuperar-password')}>
              {t('solicitarNuevoEnlace')}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('contrasenaRestablecida')}</CardTitle>
            <CardDescription>{t('contrasenaRestablecidaDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')}>{t('irIniciarSesion')}</Button>
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
          <CardDescription>{t('descripcion')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">{t('nuevaContrasena')}</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('placeholderMinimo')}
                  required
                  minLength={6}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 flex h-full cursor-pointer items-center px-2.5 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('confirmarContrasena')}</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t('placeholderRepite')}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('restableciendo') : t('restablecerContrasena')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <Suspense>
      <RestablecerPasswordContent />
    </Suspense>
  );
}
