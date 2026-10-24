'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FoodAidApiErrorCode } from '@/lib/api/foodAidApi';
import { useAuthGate } from '@/app/auth/useAuthGate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, PackageSearch, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import PageHeader from '@/components/portal/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/portal/StateViews';
import { FoodAidCreateForm } from '@/modules/food-aid/components/FoodAidCreateForm';
import {
  FoodAidMutationError,
  useFoodAidLots,
} from '@/modules/food-aid/hooks/useFoodAidLots';
import {
  FOOD_AID_CATEGORIES,
  FOOD_AID_LOT_STATUSES,
  type FoodAidCategory,
  type FoodAidItemInput,
  type FoodAidLotStatus,
  type FoodAidLotWithItem,
} from '@/types/foodAid';

const PAGE_SIZE = 10;

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  accepted: 'default',
  partial: 'secondary',
  rejected: 'destructive',
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function isKnownCategory(category: string): category is FoodAidCategory {
  return (FOOD_AID_CATEGORIES as readonly string[]).includes(category);
}

function canMutateFoodAid(role: string | undefined): boolean {
  return role === 'admin' || role === 'nave';
}

interface FoodAidTableProps {
  lots: FoodAidLotWithItem[];
  pendingLotId: string | null;
  canMutate: boolean;
  onStatusChange: (lot: FoodAidLotWithItem, status: FoodAidLotStatus) => void;
  onDelete: (lot: FoodAidLotWithItem) => void;
}

