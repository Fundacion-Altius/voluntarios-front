'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { getCSRFToken } from '@/app/lib/csrf';
import { startQrScanLoop } from './qrCamera';

export default function ScannerPage() {
  const t = useTranslations('admin.scanner');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const scanningRef = useRef(false);
  const handleCheckInRef = useRef<(code: string) => Promise<void>>(async () => undefined);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<{ action?: string } | null>(null);
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState('');

  const fetchHeaders = useCallback((): Record<string, string> => {
    const token = (session as { authToken?: string } | null)?.authToken;
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    const csrf = getCSRFToken();
    if (csrf) h['X-CSRF-Token'] = csrf;
    return h;
  }, [session]);

  const handleCheckIn = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/activities/scan-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...fetchHeaders() },
        credentials: 'include',
        body: JSON.stringify({ qrData: trimmed, bookingId: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        return;
      }
      setResult(data);
      setLastScanned(trimmed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }, [fetchHeaders]);

  handleCheckInRef.current = handleCheckIn;

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    setScanning(false);
  }, []);

  const startCamera = async () => {
    setError('');
    setResult(null);
    setScanning(true);
    scanningRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error(t('errorCamara'));
      }
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      stopLoopRef.current = startQrScanLoop({
        video,
        canvas,
        isActive: () => scanningRef.current,
        onCode: (code) => {
          void handleCheckInRef.current(code);
        },
      });
    } catch {
      scanningRef.current = false;
      setError(t('errorCamara'));
      setScanning(false);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  if (authLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /></div>;
  if (!isAuthenticated) return null;

  const resultTitle =
    result?.action === 'check-out' ? t('checkoutRealizado') : t('checkinRealizado');

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t('titulo')}</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('camara')}</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={scanning ? 'mb-2 w-full rounded-md border bg-black' : 'hidden'}
            />
            <canvas ref={canvasRef} className="hidden" />
            {!scanning ? (
              <Button onClick={() => void startCamera()}>{t('iniciarCamara')}</Button>
            ) : (
              <div>
                <Button variant="outline" onClick={stopCamera}>{t('detenerCamara')}</Button>
                <p className="mt-2 text-xs text-muted-foreground">{t('instruccion')}</p>
                {lastScanned ? (
                  <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{lastScanned}</p>
                ) : null}
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
            <Button onClick={() => void handleCheckIn(manualCode)} disabled={!manualCode.trim()}>
              {t('verificar')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {result && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-sm">{resultTitle}</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
