'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { grantApi } from '@/lib/api/grantApi';
import type { GrantExpensesData } from '@/types/grant';

interface GrantExpensesCardProps {
  grantId: string;
  data: GrantExpensesData | null;
  canAdd: boolean;
  onChanged: () => Promise<void> | void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-ES');

export function GrantExpensesCard({ grantId, data, canAdd, onChanged }: GrantExpensesCardProps) {
  const t = useTranslations('admin.grantDetail');
  const tCommon = useTranslations('common');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const expenses = data?.expenses ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t('invalidExpense'));
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await grantApi.createExpense(grantId, {
        description: description.trim(),
        amount: parsedAmount,
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(expenseDate ? { expense_date: expenseDate } : {}),
      });
      if (!response.success) {
        setError(response.error || t('errorAddingExpense'));
        return;
      }
      setDescription('');
      setAmount('');
      setCategory('');
      setExpenseDate('');
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorAddingExpense'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('expenses')}</CardTitle>
        <CardDescription>{t('expensesDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('totalSpent')}</p>
              <p className="text-xl font-bold">{formatCurrency(data.total_spent)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('remaining')}</p>
              <p className="text-xl font-bold">{formatCurrency(data.remaining)}</p>
            </div>
          </div>
        )}

        {canAdd && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4" aria-label={t('addExpense')}>
            <h3 className="text-lg font-semibold">{t('addExpense')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expense-description">{t('expenseDescription')}</Label>
                <Input
                  id="expense-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-amount">{t('amount')}</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">{t('expenseDate')}</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expense-category">{t('expenseCategory')}</Label>
                <Input
                  id="expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? tCommon('guardando') : t('addExpense')}
            </Button>
          </form>
        )}

        {expenses.length === 0 ? (
          <Alert>
            <AlertDescription>{t('noExpenses')}</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('expenseDate')}</TableHead>
                <TableHead>{t('expenseDescription')}</TableHead>
                <TableHead>{t('expenseCategory')}</TableHead>
                <TableHead className="text-right">{t('amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.expense_date)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>{expense.category || '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
