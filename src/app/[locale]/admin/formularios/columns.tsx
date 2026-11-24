'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Form } from './useForms';

type TFn = ReturnType<typeof useTranslations>;

function formatCreatedAt(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

function StatusBadge({ status, t }: { status: Form['status']; t: TFn }) {
  const label =
    status === 'published' ? t('publicado') : status === 'archived' ? t('archivado') : t('borrador');

  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        status === 'published' && 'border-primary/20 bg-primary/10 text-primary',
        status === 'draft' && 'border-border bg-muted text-muted-foreground',
        status === 'archived' && 'border-border bg-muted/60 text-muted-foreground',
      )}
    >
      {label}
    </Badge>
  );
}

export type FormTableActions = {
  onEdit: (form: Form) => void;
  onViewReport: (form: Form) => void;
  onPublish: (form: Form) => void;
  setDeleteTarget: (form: Form | null) => void;
};

export function createFormColumns(
  t: TFn,
  tCommon: TFn,
  locale: string,
  actions: FormTableActions,
): ColumnDef<Form>[] {
  return [
    {
      accessorKey: 'title',
      header: t('tituloPlaceholder'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-[20rem] whitespace-normal break-words font-medium">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('estado'),
      enableSorting: true,
      cell: ({ row }) => <StatusBadge status={row.original.status} t={t} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('creado'),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatCreatedAt(row.original.createdAt, locale)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="w-full text-right">{tCommon('acciones')}</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const form = row.original;
        return (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5"
              onClick={() => actions.onViewReport(form)}
            >
              {t('verResultados')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5"
              onClick={() => actions.onPublish(form)}
            >
              {form.status === 'published' ? t('despublicarFormulario') : t('publicarFormulario')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5"
              onClick={() => actions.onEdit(form)}
            >
              {tCommon('editar')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-destructive hover:text-destructive"
              onClick={() => actions.setDeleteTarget(form)}
            >
              {tCommon('eliminar')}
            </Button>
          </div>
        );
      },
    },
  ];
}
