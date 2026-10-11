'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startQrScanLoop } from '../scanner/qrCamera';
import { useToys } from './useToys';
import { Link } from '@/i18n/navigation';

function Section({ title, testid, children }: { title: string; testid: string; children: React.ReactNode }) {
  return (
    <Card data-testid={testid}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export default function ToysAdminPage() {
  const t = useTranslations('admin.toys');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [out, setOut] = useState<Record<string, string>>({});
  const say = (k: string, v: string) => setOut((o) => ({ ...o, [k]: v }));

  const [childLabel, setChildLabel] = useState('');
  const [childAge, setChildAge] = useState('5');
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [beneficiaryAge, setBeneficiaryAge] = useState('5');
  const [slotDate, setSlotDate] = useState('2026-12-20');
  const [slotLabel, setSlotLabel] = useState('mañana');
  const [scanToken, setScanToken] = useState('');
  const [closeToy, setCloseToy] = useState('');
  const [closeQty, setCloseQty] = useState('1');
  const [closeKind, setCloseKind] = useState('stored');
  const [closeDest, setCloseDest] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const runScanRef = useRef<((token?: string) => Promise<void>) | null>(null);

  const stopCamera = () => {
    scanningRef.current = false;
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  useEffect(() => () => stopCamera(), []);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t('loginRequerido')}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t('apagado')}</p>;

  const runChild = async () => {
    const r = await api.addChild(childLabel, Number(childAge));
    say('child', r.success ? `ok: ${r.data.id}` : `ERROR: ${r.error}`);
  };

  const runBeneficiaries = async () => {
    const r = await api.listBeneficiaries();
    if (!r.success) return say('child', `ERROR: ${r.error}`);
    setBeneficiaries(r.data as any[]);
    say('child', `${(r.data as any[]).length} ${t('beneficiarios')}`);
  };

  const runPick = async () => {
    if (!beneficiaryId) return say('child', 'ERROR');
    const r = await api.addChildFromMember(beneficiaryId, Number(beneficiaryAge));
    say('child', r.success ? `ok: ${r.data.id}` : `ERROR: ${r.error}`);
  };

  const runUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const r = await api.uploadChildren(file);
    say('child', r.success ? `${t('creados')}: ${r.data.created} / ${t('omitidos')}: ${r.data.skipped}` : `ERROR: ${r.error}`);
  };

  const runSlot = async () => {
    const r = await api.addSlot(slotDate, slotLabel);
    say('slot', r.success ? `ok: ${r.data.id}` : `ERROR: ${r.error}`);
  };

  const runScan = async (token?: string) => {
    const code = (token ?? scanToken).trim();
    if (!code) return;
    const r = await api.scan(code);
    say('scan', r.success ? `collected: ${r.data.decremented.length}` : `ERROR: ${r.error}`);
  };
  runScanRef.current = runScan;

  const startCamera = async () => {
    if (scanningRef.current) {
      stopCamera();
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      scanningRef.current = true;
      setScanning(true);
      stopLoopRef.current = startQrScanLoop({
        video,
        canvas,
        isActive: () => scanningRef.current,
        onCode: (code) => {
          setScanToken(code);
          void runScanRef.current?.(code);
        },
      });
    } catch {
      say('scan', `ERROR: ${t('errorCamara')}`);
    }
  };

  const runClose = async () => {
    const r = await api.closeItem(closeToy, Number(closeQty), closeKind, closeDest);
    say('close', r.success ? `ok: ${r.data.destination}` : `ERROR: ${r.error}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4" data-testid="toys-console">
      <h1 className="text-2xl font-bold">{t('titulo')}</h1>
      <div className="flex items-center gap-2">
        <Badge data-testid="toys-status">{t('activo')}</Badge>
        <Link href="/admin/toys/stock" data-testid="toys-stock-link">
          <Button variant="outline">{t('verStock')}</Button>
        </Link>
      </div>

      <Section title={t('elegibles')} testid="toys-children">
        <Row>
          <Input data-testid="toys-child-label" value={childLabel} onChange={(e) => setChildLabel(e.target.value)} placeholder={t('etiqueta')} />
          <Input data-testid="toys-child-age" value={childAge} onChange={(e) => setChildAge(e.target.value)} className="w-20" />
          <Button data-testid="toys-child-add" onClick={runChild}>{t('anadir')}</Button>
        </Row>
        <Row>
          <Button data-testid="toys-beneficiaries-load" onClick={runBeneficiaries}>{t('verBeneficiarios')}</Button>
          <Select value={beneficiaryId} onValueChange={setBeneficiaryId}>
            <SelectTrigger data-testid="toys-beneficiary" className="w-64"><SelectValue placeholder={t('beneficiario')} /></SelectTrigger>
            <SelectContent>
              {beneficiaries.map((b: any) => (
                <SelectItem key={b.member_id} value={b.member_id}>{b.name} — {b.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input data-testid="toys-beneficiary-age" value={beneficiaryAge} onChange={(e) => setBeneficiaryAge(e.target.value)} className="w-20" />
          <Button data-testid="toys-beneficiary-pick" onClick={runPick}>{t('elegir')}</Button>
        </Row>
        <Row>
          <Input data-testid="toys-upload-file" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => runUpload(e.target.files)} className="w-64" />
        </Row>
        {out.child && <p data-testid="toys-child-result">{out.child}</p>}
      </Section>

      <Section title={t('turnos')} testid="toys-slots">
        <Row>
          <Input data-testid="toys-slot-date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="w-40" />
          <Input data-testid="toys-slot-label" value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} />
          <Button data-testid="toys-slot-add" onClick={runSlot}>{t('anadir')}</Button>
        </Row>
        {out.slot && <p data-testid="toys-slot-result">{out.slot}</p>}
      </Section>

      <Section title={t('entrega')} testid="toys-scan">
        <Row>
          <Input data-testid="toys-scan-token" value={scanToken} onChange={(e) => setScanToken(e.target.value)} placeholder="QR" />
          <Button data-testid="toys-scan-run" onClick={() => runScan()}>{t('escanear')}</Button>
          <Button data-testid="toys-scan-camera" onClick={startCamera}>{scanning ? t('detener') : t('camara')}</Button>
        </Row>
        {scanning ? (
          <div className="flex flex-col gap-2">
            <video ref={videoRef} data-testid="toys-scan-video" muted playsInline className="max-h-64 w-full bg-black" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="hidden" aria-hidden="true">
            <video ref={videoRef} muted playsInline />
            <canvas ref={canvasRef} />
          </div>
        )}
        {out.scan && <p data-testid="toys-scan-result">{out.scan}</p>}
      </Section>

      <Section title={t('cierre')} testid="toys-close">
        <Row>
          <Input data-testid="toys-close-toy" value={closeToy} onChange={(e) => setCloseToy(e.target.value)} placeholder={t('itemId')} />
          <Input data-testid="toys-close-qty" value={closeQty} onChange={(e) => setCloseQty(e.target.value)} className="w-20" />
          <Select value={closeKind} onValueChange={setCloseKind}>
            <SelectTrigger data-testid="toys-close-kind" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="stored">{t('guardar')}</SelectItem>
              <SelectItem value="redistributed">{t('redistribuir')}</SelectItem>
            </SelectContent>
          </Select>
          <Input data-testid="toys-close-dest" value={closeDest} onChange={(e) => setCloseDest(e.target.value)} placeholder={t('destino')} />
          <Button data-testid="toys-close-run" onClick={runClose}>{t('cerrar')}</Button>
        </Row>
        {out.close && <p data-testid="toys-close-result">{out.close}</p>}
      </Section>
    </div>
  );
}
