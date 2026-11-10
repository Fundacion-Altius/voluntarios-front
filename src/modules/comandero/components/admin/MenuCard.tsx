'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useComanderoMenu } from '@/modules/comandero/useComandero';
import { MenuForm, type AddMenuItem } from './MenuForm';
import { MenuRows } from './MenuRows';
import { pageWindow } from './paging';

const MENU_PAGE_SIZE = 10;

function MenuPagination({ current, count, onPage }: { current: number; count: number; onPage: (page: number) => void }) {
  const t = useTranslations('comandero.admin.menu');
  return (
    <div className="flex items-center gap-2" data-testid="comandero-menu-pagination">
      <Button
        data-testid="comandero-menu-prev"
        variant="outline"
        size="sm"
        disabled={current <= 0}
        onClick={() => onPage(current - 1)}
      >
        {t('prev')}
      </Button>
      <span data-testid="comandero-menu-page-info" className="text-sm text-muted-foreground">
        {t('page', { page: current + 1, total: count })}
      </span>
      <Button
        data-testid="comandero-menu-next"
        variant="outline"
        size="sm"
        disabled={current >= count - 1}
        onClick={() => onPage(current + 1)}
      >
        {t('next')}
      </Button>
    </div>
  );
}

/** The classroom carta (docente): add items, browse them by page, remove them. */
export function MenuCard() {
  const t = useTranslations('comandero.admin.menu');
  const { menu, loading, error, addItem, removeItem } = useComanderoMenu();
  const [page, setPage] = useState(0);
  const { count, current, start, end } = pageWindow(menu.length, page, MENU_PAGE_SIZE);

  // Deleting rows can leave the stored page past the last one; keep the state in range.
  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current]);

  const handleAdd: AddMenuItem = async (input) => {
    const failure = await addItem(input);
    // New items append. `menu.length` is still the pre-refresh count here, so aim past the
    // end and let the clamp effect land on the last page once the list updates.
    if (!failure) setPage(10_000);
    return failure;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('hint')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <MenuForm onAdd={handleAdd} />
        {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t('loading')}
          </div>
        ) : menu.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="space-y-3">
            <MenuRows items={menu.slice(start, end)} onRemove={removeItem} />
            {menu.length > MENU_PAGE_SIZE && <MenuPagination current={current} count={count} onPage={setPage} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
