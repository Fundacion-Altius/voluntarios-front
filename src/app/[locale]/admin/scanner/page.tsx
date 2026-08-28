'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function ScannerPage() {
  const t = useTranslations('admin.scanner');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchHeaders = (): Record<string, string> => {
    const token = (session as any)?.authToken;
    const h: Record<string, string> = {}; if (token) h['Authorization'] = `Bearer ${token}`; return h;
  };

  const handleCheckIn = async (code: string) => {
    setError(''); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/activities/scan-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...fetchHeaders() },
        credentials: 'include',
        body: JSON.stringify({ qrData: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        return;
      }
      setResult(data);
    } catch (err: any) { setError(err.message); }
  };

  const startCamera = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setError(t('errorCamara')); setScanning(false); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  if (authLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t('titulo')}</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('camara')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!scanning ? (
              <Button onClick={startCamera}>{t('iniciarCamara')}</Button>
            ) : (
              <div>
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-md border" />
                <Button variant="outline" className="mt-2" onClick={stopCamera}>{t('detenerCamara')}</Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('instruccion')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('codigoManual')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t('pegarCodigo')}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button onClick={() => handleCheckIn(manualCode)} disabled={!manualCode.trim()}>
              {t('verificar')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {result && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-sm">{t('checkinRealizado')}</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
