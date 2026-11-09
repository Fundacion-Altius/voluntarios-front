'use client';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, FileUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '@/app/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { bandForYears } from '../campaign';
import { Field } from '../_components/Field';
import { ToysHeader } from '../_components/ToysHeader';
import { useToys } from '../useToys';
import type { Slot } from '../turnos/slots';
import { FAMILY_STATUSES, countByStatus, filterChildren, filterFamilies, type Child, type Family, type FamilyStatus } from './families';

type Tab = 'familias' | 'ninos';
type Panel =
  | { kind: 'family'; family: Family | null }
  | { kind: 'child'; child: Child | null }
  | { kind: 'import' };

const STATUS_STYLE: Record<FamilyStatus, string> = {
  inscrita: 'bg-muted text-foreground',
  reservado: 'bg-accent text-primary',
  recogido: 'bg-success/10 text-success',
};

export default function ToysFamiliesPage() {
  const t = useTranslations('admin.toys');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [tab, setTab] = useState<Tab>('familias');
  const [families, setFamilies] = useState<Family[] | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [notice, setNotice] = useState('');
  const [requested, setRequested] = useState(false);

  const load = useCallback(async () => {
    const [f, c, s] = await Promise.all([api.listFamilies(), api.listChildren(), api.listSlots()]);
    setFamilies(f.success ? (f.data as Family[]) : []);
    setChildren(c.success ? (c.data as Child[]) : []);
    setSlots(s.success ? (s.data as Slot[]) : []);
  }, [api]);

  useEffect(() => {
    if (requested || !api.status?.enabled) return;
    setRequested(true);
    void load();
  }, [api.status, requested, load]);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t('loginRequerido')}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t('apagado')}</p>;

  const done = (text: string) => {
    setPanel(null);
    setNotice(text);
    void load();
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-8" data-testid="toys-familias">
      <ToysHeader
        active="familias"
        title={t('familias.titulo')}
        subtitle={t('familias.sub')}
        actions={
          tab === 'familias' ? (
            <Button data-testid="toys-family-add" variant="cta" className="h-11 px-5" onClick={() => setPanel({ kind: 'family', family: null })}>
              <Plus aria-hidden="true" />
              {t('familias.anadirFamilia')}
            </Button>
          ) : (
            <>
              <Button data-testid="toys-child-import" variant="outline" className="h-11" onClick={() => setPanel({ kind: 'import' })}>
                <FileUp aria-hidden="true" />
                {t('familias.importar')}
              </Button>
              <Button data-testid="toys-child-add" variant="cta" className="h-11 px-5" onClick={() => setPanel({ kind: 'child', child: null })}>
                <Plus aria-hidden="true" />
                {t('familias.anadirNino')}
              </Button>
            </>
          )
        }
      />
      <div role="tablist" aria-label={t('familias.vistas')} className="inline-flex w-full max-w-sm rounded-xl bg-muted p-1">
        {(['familias', 'ninos'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            data-testid={`toys-fam-tab-${key}`}
            onClick={() => setTab(key)}
            className={cn('min-h-11 flex-1 rounded-lg text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', tab === key ? 'bg-card shadow-xs' : 'text-muted-foreground')}
          >
            {t(`familias.tab.${key}`, { n: key === 'familias' ? (families?.length ?? 0) : (children?.length ?? 0) })}
          </button>
        ))}
      </div>
      {notice && <p data-testid="toys-fam-notice" role="status" className="text-sm text-success">{notice}</p>}
      {!families || !children ? (
        <Skeleton className="h-64 w-full" />
      ) : tab === 'familias' ? (
        <FamilyList families={families} slots={slots} onEdit={(family) => setPanel({ kind: 'family', family })} />
      ) : (
        <ChildList list={children} onEdit={(child) => setPanel({ kind: 'child', child })} />
      )}
      {panel?.kind === 'family' && <FamilyPanel key={panel.family?.code ?? 'new'} family={panel.family} onClose={() => setPanel(null)} onDone={done} />}
      {panel?.kind === 'child' && <ChildPanel key={panel.child?.id ?? 'new'} child={panel.child} onClose={() => setPanel(null)} onDone={done} />}
      {panel?.kind === 'import' && <ImportPanel onClose={() => setPanel(null)} onDone={done} />}
    </div>
  );
}

