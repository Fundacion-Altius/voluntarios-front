'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function AdminOnboardingPage() {
  const { data: session } = useSession();
  const authToken = (session as any)?.authToken;
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', order: 1 });

  const fetchTasks = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/onboarding/tasks`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (res.ok) setTasks(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const resetForm = () => {
    setNewTask(false);
    setEditId(null);
    setForm({ title: '', description: '', order: 1 });
  };

  const handleSave = async () => {
    if (!authToken) return;
    const isEdit = !!editId;
    const url = isEdit ? `${API_URL}/api/onboarding/tasks/${editId}` : `${API_URL}/api/onboarding/tasks`;
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (res.ok) {
        resetForm();
        fetchTasks();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!authToken || !confirm('¿Eliminar esta tarea?')) return;
    try {
      const res = await fetch(`${API_URL}/api/onboarding/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {}
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <Button onClick={() => { resetForm(); setNewTask(true); }}><Plus className="mr-1 size-4" /> Nueva tarea</Button>
      </div>

      {(newTask || editId) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <Input type="number" placeholder="Orden" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}><X className="mr-1 size-4" /> Cancelar</Button>
                <Button size="sm" onClick={handleSave}><Save className="mr-1 size-4" /> Guardar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <p className="text-muted-foreground">No hay tareas de onboarding.</p>
      ) : (
        <div className="space-y-2">
          {tasks
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((task) => (
              <Card key={task.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full border text-xs text-muted-foreground">{task.order}</span>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => { setEditId(task.id); setNewTask(false); setForm({ title: task.title, description: task.description || '', order: task.order || 1 }); }}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
