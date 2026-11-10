'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Hand, Keyboard, PackageCheck, Search } from 'lucide-react';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { cn } from '@/lib/utils';
import { startQrScanLoop } from '../../scanner/qrCamera';
import { ToysHeader } from '../_components/ToysHeader';
import { useToys } from '../useToys';
import { scanErrorKey, slotTime, toyCount, type Handover, type ScanError } from './handover';

interface Summary {
  delivered: number;
  to_collect: number;
}

/** Modo reparto: scan (look-up only) → check the toys → press "Entregado". */
export default function ToysHandoverPage() {
  const t = useTranslations('admin.toys');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Handover | null>(null);
  const [error, setError] = useState<ScanError | null>(null);
  const [busy, setBusy] = useState(false);
  const [justDelivered, setJustDelivered] = useState(false);
  const [requested, setRequested] = useState(false);

  const loadSummary = useCallback(async () => {
    const r = await api.handoverSummary();
    if (r.success) setSummary(r.data as Summary);
  }, [api]);

  useEffect(() => {
    if (requested || !api.ready || !api.status?.enabled) return;
    setRequested(true);
    void loadSummary();
  }, [api.ready, api.status, requested, loadSummary]);

  const lookup = async (value: string) => {
    const token = value.trim();
    setJustDelivered(false);
    if (!token) {
      setFound(null);
      setError('empty');
      return;
    }
    setBusy(true);
    const r = await api.scanLookup(token);
    setBusy(false);
    if (!r.success) {
      setFound(null);
      setError(scanErrorKey(r));
      return;
    }
    setError(null);
    setFound(r.data as Handover);
  };

  const confirm = async () => {
    if (!found) return;
    setBusy(true);
    const r = await api.scanConfirm(found.token);
    setBusy(false);
    if (!r.success) {
      setError(scanErrorKey(r));
      return;
    }
    setFound(r.data as Handover);
    setJustDelivered(true);
    void loadSummary();
  };

  const next = () => {
    setFound(null);
    setError(null);
    setCode('');
    setJustDelivered(false);
  };

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t('loginRequerido')}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t('apagado')}</p>;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4 pb-24 md:p-8 md:pb-8" data-testid="toys-reparto">
      <ToysHeader active="entrega" title={t('reparto.titulo')} subtitle={t('reparto.sub')} />

      <section aria-label={t('reparto.contadores')} className="grid grid-cols-2 gap-3 rounded-2xl bg-[#2a2c7a] p-3 text-white dark:bg-[#23254a]">
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-sm text-[#d9daf2]">{t('reparto.entregados')}</p>
          <p data-testid="toys-reparto-delivered" className="font-heading text-3xl font-bold text-[#9be3b4]">{summary?.delivered ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-sm text-[#d9daf2]">{t('reparto.porRecoger')}</p>
          <p data-testid="toys-reparto-pending" className="font-heading text-3xl font-bold text-cta">{summary?.to_collect ?? '—'}</p>
        </div>
      </section>

      <Scanner onCode={(value) => { setCode(value); void lookup(value); }} />

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code);
        }}
      >
        <Label htmlFor="toys-reparto-code" className="flex items-center gap-2 font-semibold">
          <Keyboard className="size-4" aria-hidden="true" />
          {t('reparto.aMano')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="toys-reparto-code"
            data-testid="toys-reparto-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('reparto.placeholder')}
            autoComplete="off"
            className="h-12 text-base"
          />
          <Button type="submit" data-testid="toys-reparto-lookup" className="h-12 px-5" disabled={busy}>
            <Search aria-hidden="true" />
            {t('reparto.buscar')}
          </Button>
        </div>
      </form>

      {error && (
        <p data-testid="toys-reparto-error" data-error={error} role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>{t(`reparto.error.${error}`)}</span>
        </p>
      )}

      {found && (
        <HandoverCard
          found={found}
          busy={busy}
          justDelivered={justDelivered}
          onConfirm={confirm}
          onNext={next}
          onNoted={(h) => setFound(h)}
        />
      )}
    </div>
  );
}