function FoodAidTable({ lots, pendingLotId, canMutate, onStatusChange, onDelete }: FoodAidTableProps) {
  const t = useTranslations('portal.foodAid');

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnTitle')}</TableHead>
              <TableHead>{t('columnCategory')}</TableHead>
              <TableHead>{t('columnQuantity')}</TableHead>
              <TableHead>{t('columnLocation')}</TableHead>
              <TableHead>{t('columnExpiry')}</TableHead>
              <TableHead>{t('columnStatus')}</TableHead>
              {canMutate && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-medium">
                  {lot.item?.title ?? t('unknownItem')}
                  {lot.item?.description && (
                    <span className="block max-w-xs truncate text-xs font-normal text-muted-foreground">
                      {lot.item.description}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {lot.item?.category
                    ? isKnownCategory(lot.item.category)
                      ? t(`category.${lot.item.category}`)
                      : lot.item.category
                    : '—'}
                </TableCell>
                <TableCell>
                  {lot.quantity} {lot.item?.unit ?? ''}
                </TableCell>
                <TableCell>{lot.location}</TableCell>
                <TableCell>{formatDate(lot.expiry_date) ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[lot.status] ?? 'outline'}>
                      {t(`status.${lot.status}`)}
                    </Badge>
                    {canMutate && (
                      <Select
                        value={lot.status}
                        onValueChange={(v) => onStatusChange(lot, v as FoodAidLotStatus)}
                        disabled={pendingLotId === lot.id}
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-9 justify-center px-0"
                          aria-label={t('changeStatus', { title: lot.item?.title ?? '' })}
                        >
                          <Pencil className="size-3.5" />
                        </SelectTrigger>
                        <SelectContent>
                          {FOOD_AID_LOT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(`status.${status}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {pendingLotId === lot.id && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                {canMutate && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('deleteLot', { title: lot.item?.title ?? '' })}
                      disabled={pendingLotId === lot.id}
                      onClick={() => onDelete(lot)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function mutationErrorMessage(error: unknown): string {
  if (error instanceof FoodAidMutationError) {
    if (error.code === 'validation' && error.message) return error.message;
    return `errors.${error.code}`;
  }
  return 'errors.generic';
}

function loadErrorMessage(
  code: FoodAidApiErrorCode | null,
  backendMessage: string | null
): string {
  if (code === 'service_unavailable') return 'serviceUnavailable';
  if (code === 'network') return 'network';
  if (code === 'invalid_response') return 'invalidResponse';
  return backendMessage ?? 'generic';
}

export default function FoodAidPortalPage() {
  const t = useTranslations('portal.foodAid');
  const { user } = useAuthGate();
  const role = (user as { role?: string } | null)?.role;
  const canMutate = canMutateFoodAid(role);

  const {
    lots,
    expiringLots,
    loading,
    error,
    errorCode,
    refresh,
    createItem,
    createLot,
    updateLotStatus,
    deleteLot,
    notifyExpiring,
  } = useFoodAidLots();

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pendingLotId, setPendingLotId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const filteredLots = useMemo(() => {
    const filtered = lots.filter((lot) => {
      if (statusFilter !== 'all' && lot.status !== statusFilter) return false;
      if (!term) return true;
      const title = lot.item?.title ?? '';
      return (
        title.toLowerCase().includes(term) ||
        lot.location.toLowerCase().includes(term) ||
        (lot.item?.category ?? '').toLowerCase().includes(term)
      );
    });
    return filtered.sort((a, b) => {
      const ta = (a.item?.title ?? '').localeCompare(b.item?.title ?? '', undefined, { sensitivity: 'base' });
      return ta;
    });
  }, [lots, statusFilter, term]);

  const totalPages = Math.max(1, Math.ceil(filteredLots.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLots = filteredLots.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreate = async (payload: {
    item: FoodAidItemInput;
    lot: {
      quantity: number;
      expiry_date: string | null;
      location: string;
      status: FoodAidLotStatus;
    };
  }) => {
    setActionError(null);
    const item = await createItem(payload.item);
    await createLot(item.id, payload.lot);
    setShowForm(false);
  };

  const handleStatusChange = async (lot: FoodAidLotWithItem, status: FoodAidLotStatus) => {
    setActionError(null);
    setPendingLotId(lot.id);
    try {
      await updateLotStatus(lot.id, status);
    } catch (err) {
      setActionError(mutationErrorMessage(err));
    } finally {
      setPendingLotId(null);
    }
  };

  const handleDelete = async (lot: FoodAidLotWithItem) => {
    const title = lot.item?.title ?? lot.id;
    if (!window.confirm(t('confirmDelete', { title }))) return;
    setActionError(null);
    setPendingLotId(lot.id);
    try {
      await deleteLot(lot.id);
    } catch (err) {
      setActionError(mutationErrorMessage(err));
    } finally {
      setPendingLotId(null);
    }
  };

  const handleNotifyExpiring = async () => {
    setNotifyMessage(null);
    setActionError(null);
    try {
      const result = await notifyExpiring();
      setNotifyMessage(t('notifyDone', { count: result.count }));
    } catch (err) {
      setActionError(mutationErrorMessage(err));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={canMutate ? t('subtitle') : t('subtitleVolunteer')}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refresh()}
              disabled={loading}
              aria-label={t('refresh')}
            >
              <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
            {canMutate && (
              <Button onClick={() => setShowForm((v) => !v)}>
                <Plus className="mr-1 size-4" />
                {showForm ? t('closeForm') : t('newRequest')}
              </Button>
            )}
          </div>
        }
      />

      {canMutate && expiringLots.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  {t('expiryBannerTitle', { count: expiringLots.length })}
                </p>
                <ul className="mt-1 list-disc pl-4 text-sm text-amber-900/90 dark:text-amber-100/90">
                  {expiringLots.slice(0, 5).map((lot) => (
                    <li key={lot.id}>
                      {lot.item?.title ?? t('unknownItem')} — {formatDate(lot.expiry_date) ?? '—'} @ {lot.location}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void handleNotifyExpiring()}>
              {t('notifyAdmins')}
            </Button>
          </CardContent>
        </Card>
      )}

      {notifyMessage && (
        <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          {notifyMessage}
        </p>
      )}

      {canMutate && showForm && (
        <Card>
          <CardContent className="pt-6">
            <FoodAidCreateForm onSubmit={handleCreate} disabled={loading} />
          </CardContent>
        </Card>
      )}

      {actionError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionError.startsWith('errors.') ? t(actionError as 'errors.generic') : actionError}
        </p>
      )}

      {error || errorCode ? (
        <ErrorState
          message={t(`errors.${loadErrorMessage(errorCode, error)}`)}
          onRetry={() => void refresh()}
        />
      ) : loading ? (
        <LoadingSkeleton rows={3} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('searchPlaceholder')}
              className="sm:max-w-xs"
              aria-label={t('searchPlaceholder')}
            />
            {canMutate && (
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="sm:max-w-[12rem]" aria-label={t('filterLabel')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  {FOOD_AID_LOT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span className="text-sm text-muted-foreground">
              {t('count', { count: filteredLots.length })}
            </span>
          </div>

          {lots.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-12 text-muted-foreground" />}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
              action={
                canMutate ? (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="mr-1 size-4" />
                    {t('newRequest')}
                  </Button>
                ) : undefined
              }
            />
          ) : filteredLots.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-12 text-muted-foreground" />}
              title={t('noMatchesTitle')}
              description={t('noMatchesDescription')}
              action={
                <Button variant="outline" onClick={clearFilters}>
                  {t('clearFilters')}
                </Button>
              }
            />
          ) : (
            <>
              <FoodAidTable
                lots={pageLots}
                pendingLotId={pendingLotId}
                canMutate={canMutate}
                onStatusChange={(lot, status) => void handleStatusChange(lot, status)}
                onDelete={(lot) => void handleDelete(lot)}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    {t('prevPage')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t('pageOf', { page: currentPage, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {t('nextPage')}
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
