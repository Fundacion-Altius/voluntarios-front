'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, ArrowLeft } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export default function MensajesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const authRef = useRef<string | undefined>(undefined);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');
  const [newConvUserId, setNewConvUserId] = useState('');

  useEffect(() => {
    if (session) authRef.current = (session as any)?.authToken;
  }, [session]);

  useEffect(() => {
    if (!authRef.current) return;
    const headers: Record<string, string> = { Authorization: `Bearer ${authRef.current}` };
    fetch(`${API_URL}/api/community/conversations`, { headers, credentials: 'include' })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setConversations(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const createConversation = async () => {
    if (!newConvTitle.trim()) return;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authRef.current}`,
    };
    const res = await fetch(`${API_URL}/api/community/conversations`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        type: 'group',
        title: newConvTitle.trim(),
        participantIds: newConvUserId ? [newConvUserId] : [],
      }),
    });
    if (res.ok) {
      router.push(`/portal/proyectos/mensajes/${(await res.json()).id}`);
    }
  };

  if (loading) return (<div className="space-y-4"><Skeleton className="h-48 w-full rounded-lg" /><Skeleton className="h-48 w-full rounded-lg" /></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/portal/proyectos')}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">Mensajes</h1>
        </div>
        <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 size-4" /> Nueva conversación</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva conversación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input value={newConvTitle} onChange={(e) => setNewConvTitle(e.target.value)} placeholder="Nombre del grupo" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ID del participante</label>
                <Input value={newConvUserId} onChange={(e) => setNewConvUserId(e.target.value)} placeholder="Opcional: user ID" />
              </div>
              <Button onClick={createConversation} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <MessageSquare className="mb-2 size-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Sin conversaciones aún</p>
            <p className="mb-4 text-xs text-muted-foreground">Crea una para empezar a chatear con tu equipo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c: any) => (
            <Card
              key={c.id}
              className="cursor-pointer transition-shadow hover:shadow-sm"
              onClick={() => router.push(`/portal/proyectos/mensajes/${c.id}`)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.title || 'Conversación'}</p>
                  <p className="text-xs text-muted-foreground">{c.type === 'direct' ? 'Directo' : 'Grupal'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}