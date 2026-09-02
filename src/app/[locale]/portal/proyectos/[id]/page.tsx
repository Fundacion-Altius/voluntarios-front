'use client';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Plus, UserCheck, Search,
} from 'lucide-react';

import { apiClient, apiUrl } from '@/lib/apiClient';
import { ProjectKanban } from '@/components/community/ProjectKanban';

function memberLabel(member: { display_name?: string | null; email?: string | null; user_id: string }): string {
  return member.display_name || member.email || member.user_id.slice(0, 8);
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('portal.proyectos');
  const tCommon = useTranslations('common');

  const STATUS_LABELS: Record<string, string> = {
    planning: t('planificacion'), active: t('activo'), on_hold: t('enPausa'), completed: t('completado'),
  };
  const TASK_STATUS_LABELS: Record<string, string> = {
    todo: t('porHacer'), in_progress: t('enProgreso'), review: t('revision'), done: t('completado'),
  };

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [memberError, setMemberError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient<any>(apiUrl(`/api/community/projects/${id}`)),
      apiClient<{ data: any[] }>(apiUrl(`/api/community/projects/${id}/members`)),
      apiClient<{ data: any[] }>(apiUrl(`/api/community/projects/${id}/tasks`)),
    ])
      .then(([p, m, t]) => {
        setProject(p.success ? p.data : null);
        setMembers(m.success ? m.data.data || [] : []);
        setTasks(t.success ? t.data.data || [] : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    const result = await apiClient<{ id: string }>(apiUrl(`/api/community/projects/${id}/tasks`), {
      method: 'POST',
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        assignee_id: newTaskAssignee || null,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
      }),
    });
    if (result.success) {
      setTasks((prev) => [...prev, { id: result.data.id, title: newTaskTitle, status: 'todo', assignee_id: newTaskAssignee || null, due_date: newTaskDueDate || null, created_by: null }]);
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setTaskOpen(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const result = await apiClient(apiUrl(`/api/community/projects/${id}/tasks/${taskId}`), {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (result.success) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    }
  };

  const searchMembers = async (q: string) => {
    setMemberQuery(q);
    if (q.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const result = await apiClient<{ data: Array<{ id: string; name?: string; email?: string }> }>(
      apiUrl(`/api/users/search?q=${encodeURIComponent(q.trim())}`),
    );
    const existing = new Set(members.map((m: any) => m.user_id));
    setMemberResults(result.success ? (result.data.data || []).filter((u) => !existing.has(u.id)) : []);
  };

  const addMember = async (userId: string) => {
    setMemberError('');
    const result = await apiClient(apiUrl(`/api/community/projects/${id}/members`), {
      method: 'POST',
      body: JSON.stringify({ userId, role: 'member' }),
    });
    if (!result.success) {
      setMemberError(result.error);
      return;
    }
    const refreshed = await apiClient<{ data: any[] }>(apiUrl(`/api/community/projects/${id}/members`));
    if (refreshed.success) setMembers(refreshed.data.data || []);
    setMemberQuery('');
    setMemberResults([]);
    setMemberOpen(false);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full rounded-lg" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  if (!project) return <p className="text-muted-foreground">{t('proyectoNoEncontrado')}</p>;

  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isMember = members.some((m: any) => m.user_id === currentUserId);
  const isCoordinator =
    members.some((m: any) => m.user_id === currentUserId && m.role === 'coordinator')
    || project.created_by === currentUserId;
  const canEditTasks = isCoordinator || isMember || Boolean(currentUserId);

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/portal/proyectos')}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge>{STATUS_LABELS[project.status] || project.status}</Badge>
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('miembrosSeccion')} ({members.length})</CardTitle>
            {canEditTasks && (
              <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="mr-1 size-4" /> {t('anadirMiembro')}</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('anadirMiembro')}</DialogTitle>
                  </DialogHeader>
                  <div className="relative pt-2">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={memberQuery}
                      onChange={(e) => void searchMembers(e.target.value)}
                      placeholder={t('buscarVoluntario')}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-56 space-y-1 overflow-y-auto">
                    {memberResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => void addMember(u.id)}
                      >
                        {u.name || u.email}
                      </button>
                    ))}
                    {memberQuery.trim().length >= 2 && memberResults.length === 0 && (
                      <p className="px-1 text-sm text-muted-foreground">{t('sinResultados')}</p>
                    )}
                  </div>
                  {memberError && <p className="text-sm text-destructive">{memberError}</p>}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {members.map((m: any) => (
              <Badge
                key={`${m.project_id}-${m.user_id}`}
                variant={m.role === 'coordinator' ? 'default' : 'secondary'}
                className="gap-1"
              >
                {memberLabel(m)}
                {m.role === 'coordinator' && <UserCheck className="ml-1 size-3" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('tareas')}</h2>
        {canEditTasks && (
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 size-4" /> {t('nuevaTarea')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('nuevaTarea')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{tCommon('titulo')}</Label>
                  <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder={t('tituloTarea')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('asignarA')}</Label>
                  <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger><SelectValue placeholder={tCommon('sinAsignar')} /></SelectTrigger>
                    <SelectContent>
                      {members.map((m: any) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {memberLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tCommon('fechaLimite')}</Label>
                  <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                </div>
                <Button onClick={createTask} className="w-full">{t('crearTarea')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ProjectKanban
        projectId={id}
        tasks={tasks}
        members={members}
        canEdit={canEditTasks}
        labels={TASK_STATUS_LABELS}
        onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
      />
    </div>
  );
}
