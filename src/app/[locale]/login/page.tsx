'use client';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { getCSRFTokenFromCookie } from '@/app/utils';

function LoginContent() {
  const azureAdEnabled = process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === 'true';
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const router = useRouter();
  const { update: updateSession } = useSession();
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [credError, setCredError] = useState('');

  const handleStatusError = (data: any, t: any, setCredError: (msg: string) => void): string | null => {
    if (data.user?.status === 'candidate') {
      setCredError(t('statusCandidate'));
      return 'candidate';
    }
    if (data.user?.status === 'inactive') {
      setCredError(t('statusInactive'));
      return 'inactive';
    }
    if (data.user?.status === 'on-reserve') {
      setCredError(t('statusOnReserve'));
      return 'on-reserve';
    }
    return null;
  };

  const handleLoginResponse = async (res: Response, data: any): Promise<boolean> => {
    const statusError = handleStatusError(data, t, setCredError);
    if (statusError) { setLoading(false); return true; }

    if (!res.ok) {
      setCredError(data.error || t('errorCredenciales'));
      setLoading(false);
      return true;
    }

    if (data.user?.status === 'active' && !data.user?.has_password) {
      const token = data.setupToken || '';
      router.push(`/crear-password?token=${token}`);
      setLoading(false);
      return true;
    }

    const nextAuthResult = await signIn('credentials', {
      email: data.user.email,
      name: data.user.display_name || data.user.name,
      role: data.user.role,
      user_type: data.user.user_type,
      authToken: data.authToken,
      redirect: false,
    });

    if (nextAuthResult?.error) {
      setCredError(nextAuthResult.error);
      setLoading(false);
      return true;
    }

    await updateSession();

    const target = data.user?.role === 'general' ? '/portal' : '/admin/dashboard';
    router.push(target);
    setLoading(false);
    return false;
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCredError('');
    try {
      const csrfToken = getCSRFTokenFromCookie();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      await handleLoginResponse(res, data);
    } catch {
      setCredError(t('errorConexion'));
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Image alt="logo" src="/logo.png" width={400} height={100} className="logo" priority />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t('titulo')}</CardTitle>
          <CardDescription>{t('subtitulo')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {(error || credError) && (
            <div className="w-full rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              {credError || (error === 'AccessDenied'
                ? t('errorAccessDenied')
                : t('errorAutenticacion'))}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="w-full space-y-3">
            <Input
              type="email"
              placeholder={t('placeholderEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('placeholderContrasena')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-9"
                required
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
            <div className="text-right">
              <Link href="/recuperar-password" className="text-xs text-muted-foreground hover:text-primary">
                {t('olvidasteContrasena')}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('iniciando') : t('iniciarSesion')}
            </Button>
          </form>

          <div className="flex w-full items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t('o')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {azureAdEnabled && (
            <Button
              onClick={() => {
                setMsLoading(true);
                signIn('azure-ad', { callbackUrl: '/admin/dashboard' });
              }}
              className="w-full"
              variant="outline"
              disabled={msLoading}
            >
              {msLoading ? (
                <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" className="size-4">
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#7fba00" d="M12 1h10v10H12z" />
                  <path fill="#00a4ef" d="M1 12h10v10H1z" />
                  <path fill="#ffb900" d="M12 12h10v10H12z" />
                </svg>
              )}
              Sign in with Microsoft
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
