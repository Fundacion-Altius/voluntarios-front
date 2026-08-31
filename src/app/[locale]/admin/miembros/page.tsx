'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { useMembers, type Member, type CreateMemberDto, type ContactPreferences } from './useMembers';

// Status badge variants
const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  lapsed: 'secondary',
  churned: 'destructive',
};

// Tier badge variants
const tierBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  basic: 'outline',
  premium: 'secondary',
  founder: 'default',
};

// Status colors for display
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  lapsed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  churned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

function formatCurrency(amount: string | null) {
  if (!amount) return '-';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(parseFloat(amount));
}

export default function MiembrosPage() {
  const t = useTranslations('admin.miembros');
  const tCommon = useTranslations('common');
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    members,
    allMembers,
    isLoading,
    error,
    stats,
    filterOptions,
    setFilterOptions,
    createMember,
    deleteMember,
    refetch,
  } = useMembers();

  // Form state for creating new member
  const [createOpen, setCreateOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTier, setNewTier] = useState<'basic' | 'premium' | 'founder'>('basic');
  const [newStatus, setNewStatus] = useState<'active' | 'lapsed' | 'churned'>('active');
  const [newContactPreferences, setNewContactPreferences] = useState<ContactPreferences>({
    email: true,
    phone: false,
    mail: false,
  });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<Member | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const result = await createMember({
        fullName: newFullName,
        email: newEmail,
        phone: newPhone || undefined,
        tier: newTier,
        status: newStatus,
        contactPreferences: newContactPreferences,
      });

      if (result.success) {
        setNewFullName('');
        setNewEmail('');
        setNewPhone('');
        setNewTier('basic');
        setNewStatus('active');
        setNewContactPreferences({ email: true, phone: false, mail: false });
        setCreateOpen(false);
        showSuccess(t('miembroCreado'));
      } else {
        setFormError(result.error);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMemberTarget) return;

    try {
      const result = await deleteMember(deleteMemberTarget.id);
      if (result.success) {
        setDeleteMemberTarget(null);
        showSuccess(t('miembroEliminado'));
      } else {
        setFormError(result.error);
      }
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSearchChange = (value: string) => {
    setFilterOptions({ ...filterOptions, search: value });
  };

  const handleStatusFilterChange = (value: string) => {
    setFilterOptions({ ...filterOptions, status: value as 'active' | 'lapsed' | 'churned' | undefined });
  };

  const handleTierFilterChange = (value: string) => {
    setFilterOptions({ ...filterOptions, tier: value as 'basic' | 'premium' | 'founder' | undefined });
  };

  const clearFilters = () => {
    setFilterOptions({});
  };

  // Check if any filters are active
  const hasActiveFilters = filterOptions.search || filterOptions.status || filterOptions.tier;

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('titulo')}</h2>
        <div className="flex gap-2">
          <Link href="/admin/miembros/importar">
            <Button variant="outline">{t('importarCSV')}</Button>
          </Link>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>{t('nuevoMiembro')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('nuevoMiembro')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {formError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">{tCommon('nombre')}</label>
                  <Input
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder={t('nombreCompleto')}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{tCommon('email')}</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('telefono')}</label>
                  <Input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={t('telefonoPlaceholder')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('nivel')}</label>
                  <Select value={newTier} onValueChange={(value) => setNewTier(value as 'basic' | 'premium' | 'founder')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{t('basico')}</SelectItem>
                      <SelectItem value="premium">{t('premium')}</SelectItem>
                      <SelectItem value="founder">{t('fundador')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('estado')}</label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as 'active' | 'lapsed' | 'churned')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('activo')}</SelectItem>
                      <SelectItem value="lapsed">{t('inactivo')}</SelectItem>
                      <SelectItem value="churned">{t('baja')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('preferenciasContacto')}</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newContactPreferences.email}
                        onChange={(e) => setNewContactPreferences({ ...newContactPreferences, email: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {tCommon('email')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newContactPreferences.phone}
                        onChange={(e) => setNewContactPreferences({ ...newContactPreferences, phone: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {t('telefono')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newContactPreferences.mail}
                        onChange={(e) => setNewContactPreferences({ ...newContactPreferences, mail: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {t('correoPostal')}
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? tCommon('creando') : t('crearMiembro')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalMiembros')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('activos')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('inactivos')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lapsedMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('bajas')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.churnedMembers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <Input
            placeholder={tCommon('buscarPlaceholder')}
            value={filterOptions.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="min-w-32">
          <Select
            value={filterOptions.status || ''}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('filtrarEstado')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('activo')}</SelectItem>
              <SelectItem value="lapsed">{t('inactivo')}</SelectItem>
              <SelectItem value="churned">{t('baja')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-32">
          <Select
            value={filterOptions.tier || ''}
            onValueChange={handleTierFilterChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('filtrarNivel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">{t('basico')}</SelectItem>
              <SelectItem value="premium">{t('premium')}</SelectItem>
              <SelectItem value="founder">{t('fundador')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            {t('limpiarFiltros')}
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('nombre')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{tCommon('email')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('telefono')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('nivel')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('estado')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('fechaAlta')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t('ultimaContribucion')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{tCommon('acciones')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  {t('sinResultados')}
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{member.full_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {member.phone || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tierBadgeVariant[member.tier] || 'outline'}>
                      {member.tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[member.status] || 'outline'}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(member.join_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(member.last_contribution_date)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/miembros/${member.id}`}>
                        <Button variant="outline" size="sm">
                          {tCommon('editar')}
                        </Button>
                      </Link>
                      <AlertDialog
                        open={deleteMemberTarget?.id === member.id}
                        onOpenChange={(open) => {
                          if (!open) setDeleteMemberTarget(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteMemberTarget(member)}
                          >
                            {tCommon('eliminar')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('eliminarMiembro')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('eliminarMiembroDesc')}{' '}
                              <strong>{deleteMemberTarget?.full_name}</strong> ({deleteMemberTarget?.email}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon('cancelar')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              {tCommon('eliminar')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      {!isLoading && members.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('mostrandoXdeY', { count: members.length, total: allMembers.length })}
        </div>
      )}
    </div>
  );
}
