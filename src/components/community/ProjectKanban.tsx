'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MessageSquare, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { apiClient, apiUrl } from '@/lib/apiClient';

export const KANBAN_COLUMNS = ['todo', 'in_progress', 'review', 'done'] as const;
export type KanbanColumn = (typeof KANBAN_COLUMNS)[number];

function memberLabel(member: { display_name?: string | null; email?: string | null; user_id: string }): string {
  return member.display_name || member.email || member.user_id.slice(0, 8);
}

export function ProjectKanban({
  projectId,
  tasks,
  members,
  canEdit,
  labels,
  onStatusChange,
}: {
  projectId: string;
  tasks: any[];
  members: any[];
  canEdit: boolean;
  labels: Record<string, string>;
  onStatusChange: (taskId: string, status: string) => void;
}) {
  const t = useTranslations('portal.proyectos');
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-gutter:stable] lg:-mx-0">
      <div className="flex w-max min-w-full snap-x snap-mandatory gap-3 px-4 lg:px-0">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((task: any) => task.status === col);
          return (
            <section
              key={col}
              className={cn(
                'flex w-72 shrink-0 snap-start flex-col rounded-xl border bg-muted/40',
                dragOver === col && 'ring-2 ring-primary/40',
              )}
              onDragOver={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                setDragOver(col);
              }}
              onDragLeave={() => setDragOver((c) => (c === col ? null : c))}
              onDrop={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                setDragOver(null);
                const taskId = e.dataTransfer.getData('text/task-id');
                if (taskId) onStatusChange(taskId, col);
              }}
            >
              <header className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
                <h3 className="text-sm font-semibold">{labels[col]}</h3>
                <Badge variant="secondary" className="tabular-nums">
                  {colTasks.length}
                </Badge>
              </header>
              <div className="flex min-h-[22rem] flex-1 flex-col gap-2 p-2">
                {colTasks.map((task: any) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    canEdit={canEdit}
                    labels={labels}
                    onStatusChange={(status) => onStatusChange(task.id, status)}
                    projectId={projectId}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-background/50 px-3 py-8 text-center text-xs text-muted-foreground">
                    {t('sinTareas')}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  members,
  canEdit,
  labels,
  onStatusChange,
  projectId,
}: {
  task: any;
  members: any[];
  canEdit: boolean;
  labels: Record<string, string>;
  onStatusChange: (status: string) => void;
  projectId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const t = useTranslations('portal.proyectos');
  const assignee = members.find((m: any) => m.user_id === task.assignee_id);

  const loadComments = async () => {
    const result = await apiClient<{ data: any[] }>(
      apiUrl(`/api/community/projects/${projectId}/tasks/${task.id}/comments`),
    );
    if (result.success) setComments(result.data.data || []);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const result = await apiClient(apiUrl(`/api/community/projects/${projectId}/tasks/${task.id}/comments`), {
      method: 'POST',
      body: JSON.stringify({ body: newComment }),
    });
    if (result.success) {
      setComments((prev) => [...prev, { id: Date.now().toString(), body: newComment, created_at: new Date().toISOString() }]);
      setNewComment('');
    }
  };

  return (
    <Card
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab bg-background shadow-sm active:cursor-grabbing"
      onClick={() => {
        setExpanded(!expanded);
        if (!expanded) void loadComments();
      }}
    >
      <CardContent className="space-y-2 p-3">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {assignee && (
            <span className="flex items-center gap-1">
              <UserCheck className="size-3" />
              {memberLabel(assignee)}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
        {canEdit && (
          <div onClick={(e) => e.stopPropagation()}>
            <Select value={task.status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KANBAN_COLUMNS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {labels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {expanded && (
          <div className="space-y-2 border-t pt-3">
            {comments.map((c: any) => (
              <div key={c.id} className="rounded-md bg-muted/50 p-2 text-xs">
                <p>{c.body}</p>
                <p className="mt-1 text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-muted-foreground">{t('sinComentarios')}</p>}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('anadirComentario')}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void addComment();
                }}
              />
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => void addComment()}>
                <MessageSquare className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
