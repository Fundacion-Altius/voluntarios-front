'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { FoodAidMutationError } from '@/modules/food-aid/hooks/useFoodAidLots';
import {
  FOOD_AID_CATEGORIES,
  FOOD_AID_LOT_STATUSES,
  FOOD_AID_UNITS,
  type FoodAidCategory,
  type FoodAidItemInput,
  type FoodAidLotStatus,
  type FoodAidUnit,
} from '@/types/foodAid';

export interface FoodAidCreateFormProps {
  onSubmit: (input: {
    item: FoodAidItemInput;
    lot: {
      quantity: number;
      expiry_date: string | null;
      location: string;
      status: FoodAidLotStatus;
    };
  }) => Promise<void>;
  disabled?: boolean;
}

/**
 * Turns a failed submission into the text to show. A validation failure keeps
 * the backend's own wording; anything else gets the translated fallback from
 * the shared portal.foodAid.errors namespace.
 */
function mutationErrorText(error: unknown, translate: (key: string) => string): string {
  if (error instanceof FoodAidMutationError) {
    if (error.code === 'validation' && error.message) return error.message;
    return translate(`errors.${error.code}`);
  }
  if (error instanceof Error && error.message) return error.message;
  return translate('errors.generic');
}

/**
 * Validates the form before hitting the API. The backend requires a title,
 * a positive quantity and a location (schema/pg/food-aid.ts:23,30,61).
 */
function validateForm(
  values: { title: string; quantity: string; location: string },
  messages: { errorTitle: string; errorQuantity: string; errorLocation: string }
): string | null {
  if (!values.title.trim()) return messages.errorTitle;
  const quantity = Number(values.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return messages.errorQuantity;
  if (!values.location.trim()) return messages.errorLocation;
  return null;
}

/**
 * Creates one food-aid record: the item definition and the lot that carries
 * the quantity, expiry, location and triage status. The backend splits the
 * same data across two tables (food_aid_items and food_aid_lots), so the form
 * collects both halves of a single "request" as one submission.
 */
export function FoodAidCreateForm({ onSubmit, disabled }: FoodAidCreateFormProps) {
  const t = useTranslations('portal.foodAid.form');
  // The category and status labels are shared with the list page, so they
  // live one namespace up (portal.foodAid.category.* / portal.foodAid.status.*).
  const tShared = useTranslations('portal.foodAid');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodAidCategory>('food');
  const [unit, setUnit] = useState<FoodAidUnit>('kg');
  const [ean, setEan] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<FoodAidLotStatus>('accepted');
  const [submitting, setSubmitting] = useState(false);
  const isBusy = Boolean(disabled) || submitting;
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm(
      { title, quantity, location },
      {
        errorTitle: t('errorTitle'),
        errorQuantity: t('errorQuantity'),
        errorLocation: t('errorLocation'),
      }
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    const parsedQuantity = Math.round(Number(quantity));

    setSubmitting(true);
    try {
      await onSubmit({
        item: {
          title: title.trim(),
          description: description.trim() || null,
          category,
          unit,
          ean: ean.trim() || null,
        },
        lot: {
          quantity: parsedQuantity,
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
          location: location.trim(),
          status,
        },
      });
      setTitle('');
      setDescription('');
      setEan('');
      setQuantity('');
      setLocation('');
      setExpiryDate('');
      setStatus('accepted');
    } catch (err) {
      setError(mutationErrorText(err, (key) => tShared(key)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="food-aid-title">{t('titleLabel')}</Label>
        <Input
          id="food-aid-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="food-aid-description">{t('descriptionLabel')}</Label>
        <Textarea
          id="food-aid-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={2}
          disabled={isBusy}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="food-aid-category">{t('categoryLabel')}</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as FoodAidCategory)}
            disabled={isBusy}
          >
            <SelectTrigger id="food-aid-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOOD_AID_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {tShared(`category.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="food-aid-unit">{t('unitLabel')}</Label>
          <Select
            value={unit}
            onValueChange={(v) => setUnit(v as FoodAidUnit)}
            disabled={isBusy}
          >
            <SelectTrigger id="food-aid-unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOOD_AID_UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="food-aid-quantity">{t('quantityLabel')}</Label>
          <Input
            id="food-aid-quantity"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={t('quantityPlaceholder')}
            disabled={isBusy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="food-aid-ean">{t('eanLabel')}</Label>
          <Input
            id="food-aid-ean"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            placeholder={t('eanPlaceholder')}
            maxLength={13}
            disabled={isBusy}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="food-aid-location">{t('locationLabel')}</Label>
          <Input
            id="food-aid-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('locationPlaceholder')}
            disabled={isBusy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="food-aid-expiry">{t('expiryLabel')}</Label>
          <Input
            id="food-aid-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={isBusy}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="food-aid-status">{t('statusLabel')}</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as FoodAidLotStatus)}
          disabled={isBusy}
        >
          <SelectTrigger id="food-aid-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOOD_AID_LOT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tShared(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isBusy}>
        {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
        {t('submit')}
      </Button>
    </form>
  );
}
