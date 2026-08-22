'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useActivities, type ActivityException, type ActivityType } from './useActivities';
import HolidaysSection from './HolidaysSection';

function formatDate(d?: string) { return d ? new Date(d).toLocaleDateString() : '-'; }

const CATEGORIES = ['general', 'logística', 'acompañamiento', 'educación', 'administración', 'otro'];

export default function ActividadesPage() {
  const t = useTranslations('admin.actividades');
  const tCommon = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { types, isLoading, error, createType, updateType, deleteType, fetchExceptions, createException, deleteException } = useActivities();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActivityType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityType | null>(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [localidad, setLocalidad] = useState('');
  const [capacity, setCapacity] = useState('15');
  const [isRecurring, setIsRecurring] = useState('true');
  const [fixedDate, setFixedDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [shifts, setShifts] = useState<string[]>(['']);

  const [exceptionsOpenFor, setExceptionsOpenFor] = useState<ActivityType | null>(null);
  const [exceptions, setExceptions] = useState<ActivityException[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [exceptionDate, setExceptionDate] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [exceptionError, setExceptionError] = useState('');

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const resetForm = () => {
    setName(''); setDescription(''); setCategory('general'); setLocalidad(''); setCapacity('15');
    setIsRecurring('true'); setFixedDate(''); setDaysOfWeek([]); setShifts(['']); setFormError('');
  };

  const openExceptions = async (act: ActivityType) => {
    setExceptionsOpenFor(act);
    setExceptionError(''); setExceptionDate(''); setExceptionReason('');
    setExceptionsLoading(true);
    try { setExceptions(await fetchExceptions(act.id)); }
    catch (err: any) { setExceptionError(err.message); }
    finally { setExceptionsLoading(false); }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionsOpenFor) return;
    setExceptionError('');
    try {
      await createException(exceptionsOpenFor.id, { date: exceptionDate, reason: exceptionReason || undefined });
      showSuccess(t('excepcionCreada'));
      setExceptionDate(''); setExceptionReason('');
      setExceptions(await fetchExceptions(exceptionsOpenFor.id));
    } catch (err: any) { setExceptionError(err.message); }
  };

  const handleDeleteException = async (id: string) => {
    if (!exceptionsOpenFor) return;
    setExceptionError('');
    try {
      await deleteException(id);
      setExceptions(await fetchExceptions(exceptionsOpenFor.id));
    } catch (err: any) { setExceptionError(err.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setSubmitting(true);
    try {
      const payload: any = {
        name, description, category, localidad: localidad || undefined,
        default_capacity: Number(capacity), is_recurring: isRecurring,
      };
      if (isRecurring === 'true') {
        payload.recurrence_config = {
          daysOfWeek, shifts: shifts.filter((s) => s.trim()).map((s) => ({ name: s, startTime: '09:00', endTime: '14:00' })),
        };
      } else {
        if (!fixedDate) { setFormError(t('fechaFijaRequerida')); setSubmitting(false); return; }
        payload.fixed_date = fixedDate;
      }
      await createType(payload);
      setCreateOpen(false);
      resetForm();
      showSuccess(t('tipoCreado'));
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setFormError(''); setSubmitting(true);
    try {
      await updateType(editTarget.id, {
        name, description, category, localidad: localidad || undefined,
        default_capacity: Number(capacity),
        ...(editTarget.is_recurring !== 'true' ? { fixed_date: fixedDate || null } : {}),
      });
      setEditTarget(null); resetForm();       showSuccess(t('actividadActualizada'));
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteType(deleteTarget.id); setDeleteTarget(null); showSuccess(t('actividadEliminada')); }
    catch (err: any) { setFormError(err.message); }
  };

  const openEdit = (t: ActivityType) => {
    setEditTarget(t); setName(t.name); setDescription(t.description || ''); setCategory(t.category);
    setCapacity(String(t.default_capacity)); setLocalidad(t.localidad || '');
    setFixedDate(t.fixed_date ? new Date(t.fixed_date).toISOString().slice(0, 10) : '');
  };

  const DIA_LABELS = [t('domingo'), t('lunes'), t('martes'), t('miercoles'), t('jueves'), t('viernes'), t('sabado')];
  const toggleDay = (d: number) => setDaysOfWeek((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" />
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button>{t('nuevaActividad')}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t('nuevoTipoActividad')}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}
              <div><label className="mb-1 block text-sm font-medium">{tCommon('nombre')}</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><label className="mb-1 block text-sm font-medium">{t('descripcion')}</label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div><label className="mb-1 block text-sm font-medium">{t('localidad')}</label><Input value={localidad} onChange={(e) => setLocalidad(e.target.value)} /></div>
              <div><label className="mb-1 block text-sm font-medium">{t('categoria')}</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="mb-1 block text-sm font-medium">{t('capacidad')}</label><Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min={1} required /></div>
                <div><label className="mb-1 block text-sm font-medium">{t('recurrente')}</label>
                  <Select value={isRecurring} onValueChange={setIsRecurring}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="true">{t('si')}</SelectItem><SelectItem value="false">{t('no')}</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              {isRecurring === 'false' && (
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('fechaFija')}</label>
                  <Input type="date" value={fixedDate} onChange={(e) => setFixedDate(e.target.value)} required />
                </div>
              )}
              {isRecurring === 'true' && (
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('diasSemana')}</label>
                  <div className="flex flex-wrap gap-1">
                    {DIA_LABELS.map((label, idx) => (
                      <button key={idx} type="button" onClick={() => toggleDay(idx)}
                        className={`rounded-md border px-2 py-1 text-xs ${daysOfWeek.includes(idx) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              )}
              <div><label className="mb-1 block text-sm font-medium">{t('turnos')}</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm" rows={3}
                  placeholder="Mañana&#10;Tarde"
                  value={shifts.join('\n')}
                  onChange={(e) => setShifts(e.target.value.split('\n').filter((s) => s.trim()))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? t('creando') : tCommon('crear')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMsg && <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">{successMsg}</div>}
      {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-32 w-full rounded-lg" />))
          : types.length === 0
            ? <p className="col-span-full text-center text-muted-foreground py-8">{t('noHayActividades')}</p>
            : types.map((act) => (
                <Card key={act.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium">{act.name}</CardTitle>
                      <Badge variant={act.is_recurring === 'true' ? 'default' : 'secondary'}>{act.is_recurring === 'true' ? t('recurrente') : t('puntual')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">{act.description || act.category}</p>
                    <p className="text-xs text-muted-foreground">{t('categoria')}: {act.category} | {t('capacidad')}: {act.default_capacity}</p>
                    {act.localidad && <p className="text-xs text-muted-foreground">{t('localidad')}: {act.localidad}</p>}
                    {act.is_recurring !== 'true' && act.fixed_date && (
                      <p className="text-xs text-muted-foreground">{t('fechaFija')}: {formatDate(act.fixed_date)}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openExceptions(act)}>{t('excepciones')}</Button>
                      <Dialog open={editTarget?.id === act.id} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
                        <DialogTrigger asChild><Button size="sm" variant="outline" onClick={() => openEdit(act)}>{tCommon('editar')}</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{t('editarActividad')}</DialogTitle></DialogHeader>
                           <form onSubmit={handleEdit} className="space-y-4">
                             <div><label className="mb-1 block text-sm font-medium">{tCommon('nombre')}</label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                              <div><label className="mb-1 block text-sm font-medium">{t('descripcion')}</label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                              <div><label className="mb-1 block text-sm font-medium">{t('localidad')}</label><Input value={localidad} onChange={(e) => setLocalidad(e.target.value)} /></div>
                             <div><label className="mb-1 block text-sm font-medium">{t('categoria')}</label>
                              <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div><label className="mb-1 block text-sm font-medium">{t('capacidad')}</label><Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min={1} /></div>
                            {editTarget?.is_recurring !== 'true' && (
                              <div>
                                <label className="mb-1 block text-sm font-medium">{t('fechaFija')}</label>
                                <Input type="date" value={fixedDate} onChange={(e) => setFixedDate(e.target.value)} />
                              </div>
                            )}
                             <Button type="submit" disabled={submitting}>{submitting ? t('guardarando') : tCommon('guardar')}</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog open={deleteTarget?.id === act.id} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
                        <AlertDialogTrigger asChild><Button size="sm" variant="destructive" onClick={() => setDeleteTarget(act)}>{tCommon('eliminar')}</Button></AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader><AlertDialogTitle>{t('eliminarActividad')}</AlertDialogTitle>
                             <AlertDialogDescription>{t('eliminarActividadDesc')} {act.name} {t('yTodasSusSesiones')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancelar')}</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDelete}>{tCommon('eliminar')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
      </div>

      <Dialog open={exceptionsOpenFor !== null} onOpenChange={(o) => { if (!o) setExceptionsOpenFor(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('excepcionesTitulo', { nombre: exceptionsOpenFor?.name ?? '' })}</DialogTitle></DialogHeader>
          {exceptionError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{exceptionError}</div>}
          <p className="text-xs text-muted-foreground">{t('excepcionesDesc')}</p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {exceptionsLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : exceptions.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">{t('noExcepciones')}</p>
            ) : (
              exceptions.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <span>
                    {new Date(ex.date).toLocaleDateString()}
                    {ex.reason ? ` — ${ex.reason}` : ''}
                  </span>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteException(ex.id)}>{tCommon('eliminar')}</Button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddException} className="space-y-2 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={exceptionDate} onChange={(e) => setExceptionDate(e.target.value)} required />
              <Input value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} placeholder={t('motivo')} />
            </div>
            <Button type="submit" className="w-full">{t('anadirExcepcion')}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <HolidaysSection />
    </div>
  );
}
