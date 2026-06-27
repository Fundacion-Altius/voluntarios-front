'use client';
import { useAuth } from '../auth/useAuth';
import { RoleBadge } from '../components/RoleBadge';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaFilter } from '@/components/ui/area-filter';
import { LugarFilter } from '@/components/ui/lugar-filter';
import { columns } from './columns';
import { useContracts } from './useContracts';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    setPage,
    setPageSize,
    setSorting,
    setSearch,
    search,
    sorting,
    setAreas,
    areas,
    setLugares,
    lugares,
  } = useContracts();

  if (authLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      {user && <RoleBadge role={(user as any).role as string} count={total} />}
      <h2 className="mb-4 text-xl font-semibold">Contratos</h2>
      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <AreaFilter selected={areas} onChange={setAreas} />
        <LugarFilter selected={lugares} onChange={setLugares} />
      </div>
      <div className="wrapper">
        <DataTable
          columns={columns}
          data={data}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSortingChange={setSorting}
          sorting={sorting}
        />
      </div>
    </div>
  );
}
