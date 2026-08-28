'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { useMembers, type Member, type Contribution, type UpdateMemberDto, type CreateContributionDto, type ContactPreferences } from '../useMembers';

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

// Frequency badge variants
const frequencyBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  'one-time': 'outline',
  monthly: 'secondary',
  quarterly: 'default',
  annual: 'default',
};

// Payment method badge variants
const paymentMethodBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  cash: 'outline',
  bank_transfer: 'secondary',
  credit_card: 'default',
  debit_card: 'default',
  paypal: 'secondary',
  stripe: 'default',
  other: 'outline',
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

function formatCurrency(amount: string | number | null) {
  if (!amount) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

export default function MiembroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('admin.miembros');
  const tCommon = useTranslations('common');
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [paramId, setParamId] = useState<string>('');

  const {
    getMemberById,
    getContributionsByMember,
    updateMember,
    createContribution,
    parseContactPreferences,
  } = useMembers();

  const [member, setMember] = useState<Member | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for editing member
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTier, setEditTier] = useState<'basic' | 'premium' | 'founder'>('basic');
  const [editStatus, setEditStatus] = useState<'active' | 'lapsed' | 'churned'>('active');
  const [editContactPreferences, setEditContactPreferences] = useState<ContactPreferences>({
    email: true,
    phone: false,
    mail: false,
  });

  // Form state for creating new contribution
  const [contributionOpen, setContributionOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'EUR' | 'USD' | 'GBP' | 'CHF' | 'other'>('EUR');
  const [newFrequency, setNewFrequency] = useState<'one-time' | 'monthly' | 'quarterly' | 'annual'>('one-time');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'other'>('other');
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load member data
  useEffect(() => {
    const loadData = async () => {
      const id = (await params).id;
      setParamId(id);
      
      try {
        setIsLoading(true);
        setError(null);

        // Load member
        const memberData = await getMemberById(id);
        setMember(memberData);

        // Load contributions
        const contributionsData = await getContributionsByMember(id);
        setContributions(contributionsData);

        // Initialize edit form with member data
        if (memberData) {
          setEditFullName(memberData.full_name);
          setEditEmail(memberData.email);
          setEditPhone(memberData.phone || '');
          setEditTier(memberData.tier);
          setEditStatus(memberData.status);
          setEditContactPreferences(parseContactPreferences(memberData));
        }

        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadData();
  }, [params, getMemberById, getContributionsByMember, parseContactPreferences]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const result = await updateMember(paramId, {
        fullName: editFullName,
        email: editEmail,
        phone: editPhone || undefined,
        tier: editTier,
        status: editStatus,
        contactPreferences: editContactPreferences,
      });

      if (result.success) {
        setEditOpen(false);
        showSuccess(t('miembroActualizado'));
        // Refresh member data
        const memberData = await getMemberById(paramId);
        setMember(memberData);
      } else {
        setFormError(result.error);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const result = await createContribution({
        memberId: paramId,
        amount: parseFloat(newAmount) || 0,
        currency: newCurrency,
        frequency: newFrequency,
        paymentMethod: newPaymentMethod,
        date: newDate || undefined,
        notes: newNotes || undefined,
      });

      if (result.success) {
        setContributionOpen(false);
        setNewAmount('');
        setNewCurrency('EUR');
        setNewFrequency('one-time');
        setNewPaymentMethod('other');
        setNewDate('');
        setNewNotes('');
        showSuccess(t('contribucionCreada'));
        // Refresh contributions
        const contributionsData = await getContributionsByMember(paramId);
        setContributions(contributionsData);
      } else {
        setFormError(result.error);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total contributions
  const totalContributions = contributions.reduce((sum, c) => {
    return sum + (parseFloat(c.amount) || 0);
  }, 0);

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!member) {
    return (
      <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
        {t('miembroNoEncontrado')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{member.full_name}</h2>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/miembros">
            <Button variant="outline">{t('volverLista')}</Button>
          </Link>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button>{tCommon('editar')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('editarMiembro')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                {formError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">{tCommon('nombre')}</label>
                  <Input
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder={t('nombreCompleto')}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{tCommon('email')}</label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('telefono')}</label>
                  <Input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder={t('telefonoPlaceholder')}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('nivel')}</label>
                  <Select value={editTier} onValueChange={(v) => setEditTier(v as 'basic' | 'premium' | 'founder')}>
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
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'active' | 'lapsed' | 'churned')}>
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
                        checked={editContactPreferences.email}
                        onChange={(e) => setEditContactPreferences({ ...editContactPreferences, email: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {tCommon('email')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editContactPreferences.phone}
                        onChange={(e) => setEditContactPreferences({ ...editContactPreferences, phone: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {t('telefono')}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editContactPreferences.mail}
                        onChange={(e) => setEditContactPreferences({ ...editContactPreferences, mail: e.target.checked })}
                        className="h-4 w-4"
                      />
                      {t('correoPostal')}
                    </label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? tCommon('guardando') : t('guardarCambios')}
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

      {/* Member Profile Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('nivel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={tierBadgeVariant[member.tier] || 'outline'}>
              {member.tier}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('estado')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusBadgeVariant[member.status] || 'outline'}>
              {member.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('fechaAlta')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{formatDate(member.join_date)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('ultimaContribucion')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{formatDate(member.last_contribution_date)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('informacionContacto')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">{tCommon('email')}</div>
              <div className="font-medium">{member.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('telefono')}</div>
              <div className="font-medium">{member.phone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('preferenciasContacto')}</div>
              <div className="font-medium">
                {parseContactPreferences(member).email && tCommon('email') + ', '}
                {parseContactPreferences(member).phone && t('telefono') + ', '}
                {parseContactPreferences(member).mail && t('correoPostal')}
                {!parseContactPreferences(member).email && !parseContactPreferences(member).phone && !parseContactPreferences(member).mail && '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('riesgoBaja')}</div>
              <div className="font-medium">
                {member.churn_risk ? (
                  <Badge variant="destructive">{t('si')}</Badge>
                ) : (
                  <Badge variant="outline">{t('no')}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('historialContribuciones')}</CardTitle>
          <Dialog open={contributionOpen} onOpenChange={setContributionOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{t('nuevaContribucion')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('nuevaContribucion')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateContribution} className="space-y-4">
                {formError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('cantidad')}</label>
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('moneda')}</label>
                  <Select value={newCurrency} onValueChange={(v) => setNewCurrency(v as 'EUR' | 'USD' | 'GBP' | 'CHF' | 'other')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="other">{t('otra')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('frecuencia')}</label>
                  <Select value={newFrequency} onValueChange={(v) => setNewFrequency(v as 'one-time' | 'monthly' | 'quarterly' | 'annual')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">{t('unica')}</SelectItem>
                      <SelectItem value="monthly">{t('mensual')}</SelectItem>
                      <SelectItem value="quarterly">{t('trimestral')}</SelectItem>
                      <SelectItem value="annual">{t('anual')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('metodoPago')}</label>
                  <Select value={newPaymentMethod} onValueChange={(v) => setNewPaymentMethod(v as 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'other')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t('efectivo')}</SelectItem>
                      <SelectItem value="bank_transfer">{t('transferencia')}</SelectItem>
                      <SelectItem value="credit_card">{t('tarjetaCredito')}</SelectItem>
                      <SelectItem value="debit_card">{t('tarjetaDebito')}</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="other">{t('otro')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('fecha')}</label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('notas')}</label>
                  <Input
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder={t('notasPlaceholder')}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? tCommon('creando') : t('crearContribucion')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('sinContribuciones')}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t('totalContribuciones')}: {formatCurrency(totalContributions)}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('fecha')}</TableHead>
                    <TableHead>{t('cantidad')}</TableHead>
                    <TableHead>{t('moneda')}</TableHead>
                    <TableHead>{t('frecuencia')}</TableHead>
                    <TableHead>{t('metodoPago')}</TableHead>
                    <TableHead>{t('notas')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell>{formatDate(contribution.date)}</TableCell>
                      <TableCell>{formatCurrency(contribution.amount)}</TableCell>
                      <TableCell>{contribution.currency}</TableCell>
                      <TableCell>
                        <Badge variant={frequencyBadgeVariant[contribution.frequency] || 'outline'}>
                          {contribution.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentMethodBadgeVariant[contribution.payment_method] || 'outline'}>
                          {contribution.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>{contribution.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
