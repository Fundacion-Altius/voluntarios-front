'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ItemCategory } from '@/modules/comandero/types';

export type AddMenuItem = (input: { name: string; category: ItemCategory; price_cents: number }) => Promise<string | null>;

/** Form to add a plato or bebida to the classroom carta. Returns to blank on success. */
export function MenuForm({ onAdd }: { onAdd: AddMenuItem }) {
  const t = useTranslations('comandero.admin.menu');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('plato');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const failure = await onAdd({ name, category, price_cents: Math.round((Number(price) || 0) * 100) });
    if (failure) return setError(failure);
    setName('');
    setPrice('');
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="item-name">{t('name')}</Label>
          <Input
            id="item-name"
            data-testid="comandero-item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="w-full sm:w-40">
          <Label htmlFor="item-category">{t('category')}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
            <SelectTrigger id="item-category" data-testid="comandero-item-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plato">{t('plato')}</SelectItem>
              <SelectItem value="bebida">{t('bebida')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-28">
          <Label htmlFor="item-price">{t('price')}</Label>
          <Input
            id="item-price"
            data-testid="comandero-item-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <Button type="submit" data-testid="comandero-item-add">
          <Plus className="mr-1 size-4" />
          {t('add')}
        </Button>
      </form>
      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
    </>
  );
}
