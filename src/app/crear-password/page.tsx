'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function CrearPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

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
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/candidates/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al establecer contraseña');
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Image alt="logo" src="/logo.png" width={400} height={100} className="logo mb-8" priority />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>¡Contraseña establecida!</CardTitle>
            <CardDescription>Ya puedes iniciar sesión con tu email y contraseña.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/login')}>Ir a iniciar sesión</Button>
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
          <CardTitle>Crear contraseña</CardTitle>
          <CardDescription>Establece una contraseña para acceder a tu cuenta de voluntario.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
              <label className="mb-1 block text-sm font-medium">Confirmar contraseña</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Estableciendo...' : 'Establecer contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function CrearPasswordPage() {
  return (
    <Suspense>
      <CrearPasswordContent />
    </Suspense>
  );
}
