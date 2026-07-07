'use client';

import { useState } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSurveys, type Survey } from './useSurveys';

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export default function EncuestasPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    surveys,
    isLoading,
    error,
    report,
    reportLoading,
    createSurvey,
    deleteSurvey,
    fetchReport,
  } = useSurveys();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newNombre, setNewNombre] = useState('');
  const [newDepartamento, setNewDepartamento] = useState('');
  const [newMinutos, setNewMinutos] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await createSurvey({
        nombre: newNombre,
        departamento: newDepartamento,
        minutos: Number(newMinutos),
      });
      setNewNombre('');
      setNewDepartamento('');
      setNewMinutos('');
      setCreateOpen(false);
      showSuccess('Encuesta creada correctamente');
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSurvey(deleteTarget.id);
      setDeleteTarget(null);
      showSuccess('Encuesta eliminada correctamente');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleOpenReport = () => {
    setShowReport(true);
    fetchReport();
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const isAdmin = true;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Encuestas</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenReport}>
            Ver Resultados
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Nueva Encuesta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Encuesta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {formError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">Nombre</label>
                  <Input
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Nombre de la encuesta"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Departamento</label>
                  <Input
                    value={newDepartamento}
                    onChange={(e) => setNewDepartamento(e.target.value)}
                    placeholder="Departamento"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Duración (minutos)</label>
                  <Input
                    type="number"
                    value={newMinutos}
                    onChange={(e) => setNewMinutos(e.target.value)}
                    placeholder="10"
                    required
                    min={1}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear Encuesta'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showReport ? (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Button variant="ghost" onClick={() => setShowReport(false)}>
              ← Volver a lista
            </Button>
            <h3 className="text-lg font-semibold">Resultados de Encuestas</h3>
          </div>

          {reportLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {report.data.map((q) => (
                  <Card key={q.questionId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {q.questionText}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{q.averageRating}</span>
                        <span className="text-sm text-muted-foreground">/ 5</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {q.totalAnswers} respuestas
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de respuestas: {report.total}
              </p>
              <p className="text-xs text-muted-foreground">
                Generado: {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No hay datos de reporte disponibles.</p>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Departamento</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Duración</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Creado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : surveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No hay encuestas disponibles
                  </td>
                </tr>
              ) : (
                surveys.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{s.nombre}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.departamento}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{s.minutos} min</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AlertDialog
                        open={deleteTarget?.id === s.id}
                        onOpenChange={(open) => {
                          if (!open) setDeleteTarget(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(s)}
                          >
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar encuesta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará la encuesta{' '}
                              <strong>{deleteTarget?.nombre}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
