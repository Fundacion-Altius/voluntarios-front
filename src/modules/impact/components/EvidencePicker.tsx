/**
 * EvidencePicker Component
 * 
 * A UI component for selecting and attaching evidence to impact report sections.
 * Provides a searchable catalog of available evidence from across the platform.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Paperclip, X, CheckCircle, FileText, Image, Award, ChartBar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { EvidencePickerProps, EvidenceCatalogEntry, EvidenceType } from '../impactReportTypes';

// API base URL - should match backend configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Evidence type icons and colors
const EVIDENCE_TYPE_CONFIG: Record<EvidenceType, { icon: React.ReactNode; color: string; label: string }> = {
  document: { icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', label: 'Document' },
  image: { icon: <Image className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800', label: 'Image' },
  certificate: { icon: <Award className="h-4 w-4" />, color: 'bg-green-100 text-green-800', label: 'Certificate' },
  survey_result: { icon: <ChartBar className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800', label: 'Survey Result' },
  contract_summary: { icon: <FileText className="h-4 w-4" />, color: 'bg-red-100 text-red-800', label: 'Contract Summary' },
  member_statistics: { icon: <Users className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800', label: 'Member Statistics' },
};

// File size formatting
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Date formatting
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function EvidencePicker({ 
  reportId, 
  onEvidenceSelected, 
  selectedEvidenceIds = [],
  sectionId 
}: EvidencePickerProps) {
  const t = useTranslations('impact.evidencePicker');
  const [isOpen, setIsOpen] = useState(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceCatalogEntry[]>([]);
  const [filteredEvidence, setFilteredEvidence] = useState<EvidenceCatalogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<EvidenceType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch evidence catalog from API
  const fetchEvidenceCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/impact/impact-reports/evidence/catalog`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch evidence catalog: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setEvidenceList(data.data);
        setFilteredEvidence(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence catalog');
      console.error('Error fetching evidence catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter evidence based on search, tags, and type
  useEffect(() => {
    let filtered = evidenceList;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (evidence) => 
          evidence.name.toLowerCase().includes(query) ||
          evidence.description.toLowerCase().includes(query) ||
          evidence.source.toLowerCase().includes(query) ||
          evidence.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(
        (evidence) => selectedTags.some(tag => evidence.tags.includes(tag))
      );
    }
    
    // Filter by evidence type
    if (selectedType !== 'all') {
      filtered = filtered.filter((evidence) => evidence.type === selectedType);
    }
    
    setFilteredEvidence(filtered);
  }, [searchQuery, selectedTags, selectedType, evidenceList]);

  // Fetch evidence on component mount
  useEffect(() => {
    if (isOpen) {
      fetchEvidenceCatalog();
    }
  }, [isOpen, fetchEvidenceCatalog]);

  // Get all unique tags from evidence
  const allTags = Array.from(new Set(evidenceList.flatMap(e => e.tags)));

  // Handle evidence selection
  const handleSelectEvidence = (evidence: EvidenceCatalogEntry) => {
    onEvidenceSelected(evidence);
    setIsOpen(false);
  };

  // Check if evidence is already selected
  const isSelected = (evidenceId: string) => selectedEvidenceIds.includes(evidenceId);

  // Extract unique evidence types for tabs
  const evidenceTypes: EvidenceType[] = ['document', 'image', 'certificate', 'survey_result', 'contract_summary', 'member_statistics'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          <Paperclip className="h-4 w-4 mr-2" />
          {t('selectEvidence')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('selectEvidenceForReport')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchEvidence')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Tabs */}
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as EvidenceType | 'all')}>
            <TabsList className="grid grid-cols-7 h-8">
              <TabsTrigger value="all" className="text-xs">{t('all')}</TabsTrigger>
              {evidenceTypes.map((type) => (
                <TabsTrigger key={type} value={type} className="text-xs">
                  {EVIDENCE_TYPE_CONFIG[type].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 10).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    const newTags = selectedTags.includes(tag)
                      ? selectedTags.filter(t => t !== tag)
                      : [...selectedTags, tag];
                    setSelectedTags(newTags);
                  }}
                >
                  {tag}
                </Badge>
              ))}
              {allTags.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{allTags.length - 10} {t('more')}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Evidence List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noEvidenceFound')}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredEvidence.map((evidence) => {
                const config = EVIDENCE_TYPE_CONFIG[evidence.type];
                return (
                  <Card
                    key={evidence.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${isSelected(evidence.id) ? 'border-primary' : ''}`}
                    onClick={() => handleSelectEvidence(evidence)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              {config.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{evidence.name}</h3>
                              <p className="text-xs text-muted-foreground">{evidence.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(evidence.createdAt)}</span>
                            <span>•</span>
                            <span>{formatFileSize(evidence.fileInfo.size)}</span>
                            <span>•</span>
                            <span className="capitalize">{evidence.type.replace('_', ' ')}</span>
                          </div>
                          
                          {evidence.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {evidence.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {evidence.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{evidence.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {isSelected(evidence.id) && (
                          <div className="p-2 text-primary">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EvidencePicker;
