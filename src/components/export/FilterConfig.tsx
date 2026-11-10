'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  status: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

interface FilterConfigProps {
  value: ExportFilters;
  onChange: (value: ExportFilters) => void;
}

export function FilterConfig({ value, onChange }: FilterConfigProps) {
  const patch = (partial: Partial<ExportFilters>) => onChange({ ...value, ...partial });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="dateFrom">Desde</Label>
        <Input id="dateFrom" type="date" value={value.dateFrom} onChange={(event) => patch({ dateFrom: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dateTo">Hasta</Label>
        <Input id="dateTo" type="date" value={value.dateTo} onChange={(event) => patch({ dateTo: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="status">Estado</Label>
        <Input id="status" value={value.status} onChange={(event) => patch({ status: event.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="sortField">Ordenar por</Label>
        <Input id="sortField" value={value.sortField} onChange={(event) => patch({ sortField: event.target.value })} />
      </div>
    </div>
  );
}