function FamilyList({ families, slots, onEdit }: { families: Family[]; slots: Slot[]; onEdit: (f: Family) => void }) {
  const t = useTranslations('admin.toys');
  const locale = useLocale();
  const [status, setStatus] = useState<FamilyStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const counts = countByStatus(families);
  const rows = filterFamilies(families, status, query);
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const slotText = (id: string | null) => {
    const s = slots.find((x) => x.id === id);
    if (!s) return t('familias.sinTurno');
    const time = s.start_time ? ` · ${s.start_time}` : '';
    return `${fmt.format(new Date(`${s.date}T12:00:00`))}${time}`;
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input data-testid="toys-fam-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('familias.buscarCodigo')} aria-label={t('familias.buscarCodigo')} className="h-11 pl-9" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('familias.filtrar')}>
          {(['all', ...FAMILY_STATUSES] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={status === key}
              data-testid={`toys-fam-filter-${key}`}
              onClick={() => setStatus(key)}
              className={cn('min-h-11 rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50', status === key ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary')}
            >
              {key === 'all' ? t('familias.todas', { n: families.length }) : t(`familias.estadoN.${key}`, { n: counts[key] })}
            </button>
          ))}
        </div>
      </div>
      {families.length === 0 ? (
        <p data-testid="toys-fam-empty" className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t('familias.vacio')}</p>
      ) : rows.length === 0 ? (
        <p data-testid="toys-fam-no-results" className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t('familias.sinResultados')}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-xs" data-testid="toys-fam-list">
          {rows.map((f) => (
            <li key={f.code} data-testid={`toys-fam-row-${f.code}`} data-status={f.status} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="min-w-28 font-mono text-base font-semibold uppercase">{f.code}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[f.status])} data-testid={`toys-fam-status-${f.code}`}>
                {t(`familias.estado.${f.status}`)}
              </span>
              <span className="text-sm text-muted-foreground">{t('familias.cupo', { n: f.toy_quota })}</span>
              <span className="text-sm text-muted-foreground">{slotText(f.slot_id)}</span>
              {f.problem_note && (
                <span className="inline-flex items-center gap-1 text-sm text-[#8a6420]" title={f.problem_note}>
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  {t('familias.incidencia')}
                </span>
              )}
              <span className="flex-1" />
              <Button variant="ghost" size="sm" className="h-11" data-testid={`toys-fam-edit-${f.code}`} onClick={() => onEdit(f)}>
                <Pencil aria-hidden="true" />
                {t('editar')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ChildList({ list, onEdit }: { list: Child[]; onEdit: (c: Child) => void }) {
  const t = useTranslations('admin.toys');
  const [query, setQuery] = useState('');
  const rows = filterChildren(list, query);
  return (
    <section className="flex flex-col gap-3">
      <div className="relative md:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input data-testid="toys-child-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('familias.buscarNino')} aria-label={t('familias.buscarNino')} className="h-11 pl-9" />
      </div>
      <p className="text-xs text-muted-foreground">{t('familias.privacidad')}</p>
      {rows.length === 0 ? (
        <p data-testid="toys-child-empty" className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{list.length === 0 ? t('familias.vacioNinos') : t('familias.sinResultados')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" data-testid="toys-child-list">
          {rows.map((c) => {
            const band = bandForYears(c.age);
            return (
              <li key={c.id} data-testid={`toys-child-row-${c.id}`} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2 shadow-xs">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t('familias.anos', { n: c.age })}{band ? ` · ${t(`bandas.${band}`)}` : ''}
                  </span>
                </span>
                <Button variant="ghost" size="icon" className="size-11" aria-label={t('familias.editarNino', { label: c.label })} data-testid={`toys-child-edit-${c.id}`} onClick={() => onEdit(c)}>
                  <Pencil aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PanelShell({
  testid,
  eyebrow,
  title,
  onClose,
  footer,
  children,
}: {
  testid: string;
  eyebrow: string;
  title: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations('admin.toys');
  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" data-testid={testid} className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button.absolute]:hidden">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <SheetDescription className="text-xs">{eyebrow}</SheetDescription>
            <SheetTitle className="font-heading text-xl font-bold">{title}</SheetTitle>
          </div>
          <Button variant="outline" size="icon" className="size-11" aria-label={t('cerrar')} data-testid={`${testid}-close`} onClick={onClose}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">{children}</div>
        {footer}
      </SheetContent>
    </Sheet>
  );
}

function DeleteStrip({ testid, question, onCancel, onConfirm }: { testid: string; question: string; onCancel: () => void; onConfirm: () => void }) {
  const t = useTranslations('admin.toys');
  return (
    <div data-testid={`${testid}-dialog`} role="alertdialog" aria-label={question} className="flex flex-col gap-3 border-t border-destructive/30 bg-destructive/5 px-5 py-4">
      <p className="font-semibold">{question}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-11" data-testid={`${testid}-cancel`} onClick={onCancel}>{t('cancelar')}</Button>
        <Button variant="destructive" className="h-11" data-testid={`${testid}-confirm`} onClick={onConfirm}>{t('inv.borrarSi')}</Button>
      </div>
    </div>
  );
}

function Footer({ testid, canDelete, onDelete, onCancel, onSave, saveLabel }: { testid: string; canDelete: boolean; onDelete: () => void; onCancel: () => void; onSave: () => void; saveLabel: string }) {
  const t = useTranslations('admin.toys');
  return (
    <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3">
      {canDelete && (
        <Button variant="ghost" data-testid={`${testid}-delete`} className="h-11 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          {t('eliminar')}
        </Button>
      )}
      <span className="flex-1" />
      <Button variant="outline" className="h-11" data-testid={`${testid}-cancel`} onClick={onCancel}>{t('cancelar')}</Button>
      <Button className="h-11" data-testid={`${testid}-save`} onClick={onSave}>{saveLabel}</Button>
    </div>
  );
}

function FamilyPanel({ family, onClose, onDone }: { family: Family | null; onClose: () => void; onDone: (text: string) => void }) {
  const t = useTranslations('admin.toys');
  const api = useToys();
  const [code, setCode] = useState(family?.code ?? '');
  const [quota, setQuota] = useState(String(family?.toy_quota ?? 1));
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const save = async () => {
    const n = Number(quota);
    const r = family ? await api.updateHousehold(family.code, n) : await api.addHousehold(n, code.trim() || undefined);
    if (!r.success) return setError(r.code === 'household_exists' ? t('familias.error.existe') : r.error);
    onDone(family ? t('familias.guardada', { code: family.code.toUpperCase() }) : t('familias.creada', { code: String(r.data.code).toUpperCase() }));
  };
  const remove = async () => {
    if (!family) return;
    const r = await api.deleteHousehold(family.code);
    if (!r.success) return setError(r.error);
    onDone(t('familias.borrada', { code: family.code.toUpperCase() }));
  };

  return (
    <PanelShell
      testid="toys-family-panel"
      eyebrow={family ? t('familias.editarFamilia') : t('familias.nuevaFamilia')}
      title={family ? family.code.toUpperCase() : t('familias.anadirFamilia')}
      onClose={onClose}
      footer={
        <>
          {confirm && <DeleteStrip testid="toys-family-delete" question={t('familias.borrarFamilia')} onCancel={() => setConfirm(false)} onConfirm={remove} />}
          <Footer testid="toys-family" canDelete={!!family} onDelete={() => setConfirm(true)} onCancel={onClose} onSave={save} saveLabel={family ? t('guardarCambios') : t('anadir')} />
        </>
      }
    >
      {!family && (
        <Field id="fam-code" label={t('familias.codigo')} hint={t('familias.codigoAyuda')}>
          <Input id="fam-code" data-testid="toys-family-code" value={code} onChange={(e) => setCode(e.target.value)} className="h-11 font-mono" autoComplete="off" />
        </Field>
      )}
      <Field id="fam-quota" label={t('familias.cupoLabel')} hint={t('familias.cupoAyuda')}>
        <Input id="fam-quota" type="number" min={0} max={50} data-testid="toys-family-quota" value={quota} onChange={(e) => setQuota(e.target.value)} className="h-11" />
      </Field>
      {error && <p role="alert" data-testid="toys-family-error" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    </PanelShell>
  );
}

function ChildPanel({ child, onClose, onDone }: { child: Child | null; onClose: () => void; onDone: (text: string) => void }) {
  const t = useTranslations('admin.toys');
  const api = useToys();
  const [label, setLabel] = useState(child?.label ?? '');
  const [age, setAge] = useState(child ? String(child.age) : '');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const save = async () => {
    const n = Number(age);
    if (!label.trim() || age === '' || !Number.isInteger(n) || n < 0) return setError(t('familias.error.nino'));
    const r = child ? await api.updateChild(child.id, { label: label.trim(), age: n }) : await api.addChild(label.trim(), n);
    if (!r.success) return setError(r.error);
    onDone(child ? t('familias.ninoGuardado', { label: label.trim() }) : t('familias.ninoCreado', { label: label.trim() }));
  };
  const remove = async () => {
    if (!child) return;
    const r = await api.deleteChild(child.id);
    if (!r.success) return setError(r.error);
    onDone(t('familias.ninoBorrado', { label: child.label }));
  };

  return (
    <PanelShell
      testid="toys-child-panel"
      eyebrow={child ? t('familias.editarNinoTitulo') : t('familias.nuevoNino')}
      title={child ? child.label : t('familias.anadirNino')}
      onClose={onClose}
      footer={
        <>
          {confirm && <DeleteStrip testid="toys-child-delete" question={t('familias.borrarNino')} onCancel={() => setConfirm(false)} onConfirm={remove} />}
          <Footer testid="toys-child" canDelete={!!child} onDelete={() => setConfirm(true)} onCancel={onClose} onSave={save} saveLabel={child ? t('guardarCambios') : t('anadir')} />
        </>
      }
    >
      <Field id="child-label" label={t('familias.etiqueta')} hint={t('familias.etiquetaAyuda')}>
        <Input id="child-label" data-testid="toys-child-label" value={label} onChange={(e) => setLabel(e.target.value)} className="h-11" autoComplete="off" />
      </Field>
      <Field id="child-age" label={t('familias.edad')}>
        <Input id="child-age" type="number" min={0} max={17} data-testid="toys-child-age" value={age} onChange={(e) => setAge(e.target.value)} className="h-11" />
      </Field>
      {error && <p role="alert" data-testid="toys-child-error" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    </PanelShell>
  );
}

function ImportPanel({ onClose, onDone }: { onClose: () => void; onDone: (text: string) => void }) {
  const t = useTranslations('admin.toys');
  const api = useToys();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ rows: { label: string; age: number }[]; skipped: number } | null>(null);
  const [error, setError] = useState('');

  const pick = async (f: File | undefined) => {
    setPreview(null);
    setError('');
    if (!f) return;
    setFile(f);
    const r = await api.previewChildren(f);
    if (!r.success) return setError(t('familias.error.archivo', { error: r.error }));
    setPreview({ rows: r.data.rows ?? [], skipped: Number(r.data.skipped ?? 0) });
  };
  const confirm = async () => {
    if (!file) return;
    const r = await api.uploadChildren(file);
    if (!r.success) return setError(t('familias.error.archivo', { error: r.error }));
    onDone(t('familias.importados', { n: Number(r.data.created ?? 0), skipped: Number(r.data.skipped ?? 0) }));
  };

  return (
    <PanelShell
      testid="toys-import-panel"
      eyebrow={t('familias.importarEyebrow')}
      title={t('familias.importar')}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">
          <Button variant="outline" className="h-11" data-testid="toys-import-cancel" onClick={onClose}>{t('cancelar')}</Button>
          <Button className="h-11" data-testid="toys-import-confirm" disabled={!preview || preview.rows.length === 0} onClick={confirm}>
            {t('familias.importarN', { n: preview?.rows.length ?? 0 })}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">{t('familias.importarAyuda')}</p>
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-accent/40 p-4 text-center text-sm font-medium text-primary hover:border-primary">
        <FileUp className="size-6" aria-hidden="true" />
        {file ? file.name : t('familias.elegirArchivo')}
        <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" data-testid="toys-import-file" onChange={(e) => void pick(e.target.files?.[0])} />
      </label>
      {error && <p role="alert" data-testid="toys-import-error" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {preview && (
        <div data-testid="toys-import-preview" className="flex flex-col gap-2">
          <p className="font-semibold">{t('familias.vistaPrevia', { n: preview.rows.length, skipped: preview.skipped })}</p>
          <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border text-sm">
            {preview.rows.slice(0, 50).map((row, i) => (
              <li key={`${row.label}-${i}`} className="flex justify-between px-3 py-1.5">
                <span>{row.label}</span>
                <span className="text-muted-foreground">{t('familias.anos', { n: row.age })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelShell>
  );
}
