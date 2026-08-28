'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/app/auth/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, DollarSign, FileText, CheckCircle, XCircle, Clock, Upload, Trash2, Edit, Eye, Download } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Grant, GrantDocument, GrantDocumentType, GrantStatus, GrantType } from '@/types/grant';
import { grantApi, grantDocumentApi, grantJustificationApi } from '@/lib/api/grantApi';
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, VALID_STATUS_TRANSITIONS } from '@/types/grant';

export default function GrantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('admin.grantDetail');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [grant, setGrant] = useState<Grant | null>(null);
  const [documents, setDocuments] = useState<GrantDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justificationStatus, setJustificationStatus] = useState<{
    is_ready: boolean;
    missing_documents: GrantDocumentType[];
    completed_documents: GrantDocumentType[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<GrantDocumentType>('application');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const resolvedParams = useState(params).value;
  const grantId = resolvedParams?.id || '';

  // Fetch grant details
  const fetchGrant = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await grantApi.getById(grantId);
      
      if (response.success && response.data) {
        setGrant(response.data);
      } else {
        setError(response.error || t('errorLoadingGrant'));
        setGrant(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoadingGrant'));
      setGrant(null);
    } finally {
      setIsLoading(false);
    }
  }, [grantId, t]);

  // Fetch grant documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await grantDocumentApi.getByGrantId(grantId);
      
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, [grantId]);

  // Fetch justification status
  const fetchJustificationStatus = useCallback(async () => {
    try {
      const response = await grantJustificationApi.getStatus(grantId);
      
      if (response.success && response.data) {
        setJustificationStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching justification status:', err);
    }
  }, [grantId]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchGrant(),
      fetchDocuments(),
      fetchJustificationStatus(),
    ]);
  }, [fetchGrant, fetchDocuments, fetchJustificationStatus]);

  // Initial data fetch
  useEffect(() => {
    if (grantId) {
      fetchAllData();
    }
  }, [grantId, fetchAllData]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  // Handle document upload
  const handleUpload = useCallback(async () => {
    if (!file || !grantId) return;
    
    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      
      const response = await grantDocumentApi.upload(grantId, file, documentType, user?.id);
      
      if (response.success && response.data) {
        setUploadSuccess(t('uploadSuccess'));
        setFile(null);
        setDocumentType('application');
        await fetchDocuments();
        await fetchJustificationStatus();
      } else {
        setUploadError(response.error || tCommon('error'));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setUploading(false);
    }
  }, [file, grantId, documentType, user?.id, t, tCommon, fetchDocuments, fetchJustificationStatus]);

  // Handle status update
  const handleStatusUpdate = useCallback(async (newStatus: GrantStatus) => {
    if (!grantId || !grant) return;
    
    try {
      setActionLoading('status');
      
      const response = await grantApi.updateStatus(grantId, newStatus);
      
      if (response.success && response.data) {
        setGrant(response.data);
      } else {
        setError(response.error || t('errorUpdatingStatus'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorUpdatingStatus'));
    } finally {
      setActionLoading(null);
    }
  }, [grantId, grant, t]);

  // Handle mark as ready
  const handleMarkAsReady = useCallback(async () => {
    if (!grantId) return;
    
    try {
      setActionLoading('justification');
      
      const response = await grantJustificationApi.markReady(grantId);
      
      if (response.success) {
        await fetchJustificationStatus();
      } else {
        setError(response.error || t('errorMarkingReady'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorMarkingReady'));
    } finally {
      setActionLoading(null);
    }
  }, [grantId, t, fetchJustificationStatus]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!grantId || !grant) return;
    
    if (!confirm(t('deleteConfirm'))) return;
    
    try {
      setActionLoading('delete');
      
      const response = await grantApi.delete(grantId);
      
      if (response.success) {
        router.push('/admin/grants');
      } else {
        setError(response.error || t('deleteError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setActionLoading(null);
    }
  }, [grantId, grant, t, router]);

  // Handle document download
  const handleDownload = useCallback(async (documentId: string) => {
    try {
      const blob = await grantDocumentApi.download(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documents.find(d => d.id === documentId)?.filename || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [documents, tCommon]);

  // Handle document delete
  const handleDeleteDocument = useCallback(async (documentId: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    
    try {
      const response = await grantDocumentApi.delete(documentId);
      
      if (response.success) {
        await fetchDocuments();
        await fetchJustificationStatus();
      } else {
        setError(response.error || tCommon('error'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    }
  }, [tCommon, fetchDocuments, fetchJustificationStatus]);

  // Get available status transitions
  const getAvailableStatuses = useCallback(() => {
    if (!grant) return [];
    return VALID_STATUS_TRANSITIONS[grant.status as GrantStatus] || [];
  }, [grant]);

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '€0';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Get document type label
  const getDocumentTypeLabel = (type: GrantDocumentType) => {
    const labels: Record<GrantDocumentType, string> = {
      application: tCommon('application'),
      justification: tCommon('justification'),
      report: tCommon('report'),
      receipt: tCommon('receipt'),
      other: tCommon('other'),
    };
    return labels[type] || type;
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

  if (!isAuthenticated) {
    return <div>{tCommon('notAuthenticated')}</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !grant) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/grants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToList')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!grant) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-600">{t('grantNotFound')}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/grants')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToList')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/grants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToList')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('title')}: {grant.name}</h1>
          <p className="text-muted-foreground">{grant.funding_body}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge className={STATUS_COLORS[grant.status as GrantStatus]}>
          {STATUS_LABELS[grant.status as GrantStatus]}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {TYPE_LABELS[grant.type as GrantType]}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {uploadSuccess && (
        <Alert variant="success">
          <AlertDescription>{uploadSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Upload error */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('basicInfo')}</CardTitle>
            <CardDescription>{t('grantInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('status')}</p>
              <Badge className={STATUS_COLORS[grant.status as GrantStatus]}>
                {STATUS_LABELS[grant.status as GrantStatus]}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('type')}</p>
              <p>{TYPE_LABELS[grant.type as GrantType]}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('amount')}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(grant.amount)}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('fundingBody')}</p>
              <p>{grant.funding_body}</p>
            </div>
          </CardContent>
        </Card>

        {/* Important Dates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dates')}</CardTitle>
            <CardDescription>{t('importantDatesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('applicationDate')}</p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(grant.application_date)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('deadline')}</p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(grant.deadline)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('resolutionDate')}</p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(grant.resolution_date)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Justification Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('justification')}</CardTitle>
            <CardDescription>{t('justificationDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {justificationStatus ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t('justificationStatus')}</p>
                  <Badge variant={justificationStatus.is_ready ? 'default' : 'secondary'}>
                    {justificationStatus.is_ready ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                    )}
                    {justificationStatus.is_ready ? t('ready') : t('notReady')}
                  </Badge>
                </div>
                
                {!justificationStatus.is_ready && justificationStatus.missing_documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{t('missingDocuments')}</p>
                    <div className="flex flex-wrap gap-2">
                      {justificationStatus.missing_documents.map(docType => (
                        <Badge key={docType} variant="destructive">
                          {getDocumentTypeLabel(docType)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  size="sm"
                  onClick={handleMarkAsReady}
                  disabled={actionLoading === 'justification' || !justificationStatus.is_ready}
                >
                  {actionLoading === 'justification' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      {tCommon('loading')}
                    </>
                  ) : (
                    t('markAsReady')
                  )}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('documents')}</CardTitle>
          <CardDescription>{t('documentsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Upload */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">{t('uploadDocument')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{tCommon('type')}</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as GrantDocumentType)}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading}
                >
                  <option value="application">{tCommon('application')}</option>
                  <option value="justification">{tCommon('justification')}</option>
                  <option value="report">{tCommon('report')}</option>
                  <option value="receipt">{tCommon('receipt')}</option>
                  <option value="other">{tCommon('other')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{tCommon('file')}</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      {tCommon('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {tCommon('upload')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Documents List */}
          {documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('type')}</TableHead>
                  <TableHead>{tCommon('filename')}</TableHead>
                  <TableHead>{tCommon('version')}</TableHead>
                  <TableHead>{tCommon('uploadedBy')}</TableHead>
                  <TableHead>{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="outline">{getDocumentTypeLabel(doc.type as GrantDocumentType)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{doc.filename}</TableCell>
                    <TableCell>v{doc.version}</TableCell>
                    <TableCell>{doc.uploaded_by || 'N/A'}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <AlertDescription>{t('noDocuments')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status Transition Actions */}
      {getAvailableStatuses().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('actions')}</CardTitle>
            <CardDescription>{t('statusTransitionDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {getAvailableStatuses().map(status => (
              <Button
                key={status}
                variant="outline"
                onClick={() => handleStatusUpdate(status)}
                disabled={actionLoading === 'status'}
              >
                {actionLoading === 'status' ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {tCommon('loading')}
                  </>
                ) : (
                  <>
                    {STATUS_LABELS[status as GrantStatus]}
                  </>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delete Action */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dangerZone')}</CardTitle>
          <CardDescription>{t('dangerZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading === 'delete'}
          >
            {actionLoading === 'delete' ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {tCommon('loading')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
