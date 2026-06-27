'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get CSRF token from cookies
function getCSRFTokenFromCookie(): string | null {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token') {
        return value;
      }
    }
  }
  return null;
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [credError, setCredError] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCredError('');
    try {
      // First, get CSRF token from cookie
      const csrfToken = getCSRFTokenFromCookie();
      
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        setCredError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

        const nextAuthResult = await signIn('credentials', {
          email: data.user.email,
          name: data.user.display_name || data.user.name,
          role: data.user.role,
          authToken: data.authToken,
          redirect: false,
        });

        if (nextAuthResult?.error) {
          setCredError(nextAuthResult.error);
          setLoading(false);
          return;
        }

        router.push('/dashboard');
    } catch {
      setCredError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Image alt="logo" src="/logo.png" width={400} height={100} className="logo" priority />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Accede con tu cuenta de Fundación Altius</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {(error || credError) && (
            <div className="w-full rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              {credError || (error === 'AccessDenied'
                ? 'Solo se permiten correos @fundacionaltius.org'
                : 'Error de autenticación. Inténtalo de nuevo.')}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="w-full space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="flex w-full items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">O</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            onClick={() => {
              setMsLoading(true);
              signIn('azure-ad', { callbackUrl: '/dashboard' });
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
