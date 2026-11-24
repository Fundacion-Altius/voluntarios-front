'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { createFormColumns } from './columns';
import type { Form } from './useForms';

interface FormTableProps {
  forms: Form[];
  isLoading: boolean;
  deleteTarget: Form | null;
  setDeleteTarget: (form: Form | null) => void;
  onDelete: () => void;
  onEdit: (form: Form) => void;
  onViewReport: (form: Form) => void;
  onPublish: (form: Form) => void;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}

export function FormTable({
  forms,
  isLoading,
  setDeleteTarget,
  onEdit,
  onViewReport,
  onPublish,
  t,
  tCommon,
}: FormTableProps) {
  const locale = useLocale();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo(
    () =>
      createFormColumns(t, tCommon, locale, {
        onEdit,
        onViewReport,
        onPublish,
        setDeleteTarget,
      }),
    [t, tCommon, locale, onEdit, onViewReport, onPublish, setDeleteTarget],
  );

  const sorted = useMemo(() => {
    if (sorting.length === 0) return forms;
    const { id, desc } = sorting[0];
    const valueOf = (form: Form): string => {
      if (id === 'title') return form.title;
      if (id === 'status') return form.status;
      if (id === 'createdAt') return form.createdAt;
      return '';
    };
    return [...forms].sort((a, b) => {
      const cmp = valueOf(a).localeCompare(valueOf(b), locale, {
        numeric: true,
        sensitivity: 'base',
      });
      return desc ? -cmp : cmp;
    });
  }, [forms, sorting, locale]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pageData = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <DataTable
      columns={columns}
      data={pageData}
      total={total}
      page={safePage}
      pageSize={pageSize}
      totalPages={totalPages}
      isLoading={isLoading}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      onSortingChange={(next) => {
        setSorting(next);
        setPage(1);
      }}
      sorting={sorting}
      emptyMessage={t('sinFormularios')}
    />
  );
}
