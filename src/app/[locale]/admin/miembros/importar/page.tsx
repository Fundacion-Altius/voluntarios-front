'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { useMembers, type CreateMemberDto, type CreateContributionDto } from '../useMembers';

// CSV parsing function
function parseCSV(csvText: string): { members: CreateMemberDto[]; contributions: CreateContributionDto[] } {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  const members: CreateMemberDto[] = [];
  const contributions: CreateContributionDto[] = [];

  if (lines.length < 2) {
    return { members, contributions };
  }

  // Parse header to understand columns
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim());

    // Create member object
    const member: CreateMemberDto = {
      fullName: '',
      email: '',
      phone: '',
      tier: 'basic',
      status: 'active',
      contactPreferences: { email: true, phone: false, mail: false },
    };

    // Map values to member fields
    for (let j = 0; j < Math.min(headers.length, values.length); j++) {
      const header = headers[j];
      const value = values[j];

      if (header.includes('nombre') || header.includes('name') || header.includes('fullname')) {
        member.fullName = value;
      } else if (header.includes('email') || header.includes('correo')) {
        member.email = value;
      } else if (header.includes('telefono') || header.includes('phone')) {
        member.phone = value || undefined;
      } else if (header.includes('nivel') || header.includes('tier')) {
        if (value === 'premium' || value === 'premium') member.tier = 'premium';
        else if (value === 'founder' || value === 'fundador') member.tier = 'founder';
        else member.tier = 'basic';
      } else if (header.includes('estado') || header.includes('status')) {
        if (value === 'lapsed' || value === 'inactivo') member.status = 'lapsed';
        else if (value === 'churned' || value === 'baja') member.status = 'churned';
        else member.status = 'active';
      }
    }

    // Only add if we have at least a name or email
    if (member.fullName || member.email) {
      members.push(member);
    }
  }

  return { members, contributions };
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export default function ImportarMiembrosPage() {
  const t = useTranslations('admin.miembros');
  const tCommon = useTranslations('common');
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importMembersFromCSV } = useMembers();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<{ members: CreateMemberDto[]; contributions: CreateContributionDto[] }>(
    { members: [], contributions: [] }
  );
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
  } | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const parsed = parseCSV(text);
      setParsedData(parsed);
    };
    reader.readAsText(file);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    const parsed = parseCSV(text);
    setParsedData(parsed);
  };

  const handleImport = async () => {
    if (parsedData.members.length === 0) {
      setError(t('noDatosParaImportar'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await importMembersFromCSV({
        members: parsedData.members,
        contributions: parsedData.contributions,
      });

      if (result.success) {
        setImportResult({
          successCount: parsedData.members.length,
          errorCount: 0,
          errors: [],
        });
        showSuccess(t('importacionExitosa', { count: parsedData.members.length }));
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = `Nombre,Email,Telefono,Nivel,Estado
Juan Perez,juan@example.com,123456789,premium,active
Maria Garcia,maria@example.com,987654321,basic,active
Carlos Rodriguez,carlos@example.com,,founder,active`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_miembros.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
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
        <div>
          <h2 className="text-xl font-semibold">{t('importarCSV')}</h2>
          <p className="text-sm text-muted-foreground">{t('importarCSVDescripcion')}</p>
        </div>
        <Link href="/admin/miembros">
          <Button variant="outline">{t('volverLista')}</Button>
        </Link>
      </div>

      {successMsg && (
        <Alert className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <AlertTitle>{tCommon('exito')}</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{tCommon('error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {importResult && (
        <Alert className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <AlertTitle>{t('importacionCompletada')}</AlertTitle>
          <AlertDescription>
            {t('importacionResultado', {
              success: importResult.successCount,
              errors: importResult.errorCount,
            })}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('subirArchivoCSV')}</CardTitle>
          <CardDescription>{t('subirArchivoCSVDescripcion')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={() => fileInputRef.current?.click()}>
              {t('seleccionarArchivo')}
            </Button>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              {t('descargarPlantilla')}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">{t('oPegarDatosCSV')}</label>
            <textarea
              value={csvText}
              onChange={handleTextAreaChange}
              placeholder={t('pegarDatosCSVPlaceholder')}
              className="w-full min-h-32 p-3 border rounded-md text-sm font-mono"
              rows={8}
            />
          </div>
        </CardContent>
      </Card>

      {parsedData.members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('vistaPreviaDatos')}</CardTitle>
            <CardDescription>
              {t('miembrosEncontrados', { count: parsedData.members.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading ? tCommon('cargando') : t('importarDatos')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setCsvText('');
                  setParsedData({ members: [], contributions: [] });
                }}>
                  {t('limpiar')}
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tCommon('nombre')}</TableHead>
                      <TableHead>{tCommon('email')}</TableHead>
                      <TableHead>{t('telefono')}</TableHead>
                      <TableHead>{t('nivel')}</TableHead>
                      <TableHead>{t('estado')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.members.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell>{member.fullName || '-'}</TableCell>
                        <TableCell>{member.email || '-'}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>{member.tier || 'basic'}</TableCell>
                        <TableCell>{member.status || 'active'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {parsedData.members.length === 0 && csvText && (
        <Alert variant="destructive">
          <AlertTitle>{t('errorFormatoCSV')}</AlertTitle>
          <AlertDescription>{t('errorFormatoCSVDescripcion')}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('instrucciones')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <h3 className="font-medium">{t('formatoCSV')}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{t('formatoCSVLinea1')}</li>
              <li>{t('formatoCSVLinea2')}</li>
              <li>{t('formatoCSVLinea3')}</li>
              <li>{t('formatoCSVLinea4')}</li>
            </ul>

            <h3 className="font-medium pt-4">{t('camposSoportados')}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Nombre</strong> / Name / FullName - {t('campoNombre')}</li>
              <li><strong>Email</strong> / Correo - {t('campoEmail')}</li>
              <li><strong>Telefono</strong> / Phone - {t('campoTelefono')}</li>
              <li><strong>Nivel</strong> / Tier - {t('campoNivel')}: basic, premium, founder</li>
              <li><strong>Estado</strong> / Status - {t('campoEstado')}: active, lapsed, churned</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
