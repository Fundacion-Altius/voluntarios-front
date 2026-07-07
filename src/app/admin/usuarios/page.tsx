'use client';

import { useState } from 'react';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useUsers, type User } from './useUsers';

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  admin: 'default',
  nave: 'secondary',
  general: 'outline',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export default function UsuariosPage() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    users,
    isLoading,
    error,
    search,
    setSearch,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
  } = useUsers();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('general');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await createUser({ name: newName, email: newEmail, role: newRole, password: newPassword || undefined });
      setNewName('');
      setNewEmail('');
      setNewRole('general');
      setNewPassword('');
      setCreateOpen(false);
      showSuccess('Usuario creado correctamente');
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      setEditUser(null);
      showSuccess('Rol actualizado correctamente');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteUserTarget) return;
    try {
      await deleteUser(deleteUserTarget.user_id);
      setDeleteUserTarget(null);
      showSuccess('Usuario eliminado correctamente');
    } catch (err: any) {
      setFormError(err.message);
    }
  };

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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Rol</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="nave">Nave</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Contraseña (opcional)</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Dejar vacío para generar automática"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Rol</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Creado</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Último login</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.user_id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{u.display_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant[u.role || ''] || 'outline'}>
                      {u.role || 'sin rol'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(u.last_login)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editUser?.user_id === u.user_id}
                        onOpenChange={(open) => {
                          if (!open) setEditUser(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditUser(u)}
                          >
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="mb-1 block text-sm font-medium">Nombre</label>
                              <Input value={u.display_name} disabled />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium">Email</label>
                              <Input value={u.email} disabled />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium">Rol</label>
                              <Select
                                defaultValue={u.role || 'general'}
                                onValueChange={(val) => handleEditRole(u.user_id, val)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="nave">Nave</SelectItem>
                                  <SelectItem value="general">General</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog
                        open={deleteUserTarget?.user_id === u.user_id}
                        onOpenChange={(open) => {
                          if (!open) setDeleteUserTarget(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteUserTarget(u)}
                            disabled={u.user_id === (currentUser as any)?.user_id}
                          >
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará a{' '}
                              <strong>{deleteUserTarget?.display_name}</strong> ({deleteUserTarget?.email}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>
                              Eliminar
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
    </div>
  );
}
