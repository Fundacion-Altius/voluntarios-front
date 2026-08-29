'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { apiClient, apiUrl } from '@/lib/apiClient';

interface Props {
  onCreated: (channelId: string) => void;
}

export function CreateChannelModal({ onCreated }: Props) {
  const t = useTranslations('portal.mensajes');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'direct' | 'group'>('group');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name?: string; email?: string }>>([]);
  const [selected, setSelected] = useState<Array<{ id: string; name?: string; email?: string }>>([]);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    try {
      const data = await apiClient<{ data: Array<{ id: string; name?: string; email?: string }> }>(
        apiUrl(`/api/users/search?q=${encodeURIComponent(q)}`),
      );
      setResults(data.data || []);
    } catch { setResults([]); }
  }

  async function create() {
    const body =
      mode === 'direct'
        ? { type: 'direct', otherUserId: selected[0]?.id }
        : { type: 'group', name: name.trim(), topic: topic.trim() || null, memberIds: selected.map((u) => u.id) };
    const channel = await apiClient<{ id: string }>(apiUrl('/api/chat/channels'), {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setOpen(false);
    onCreated(channel.id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 size-4" /> {t('nuevaConversacion')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('nuevaConversacion')}</DialogTitle></DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant={mode === 'direct' ? 'default' : 'outline'} onClick={() => setMode('direct')}>{t('directo')}</Button>
          <Button size="sm" variant={mode === 'group' ? 'default' : 'outline'} onClick={() => setMode('group')}>{t('grupal')}</Button>
        </div>
        {mode === 'group' && (
          <div className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('nombreGrupo')} />
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('tema')} />
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => void search(e.target.value)} placeholder={t('escribeNombre')} className="pl-9" />
        </div>
        {results.map((u) => (
          <button key={u.id} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => {
            setSelected(mode === 'direct' ? [u] : [...selected.filter((s) => s.id !== u.id), u]);
            setQuery('');
            setResults([]);
          }}>
            {u.name || u.email}
          </button>
        ))}
        {selected.map((u) => (
          <div key={u.id} className="flex items-center gap-2 text-sm">
            <span>{u.name || u.email}</span>
            <button type="button" onClick={() => setSelected(selected.filter((s) => s.id !== u.id))}>x</button>
          </div>
        ))}
        <Button onClick={() => void create()} disabled={mode === 'direct' ? selected.length !== 1 : !name.trim()}>
          {t('crear')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