function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const t = useTranslations('admin.toys');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [on, setOn] = useState(false);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setOn(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !navigator.mediaDevices?.getUserMedia) {
      setFailed(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      setFailed(false);
      setOn(true);
      stopRef.current = startQrScanLoop({
        video,
        canvas,
        isActive: () => true,
        onCode: (value) => {
          stop();
          onCode(value);
        },
      });
    } catch {
      setFailed(true);
      stop();
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-[#14142b] text-white" data-testid="toys-reparto-scanner">
      <div className={cn('relative aspect-[4/3] w-full', !on && 'hidden')}>
        <video ref={videoRef} data-testid="toys-reparto-video" muted playsInline className="size-full object-cover" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-xl border-4 border-cta/80" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex flex-col items-center gap-3 p-5 text-center">
        {!on && <Camera className="size-10 text-cta" aria-hidden="true" />}
        <p className="text-sm text-[#d9daf2]">{on ? t('reparto.apunta') : t('reparto.camaraTexto')}</p>
        {failed && <p className="text-sm text-cta" data-testid="toys-reparto-camera-error">{t('reparto.camaraError')}</p>}
        <Button
          type="button"
          variant={on ? 'outline' : 'cta'}
          data-testid="toys-reparto-camera"
          className={cn('h-12 w-full px-6 text-base sm:w-auto', on && 'bg-transparent text-white')}
          onClick={on ? stop : start}
        >
          {on ? <CameraOff aria-hidden="true" /> : <Camera aria-hidden="true" />}
          {on ? t('reparto.cerrarCamara') : t('reparto.abrirCamara')}
        </Button>
      </div>
    </section>
  );
}

function HandoverCard({
  found,
  busy,
  justDelivered,
  onConfirm,
  onNext,
  onNoted,
}: {
  found: Handover;
  busy: boolean;
  justDelivered: boolean;
  onConfirm: () => void;
  onNext: () => void;
  onNoted: (h: Handover) => void;
}) {
  const t = useTranslations('admin.toys');
  const locale = useLocale();
  const delivered = found.status === 'delivered';
  const when = found.delivered_at
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(found.delivered_at))
    : '';
  const slotDate = found.slot
    ? new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${found.slot.date}T12:00:00`))
    : '';

  return (
    <section
      data-testid="toys-reparto-result"
      data-status={found.status}
      aria-live="polite"
      className={cn('flex flex-col gap-4 rounded-2xl border-2 bg-card p-5 shadow-xs', delivered ? 'border-success' : 'border-primary')}
    >
      <div>
        <p className={cn('flex items-center gap-2 text-sm font-semibold', delivered ? 'text-success' : 'text-primary')}>
          {delivered ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <PackageCheck className="size-5" aria-hidden="true" />}
          {justDelivered ? t('reparto.recienEntregado') : delivered ? t('reparto.yaEntregado', { when }) : t('reparto.codigoOk')}
        </p>
        <h2 className="font-heading text-2xl font-bold" data-testid="toys-reparto-family">
          {t('reparto.familia', { code: found.household.toUpperCase() })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('reparto.resumen', { n: toyCount(found.lines) })}
          {found.slot ? ` · ${slotDate} ${slotTime(found.slot)}` : ` · ${t('reparto.sinTurno')}`}
        </p>
      </div>

      <ul className="divide-y" data-testid="toys-reparto-lines">
        {found.lines.map((line) => (
          <li key={line.toy_id} data-testid={`toys-reparto-line-${line.toy_id}`} className="flex items-center gap-3 py-3">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {line.cover ? <img src={`${getApiBaseUrl()}${line.cover}`} alt="" className="size-full object-cover" /> : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{line.title || t('reparto.juguete')}</span>
              <span className="block text-sm text-muted-foreground">
                {line.ageBand ? t(`bandas.${line.ageBand}`) : ''}
                {!line.in_stock && !delivered && <span className="ml-2 font-semibold text-destructive">{t('reparto.sinStock')}</span>}
              </span>
            </span>
            <span className="font-heading text-lg font-bold tabular-nums">×{line.qty}</span>
          </li>
        ))}
      </ul>

      {!delivered && (
        <Button
          data-testid="toys-reparto-confirm"
          className="h-16 bg-success text-lg font-bold text-success-foreground hover:bg-success/90"
          disabled={busy || !found.can_deliver}
          onClick={onConfirm}
        >
          <Hand aria-hidden="true" className="size-6" />
          {t('reparto.entregado')}
        </Button>
      )}
      {!delivered && !found.can_deliver && <p className="text-sm text-destructive" data-testid="toys-reparto-cannot">{t('reparto.noSePuede')}</p>}
      {delivered && (
        <Button data-testid="toys-reparto-next" variant="cta" className="h-14 text-base font-semibold" onClick={onNext}>
          {t('reparto.siguiente')}
        </Button>
      )}

      <ProblemNote found={found} onSaved={onNoted} />
    </section>
  );
}

function ProblemNote({ found, onSaved }: { found: Handover; onSaved: (h: Handover) => void }) {
  const t = useTranslations('admin.toys');
  const api = useToys();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(found.problem_note ?? '');
  const [error, setError] = useState('');

  const save = async () => {
    const r = await api.scanProblem(found.token, note);
    if (!r.success) return setError(r.error);
    setError('');
    setOpen(false);
    onSaved(r.data as Handover);
  };

  if (!open) {
    return (
      <div className="flex flex-col items-center gap-2">
        {found.problem_note && (
          <p data-testid="toys-reparto-problem-saved" className="w-full rounded-lg bg-cta/15 p-3 text-sm">
            <span className="font-semibold">{t('reparto.problemaGuardado')}</span> {found.problem_note}
          </p>
        )}
        <Button variant="link" data-testid="toys-reparto-problem-open" onClick={() => setOpen(true)}>
          {found.problem_note ? t('reparto.problemaEditar') : t('reparto.problema')}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <Label htmlFor="toys-reparto-note" className="font-semibold">{t('reparto.problemaLabel')}</Label>
      <Textarea
        id="toys-reparto-note"
        data-testid="toys-reparto-problem-note"
        value={note}
        maxLength={500}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('reparto.problemaPlaceholder')}
      />
      <p className="text-xs text-muted-foreground">{t('reparto.problemaAyuda')}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" data-testid="toys-reparto-problem-cancel" onClick={() => setOpen(false)}>{t('cancelar')}</Button>
        <Button data-testid="toys-reparto-problem-save" onClick={save}>{t('reparto.problemaGuardar')}</Button>
      </div>
    </div>
  );
}
