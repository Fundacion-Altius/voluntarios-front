'use client';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToys } from '../useToys';
import { getApiBaseUrl } from '@/lib/apiUrl';
import { ItemEditModal, type StockItem } from './ItemEditModal';
import { TOY_LOCATIONS } from '@/lib/toyLocations';

const PAGE_SIZE = 10;

export default function ToysStockPage() {
  const t = useTranslations('admin.toys');
  const tc = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const api = useToys();
  const [out, setOut] = useState('');
  const [stock, setStock] = useState<StockItem[]>([]);
  const [modal, setModal] = useState<{ item: StockItem | null } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(0);

  const loadStock = useCallback(async () => {
    const r = await api.listItems();
    if (!r.success) {
      setOut(`ERROR: ${r.error}`);
      return;
    }
    setStock(r.data as StockItem[]);
  }, [api]);

  useEffect(() => {
    if (!loaded && api.status?.enabled) {
      setLoaded(true);
      void loadStock();
    }
  }, [api.status, loaded, loadStock]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (authLoading || !api.status) return <Skeleton className="h-32 w-full" />;
  if (!isAuthenticated) return <p>{t('loginRequerido')}</p>;
  if (!api.status.enabled) return <p data-testid="toys-denied">{t('apagado')}</p>;

  const runDelete = async (id: string) => {
    const r = await api.deleteItem(id);
    if (!r.success) return setOut(`ERROR: ${r.error}`);
    if (modal?.item?.id === id) setModal(null);
    await loadStock();
    setOut(t('eliminado'));
  };

  const visible =
    debouncedQuery === ''
      ? stock
      : stock.filter((s) =>
        [s.title ?? '', s.description ?? '', s.ean ?? '', s.location ?? '']
          .join(' ')
          .toLowerCase()
          .includes(debouncedQuery),
      );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = visible.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4 p-4" data-testid="toys-stock-page">
      <h1 className="text-2xl font-bold">{t('inventario')}</h1>
      <div className="flex items-center gap-2">
        <Link href="/admin/toys" data-testid="toys-console-link">
          <Button variant="outline">{t('volver')}</Button>
        </Link>
        <Button data-testid="toys-add-open" onClick={() => setModal({ item: null })}>{t('anadir')}</Button>
      </div>

      <Card data-testid="toys-inventory">
        <CardHeader>
          <CardTitle>{t('inventario')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            data-testid="toys-stock-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('buscar')}
            className="max-w-md"
          />
          <Table data-testid="toys-stock">
            <TableHeader>
              <TableRow>
                <TableHead>{t('ean')}</TableHead>
                <TableHead>{t('fotos')}</TableHead>
                <TableHead>{t('tituloItem')}</TableHead>
                <TableHead>{t('descripcion')}</TableHead>
                <TableHead>{t('edad')}</TableHead>
                <TableHead>{t('cantidad')}</TableHead>
                <TableHead>{t('ubicacion')}</TableHead>
                <TableHead>{t('acciones')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const shown = s.cover ?? s.pictures?.[0] ?? null;
                return (
                  <TableRow key={s.id} data-testid={`toys-row-${s.id}`}>
                    <TableCell className="font-mono">{s.ean}</TableCell>
                    <TableCell>
                      {shown ? (
                        <img src={`${getApiBaseUrl()}${shown}`} alt={s.title ?? ''} className="h-10 w-10 object-cover" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{s.title ?? s.article}</TableCell>
                    <TableCell className="max-w-52 truncate">{s.description}</TableCell>
                    <TableCell>{s.ageBand ? t(`bandas.${s.ageBand}`) : s.age}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>
                      {(TOY_LOCATIONS as readonly string[]).includes(s.location ?? '') ? t(`ubicaciones.${s.location}`) : (s.location ?? '')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button data-testid={`toys-edit-${s.id}`} variant="outline" onClick={() => setModal({ item: s })}>
                          {t('editar')}
                        </Button>
                        <Button data-testid={`toys-delete-${s.id}`} variant="destructive" onClick={() => runDelete(s.id)}>
                          {t('eliminar')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center gap-2">
            <Button data-testid="toys-prev-page" variant="outline" disabled={safePage <= 0} onClick={() => setPage(safePage - 1)}>
              {tc('anterior')}
            </Button>
            <span data-testid="toys-page-info">{t('pagina')} {safePage + 1} {t('de')} {pageCount}</span>
            <Button data-testid="toys-next-page" variant="outline" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              {tc('siguiente')}
            </Button>
          </div>
          {out && <p data-testid="toys-item-result">{out}</p>}
        </CardContent>
      </Card>

      {modal && (
        <ItemEditModal
          key={modal.item?.id ?? 'new'}
          item={modal.item}
          onClose={() => setModal(null)}
          onChanged={() => loadStock()}
        />
      )}
    </div>
  );
}
