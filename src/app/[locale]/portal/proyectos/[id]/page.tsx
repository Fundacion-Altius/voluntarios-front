'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Plus, MessageSquare, UserCheck, Calendar,
} from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('portal.proyectos');
  const tCommon = useTranslations('common');
  const authRef = useRef<string | undefined>(undefined);

  const STATUS_LABELS: Record<string, string> = {
    planning: t('planificacion'), active: t('activo'), on_hold: t('enPausa'), completed: t('completado'),
  };
  const TASK_STATUS_LABELS: Record<string, string> = {
    todo: t('porHacer'), in_progress: t('enProgreso'), review: t('revision'), done: t('completado'),
  };
  const TASK_STATUS_COLORS: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
  };

  const KANBAN_COLUMNS = ['todo', 'in_progress', 'review', 'done'] as const;

  function authHeaders(authToken?: string): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) h['Authorization'] = `Bearer ${authToken}`;
    return h;
  }

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  useEffect(() => {
    if (!id) return;
    const token = authRef.current;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API_URL}/api/community/projects/${id}`, { headers, credentials: 'include' }),
      fetch(`${API_URL}/api/community/projects/${id}/members`, { headers, credentials: 'include' }),
      fetch(`${API_URL}/api/community/projects/${id}/tasks`, { headers, credentials: 'include' }),
    ])
      .then(([pRes, mRes, tRes]) =>
        Promise.all([
          pRes.ok ? pRes.json() : null,
          mRes.ok ? mRes.json() : { data: [] },
          tRes.ok ? tRes.json() : { data: [] },
        ])
      )
      .then(([p, m, t]) => {
        setProject(p);
        setMembers(m.data || []);
        setTasks(t.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    const token = authRef.current;
    const res = await fetch(`${API_URL}/api/community/projects/${id}/tasks`, {
      method: 'POST',
      headers: authHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        assignee_id: newTaskAssignee || null,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => [...prev, { id: data.id, title: newTaskTitle, status: 'todo', assignee_id: newTaskAssignee || null, due_date: newTaskDueDate || null, created_by: null }]);
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setTaskOpen(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const token = authRef.current;
    const res = await fetch(`${API_URL}/api/community/projects/${id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full rounded-lg" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  if (!project) return <p className="text-muted-foreground">{t('proyectoNoEncontrado')}</p>;

  const isCoordinator = members.some((m: any) => m.user_id === (session?.user as any)?.id && m.role === 'coordinator');

  return (
    <div className="space-y-6">
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
          <CardTitle className="text-base">{t('miembrosSeccion')} ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {members.map((m: any) => (
              <Badge
                key={`${m.project_id}-${m.user_id}`}
                variant={m.role === 'coordinator' ? 'default' : 'secondary'}
                className="gap-1"
              >
                {m.display_name || m.user_id.slice(0, 8)}
                {m.role === 'coordinator' && <UserCheck className="ml-1 size-3" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('tareas')}</h2>
        {isCoordinator && (
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
                          {m.display_name || m.user_id.slice(0, 8)}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t: any) => t.status === col);
          return (
            <div key={col} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {TASK_STATUS_LABELS[col]} ({colTasks.length})
              </h3>
              <div className="space-y-2">
                {colTasks.map((task: any) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    isCoordinator={isCoordinator}
                    onStatusChange={(status) => updateTaskStatus(task.id, status)}
                    projectId={id}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">{t('sinTareas')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, members, isCoordinator, onStatusChange, projectId }: {
  task: any;
  members: any[];
  isCoordinator: boolean;
  onStatusChange: (status: string) => void;
  projectId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { data: session } = useSession();
  const authRef = useRef<string | undefined>(undefined);
  const t = useTranslations('portal.proyectos');

  const TASK_STATUS_LABELS: Record<string, string> = {
    todo: t('porHacer'), in_progress: t('enProgreso'), review: t('revision'), done: t('completado'),
  };

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  const loadComments = async () => {
    const headers: Record<string, string> = {};
    if (authRef.current) headers['Authorization'] = `Bearer ${authRef.current}`;
    const res = await fetch(`${API_URL}/api/community/projects/${projectId}/tasks/${task.id}/comments`, { headers, credentials: 'include' });
    if (res.ok) {
      const d = await res.json();
      setComments(d.data || []);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authRef.current) headers['Authorization'] = `Bearer ${authRef.current}`;
    const res = await fetch(`${API_URL}/api/community/projects/${projectId}/tasks/${task.id}/comments`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ body: newComment }),
    });
    if (res.ok) {
      setComments((prev) => [...prev, { id: Date.now().toString(), body: newComment, created_at: new Date().toISOString() }]);
      setNewComment('');
    }
  };

  const assignee = members.find((m: any) => m.user_id === task.assignee_id);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-sm" onClick={() => { setExpanded(!expanded); if (!expanded) loadComments(); }}>
      <CardContent className="p-3">
        <p className="text-sm font-medium">{task.title}</p>
        {task.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {assignee && (
            <span className="flex items-center gap-1">
              <UserCheck className="size-3" />
              {assignee.display_name || assignee.user_id.slice(0, 8)}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Status change */}
        {isCoordinator && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <Select value={task.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['todo', 'in_progress', 'review', 'done'].map((s) => (
                  <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Comments */}
        {expanded && (
          <div className="mt-3 border-t pt-3">
            <div className="mb-2 space-y-2">
              {comments.map((c: any) => (
                <div key={c.id} className="rounded-md bg-muted/50 p-2 text-xs">
                  <p>{c.body}</p>
                  <p className="mt-1 text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('sinComentarios')}</p>
              )}
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                size={1}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('anadirComentario')}
                className="h-8 text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
              />
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={addComment}>
                <MessageSquare className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}