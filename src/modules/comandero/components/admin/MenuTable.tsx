'use client';

import { ChefHat, Trash2, Wine } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/modules/comandero/money';
import type { MenuItem } from '@/modules/comandero/types';

/** One page of the classroom carta, with the station each item goes to and a remove button. */
export function MenuTable({ items, onRemove }: { items: MenuItem[]; onRemove: (id: string) => void }) {
  const t = useTranslations('comandero.admin.menu');
  const locale = useLocale();

  return (
    <Table data-testid="comandero-menu-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t('item')}</TableHead>
          <TableHead>{t('station')}</TableHead>
          <TableHead>{t('priceCol')}</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} data-testid="comandero-menu-row">
            <TableCell className="font-medium" data-testid="comandero-menu-row-name">
              {item.name}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="gap-1">
                {item.category === 'bebida' ? <Wine className="size-3" /> : <ChefHat className="size-3" />}
                {t(item.category === 'bebida' ? 'barra' : 'cocina')}
              </Badge>
            </TableCell>
            <TableCell data-testid="comandero-menu-row-price">{formatMoney(item.price_cents, locale)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('remove', { name: item.name })}
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
