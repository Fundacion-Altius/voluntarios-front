'use client';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { getCSRFTokenFromCookie } from '@/app/utils';
import { parseTenantSlugFromHost, isAuthHost } from '@/lib/tenantHost';
import { createSignedState, getAuthHost } from '@/lib/authState';

export function LoginForm({ hasGoogle, hasAzure }: { hasGoogle: boolean; hasAzure: boolean }) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const tenantParam = searchParams.get('tenant');
  const stateParam = searchParams.get('state');
  const router = useRouter();
  const { update: updateSession } = useSession();
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [credError, setCredError] = useState('');
  
  // Detect current host and tenant
  const [currentHost, setCurrentHost] = useState('');
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [isOnAuthHost, setIsOnAuthHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      setCurrentHost(host);
      const { slug } = parseTenantSlugFromHost(host);
      setTenantSlug(slug);
      setIsOnAuthHost(isAuthHost(host));
    }
  }, []);

  // If we received tenant and state params (from auth host redirect),
  // use them for OAuth flows
  const effectiveTenant = tenantParam || tenantSlug || null;
  const returnTo = searchParams.get('return_to') || '/admin/dashboard';

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
      user_id: data.user.user_id || data.user.id,
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

          {(hasGoogle || hasAzure) && (
          <div className="flex w-full items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t('o')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          )}

          {hasGoogle && (
            <Button
              onClick={() => {
                setGoogleLoading(true);
                
                // If we have tenant context and we're not on auth host,
                // redirect to auth host with tenant context
                if (effectiveTenant && !isOnAuthHost) {
                  try {
                    const authHost = getAuthHost();
                    const state = createSignedState(effectiveTenant, returnTo);
                    // Redirect to auth host login with tenant context
                    window.location.href = `${authHost}/login?tenant=${encodeURIComponent(effectiveTenant)}&return_to=${encodeURIComponent('/portal')}&state=${encodeURIComponent(state)}`;
                  } catch (error) {
                    console.error('Failed to create signed state:', error);
                    // Fallback to direct signIn
                    signIn('google', { callbackUrl: '/portal' });
                  }
                } else {
                  // On auth host or no tenant context - use normal OAuth flow
                  signIn('google', { callbackUrl: '/portal' });
                }
              }}
              className="w-full"
              variant="outline"
              disabled={googleLoading || loading || msLoading}
            >
              {googleLoading ? (
                <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Google
            </Button>
          )}

          {hasAzure && (
            <Button
              onClick={() => {
                setMsLoading(true);
                
                // If we have tenant context and we're not on auth host,
                // redirect to auth host with tenant context
                if (effectiveTenant && !isOnAuthHost) {
                  try {
                    const authHost = getAuthHost();
                    const state = createSignedState(effectiveTenant, returnTo);
                    // Redirect to auth host login with tenant context
                    window.location.href = `${authHost}/login?tenant=${encodeURIComponent(effectiveTenant)}&return_to=${encodeURIComponent(returnTo)}&state=${encodeURIComponent(state)}`;
                  } catch (error) {
                    console.error('Failed to create signed state:', error);
                    // Fallback to direct signIn
                    signIn('azure-ad', { callbackUrl: returnTo });
                  }
                } else {
                  // On auth host or no tenant context - use normal OAuth flow
                  signIn('azure-ad', { callbackUrl: returnTo });
                }
              }}
              className="w-full"
              variant="outline"
              disabled={msLoading || loading || googleLoading}
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
