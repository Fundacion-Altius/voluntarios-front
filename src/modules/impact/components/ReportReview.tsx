/**
 * ReportReview Component
 * 
 * A UI component for reviewing, approving, and rejecting impact reports.
 * Provides workflow actions with comments and status transitions.
 */

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Clock, Eye, History, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ReportReviewProps, ImpactReport, ReportStatus } from '../impactReportTypes';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Status colors and labels
const STATUS_CONFIG: Record<ReportStatus, { color: string; label: string; icon: React.ReactNode }> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: <Clock className="h-4 w-4" /> },
  review: { color: 'bg-blue-100 text-blue-800', label: 'In Review', icon: <Eye className="h-4 w-4" /> },
  approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: <CheckCircle className="h-4 w-4" /> },
  submitted: { color: 'bg-purple-100 text-purple-800', label: 'Submitted', icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: <XCircle className="h-4 w-4" /> },
};

// Available actions based on current status
const AVAILABLE_ACTIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ['review', 'rejected'],
  review: ['approved', 'rejected', 'draft'],
  approved: ['submitted', 'draft'],
  submitted: ['approved', 'rejected'],
  rejected: ['draft', 'review'],
};

// Action buttons configuration
const ACTION_BUTTONS: Record<string, { label: string; variant: 'default' | 'outline' | 'destructive' | 'secondary'; icon: React.ReactNode }> = {
  review: { label: 'Submit for Review', variant: 'default', icon: <Eye className="h-4 w-4" /> },
  approved: { label: 'Approve', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  submitted: { label: 'Submit', variant: 'default', icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: 'Reject', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  draft: { label: 'Save as Draft', variant: 'outline', icon: <Clock className="h-4 w-4" /> },
};

// Format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format version history
function formatChangeDescription(change: string): string {
  // Extract meaningful information from change description
  if (change.includes('Status changed')) {
    const match = change.match(/Status changed from (\w+) to (\w+)/);
    if (match) {
      return `Status: ${match[1]} → ${match[2]}`;
    }
  }
  return change;
}

export function ReportReview({ 
  report, 
  onApprove, 
  onReject, 
  onStatusChange,
  currentUserId 
}: ReportReviewProps) {
  const t = useTranslations('impact.reportReview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ReportStatus | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Get available actions for current status
  const availableActions = AVAILABLE_ACTIONS[report.status] || [];

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Handle action selection
  const handleActionSelect = (action: ReportStatus) => {
    setSelectedAction(action);
    setComments('');
    setError(null);
    setSuccess(null);
    setIsDialogOpen(true);
  };

  // Handle action submission
  const handleActionSubmit = async () => {
    if (!selectedAction) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (selectedAction === 'approved') {
        await onApprove(report.id, comments || undefined);
        setSuccess(t('reportApproved'));
      } else if (selectedAction === 'rejected') {
        if (!comments.trim()) {
          setError(t('commentsRequired'));
          setIsSubmitting(false);
          return;
        }
        await onReject(report.id, comments);
        setSuccess(t('reportRejected'));
      } else {
        await onStatusChange(report.id, selectedAction);
        setSuccess(t('statusUpdated'));
      }
      
      // Refresh the report after action
      setIsDialogOpen(false);
      setComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('actionFailed'));
      console.error('Error performing action:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user can perform actions (simplified - in production, check permissions)
  const canPerformActions = currentUserId === report.authorId || currentUserId === report.reviewerId;

  // Get status config
  const statusConfig = STATUS_CONFIG[report.status];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{report.name}</h2>
          <p className="text-muted-foreground mt-1">{report.description}</p>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.color} px-3 py-1`}>
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
          
          {/* Version */}
          <Badge variant="outline" className="text-xs">
            {t('version')} {report.version}
          </Badge>
        </div>
      </div>

      {/* Report Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('template')}</p>
              <p className="font-medium">{report.templateId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('funderType')}</p>
              <p className="font-medium capitalize">{report.funderType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('period')}</p>
              <p className="font-medium">{report.period.label}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('author')}</p>
              <p className="font-medium">{report.authorName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('created')}</p>
              <p className="font-medium">{formatDate(report.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('updated')}</p>
              <p className="font-medium">{formatDate(report.updatedAt)}</p>
            </div>
          </div>
          
          {report.submittedAt && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{t('submitted')}</p>
              <p className="font-medium">{formatDate(report.submittedAt)}</p>
            </div>
          )}
          
          {report.approvedAt && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{t('approved')}</p>
              <p className="font-medium">{formatDate(report.approvedAt)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('executiveSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h4 className="font-semibold">{report.executiveSummary.title}</h4>
            <p><strong>{t('period')}: </strong>{report.executiveSummary.period}</p>
            
            <h5 className="font-medium mt-4">{t('keyAchievements')}</h5>
            <ul className="list-disc pl-5">
              {report.executiveSummary.keyAchievements.map((achievement, index) => (
                <li key={index}>{achievement}</li>
              ))}
            </ul>
            
            <h5 className="font-medium mt-4">{t('keyMetrics')}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(report.executiveSummary.keyMetrics).map(([key, value]) => (
                <div key={key} className="border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">{key}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{t('reportSections')}</h3>
        
        {report.sections.map((section) => (
          <Collapsible key={section.id} open={expandedSections.has(section.id)}>
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection(section.id)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CardDescription>
                  {section.type !== 'custom' && (
                    <Badge variant="outline" className="text-xs">
                      {section.isRequired ? t('required') : t('optional')}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent>
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }} />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Version History */}
      {report.versionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('versionHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.versionHistory
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((version, index) => (
                  <div key={version.version} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{t('version')} {version.version}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatChangeDescription(version.changeDescription)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('by')} {version.changedBy} • {formatDate(version.timestamp)}
                        </p>
                      </div>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          {t('current')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Comments */}
      {report.rejectionComments && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>{t('rejectionComments')}</AlertTitle>
          <AlertDescription>{report.rejectionComments}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {canPerformActions && availableActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('actions')}</CardTitle>
            <CardDescription>{t('selectActionToPerform')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {availableActions.map((action) => {
                const actionConfig = ACTION_BUTTONS[action];
                return (
                  <Button
                    key={action}
                    variant={actionConfig.variant}
                    onClick={() => handleActionSelect(action)}
                    className="flex items-center gap-2"
                  >
                    {actionConfig.icon}
                    {actionConfig.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          setSelectedAction(null);
          setComments('');
          setError(null);
          setSuccess(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAction && ACTION_BUTTONS[selectedAction]?.label}
            </DialogTitle>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4">
              <AlertTitle>{t('success')}</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {selectedAction === 'rejected' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">{t('rejectionCommentsRequired')}</p>
              <Textarea
                placeholder={t('enterComments')}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
          )}
          
          {selectedAction && selectedAction !== 'rejected' && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">{t('optionalComments')}</p>
              <Textarea
                placeholder={t('enterComments')}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleActionSubmit} 
              disabled={isSubmitting || (selectedAction === 'rejected' && !comments.trim())}
              className="flex items-center gap-2"
            >
              {isSubmitting ? t('processing') : ACTION_BUTTONS[selectedAction || 'review']?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportReview;
