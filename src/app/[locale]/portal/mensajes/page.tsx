'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Plus, Search, Loader2 } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/portal/StateViews';
import { apiClient, apiUrl } from '@/lib/apiClient';

export default function MensajesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('portal.mensajes');
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    apiClient<{ data: any[] }>(apiUrl('/api/community/conversations'))
      .then((d) => setConversations(d.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const data = await apiClient<{ data: any[] }>(apiUrl(`/api/users/search?q=${encodeURIComponent(q)}`));
        setSearchResults(data.data || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  const createConversation = async () => {
    if (!newConvTitle.trim()) return;
    try {
      const participantIds = selectedUser ? [selectedUser.id] : [];
      const data = await apiClient<any>(apiUrl('/api/community/conversations'), {
        method: 'POST',
        body: JSON.stringify({ type: 'group', title: newConvTitle.trim(), participantIds }),
      });
      router.push(`/portal/mensajes/${data.id}`);
    } catch { /* silent */ }
  };

  if (loading) return <div><PageHeader title={t('titulo')} /><LoadingSkeleton rows={3} /></div>;
  if (error) return <div><PageHeader title={t('titulo')} /><ErrorState message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('titulo')}
        action={
          <Dialog open={newConvOpen} onOpenChange={setNewConvOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 size-4" /> {t('nuevaConversacion')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('nuevaConversacion')}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('tituloLabel')}</label>
                  <Input value={newConvTitle} onChange={(e) => setNewConvTitle(e.target.value)} placeholder={t('nombreGrupo')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('buscarParticipante')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder={t('escribeNombre')} className="pl-9" />
                  </div>
                  {searching && <p className="text-xs text-muted-foreground">{t('buscando')}</p>}
                  {searchResults.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-1">
                      {searchResults.map((u: any) => (
                        <button
                          key={u.id}
                          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${selectedUser?.id === u.id ? 'bg-primary/10' : ''}`}
                          onClick={() => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]); }}
                        >
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <span>{u.name || u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm">
                      <span>{t('participante')}: {selectedUser.name || selectedUser.email}</span>
                      <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSelectedUser(null)}>x</button>
                    </div>
                  )}
                </div>
                <Button onClick={createConversation} className="w-full" disabled={!newConvTitle.trim()}>{t('crear')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-10 text-muted-foreground/50" />}
          title={t('sinConversaciones')}
          description={t('sinConversacionesDesc')}
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((c: any) => (
            <Card key={c.id} className="cursor-pointer transition-shadow hover:shadow-sm" onClick={() => router.push(`/portal/mensajes/${c.id}`)}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.title || t('conversacion')}</p>
                  <p className="text-xs text-muted-foreground">{c.type === 'direct' ? t('directo') : t('grupal')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
