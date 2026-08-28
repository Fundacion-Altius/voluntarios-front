'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, Loader2 } from 'lucide-react';
import type {
  SocialMediaPlatform,
  SocialMediaCardOutput,
  AnnualReportOutput,
  PressReleaseOutput,
  CommunicationResponse,
} from '@/modules/impact/types';
import { getApiBaseUrl } from '@/lib/apiUrl';

const PLATFORMS: { value: SocialMediaPlatform; label: string }[] = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
];

export default function AdminImpactCommunicationPage() {
  const t = useTranslations('admin.impact.communication');
  const [activeTab, setActiveTab] = useState('social-media');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Social Media Card state
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<SocialMediaPlatform>('linkedin');
  const [socialMediaPeriod, setSocialMediaPeriod] = useState('all-time');
  const [socialMediaTitle, setSocialMediaTitle] = useState('');
  const [socialMediaSubtitle, setSocialMediaSubtitle] = useState('');
  const [socialMediaResult, setSocialMediaResult] = useState<SocialMediaCardOutput | null>(null);
  
  // Annual Report state
  const [annualReportPeriod, setAnnualReportPeriod] = useState('all-time');
  const [organizationName, setOrganizationName] = useState('Nuestra Organización');
  const [introduction, setIntroduction] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [annualReportResult, setAnnualReportResult] = useState<AnnualReportOutput | null>(null);
  
  // Press Release state
  const [pressReleasePeriod, setPressReleasePeriod] = useState('all-time');
  const [pressOrganizationName, setPressOrganizationName] = useState('Nuestra Organización');
  const [milestone, setMilestone] = useState('10,000 horas de voluntariado');
  const [contactEmail, setContactEmail] = useState('prensa@organizacion.org');
  const [contactPhone, setContactPhone] = useState('');
  const [pressReleaseResult, setPressReleaseResult] = useState<PressReleaseOutput | null>(null);

  // Fetch KPI data for preview
  const [kpiPreview, setKpiPreview] = useState<{key: string; value: string; displayName: string}[]>([]);
  
  useEffect(() => {
    async function fetchKpis() {
      try {
        const apiUrl = getApiBaseUrl();
        const response = await fetch(`${apiUrl}/api/impact/kpis?period=all-time`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const previewData = data.data.map((kpi: any) => ({
              key: kpi.key,
              value: kpi.value.toLocaleString(),
              displayName: getKpiDisplayName(kpi.key),
            }));
            setKpiPreview(previewData);
          }
        }
      } catch {
        // Silently fail - preview is optional
      }
    }
    fetchKpis();
  }, []);

  function getKpiDisplayName(key: string): string {
    const displayNames: Record<string, string> = {
      volunteer_hours_total: 'Horas de voluntariado',
      people_served_estimated: 'Personas atendidas (estimado)',
      volunteer_retention_rate: 'Tasa de retención de voluntarios',
      community_satisfaction: 'Satisfacción de la comunidad',
      volunteer_growth_rate: 'Crecimiento de voluntarios',
    };
    return displayNames[key] || key;
  }

  async function generateSocialMediaCard() {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiBaseUrl();
      const params = new URLSearchParams({
        platform: socialMediaPlatform,
        period: socialMediaPeriod,
      });
      
      if (socialMediaTitle) params.append('title', socialMediaTitle);
      if (socialMediaSubtitle) params.append('subtitle', socialMediaSubtitle);
      
      const response = await fetch(`${apiUrl}/api/impact/communication/social-media-card?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }
      
      const data: CommunicationResponse<SocialMediaCardOutput> = await response.json();
      
      if (data.success && data.data) {
        setSocialMediaResult(data.data);
      } else {
        setError(data.error || 'Failed to generate card');
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  async function generateAnnualReport() {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiBaseUrl();
      const params = new URLSearchParams({
        period: annualReportPeriod,
        organizationName,
      });
      
      if (introduction) params.append('introduction', introduction);
      if (conclusion) params.append('conclusion', conclusion);
      
      const response = await fetch(`${apiUrl}/api/impact/communication/annual-report?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }
      
      const data: CommunicationResponse<AnnualReportOutput> = await response.json();
      
      if (data.success && data.data) {
        setAnnualReportResult(data.data);
      } else {
        setError(data.error || 'Failed to generate annual report');
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  async function generatePressRelease() {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = getApiBaseUrl();
      const params = new URLSearchParams({
        period: pressReleasePeriod,
        organizationName: pressOrganizationName,
        milestone,
        contactEmail,
      });
      
      if (contactPhone) params.append('contactPhone', contactPhone);
      
      const response = await fetch(`${apiUrl}/api/impact/communication/press-release?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }
      
      const data: CommunicationResponse<PressReleaseOutput> = await response.json();
      
      if (data.success && data.data) {
        setPressReleaseResult(data.data);
      } else {
        setError(data.error || 'Failed to generate press release');
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function downloadText(text: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'social-media' ? 'default' : 'outline'}
          onClick={() => setActiveTab('social-media')}
        >
          {t('socialMediaCard')}
        </Button>
        <Button
          variant={activeTab === 'annual-report' ? 'default' : 'outline'}
          onClick={() => setActiveTab('annual-report')}
        >
          {t('annualReport')}
        </Button>
        <Button
          variant={activeTab === 'press-release' ? 'default' : 'outline'}
          onClick={() => setActiveTab('press-release')}
        >
          {t('pressRelease')}
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Social Media Card Section */}
      {activeTab === 'social-media' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('socialMediaCard')}</CardTitle>
              <CardDescription>{t('socialMediaCardDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="social-platform">{t('platform')}</Label>
                  <Select
                    value={socialMediaPlatform}
                    onValueChange={(value) => setSocialMediaPlatform(value as SocialMediaPlatform)}
                  >
                    <SelectTrigger id="social-platform">
                      <SelectValue placeholder={t('selectPlatform')} />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-period">{t('period')}</Label>
                  <Input
                    id="social-period"
                    value={socialMediaPeriod}
                    onChange={(e) => setSocialMediaPeriod(e.target.value)}
                    placeholder="all-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-title">{t('title')}</Label>
                  <Input
                    id="social-title"
                    value={socialMediaTitle}
                    onChange={(e) => setSocialMediaTitle(e.target.value)}
                    placeholder={t('cardTitlePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-subtitle">{t('subtitle')}</Label>
                  <Input
                    id="social-subtitle"
                    value={socialMediaSubtitle}
                    onChange={(e) => setSocialMediaSubtitle(e.target.value)}
                    placeholder={t('cardSubtitlePlaceholder')}
                  />
                </div>
              </div>
              
              <Button onClick={generateSocialMediaCard} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('generate')}
              </Button>

              {socialMediaResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{t('result')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <pre className="text-sm overflow-auto">
                        {socialMediaResult.mimeType === 'application/json' 
                          ? JSON.stringify(JSON.parse(socialMediaResult.image), null, 2)
                          : t('imageGenerated')}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(socialMediaResult.image)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {t('copy')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText(
                          socialMediaResult.image,
                          socialMediaResult.filename,
                          socialMediaResult.mimeType
                        )}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('download')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
      )}

      {/* Annual Report Section */}
      {activeTab === 'annual-report' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('annualReport')}</CardTitle>
              <CardDescription>{t('annualReportDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-period">{t('period')}</Label>
                  <Input
                    id="report-period"
                    value={annualReportPeriod}
                    onChange={(e) => setAnnualReportPeriod(e.target.value)}
                    placeholder="all-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-name">{t('organizationName')}</Label>
                  <Input
                    id="org-name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={t('organizationNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="introduction">{t('introduction')}</Label>
                  <Textarea
                    id="introduction"
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    placeholder={t('introductionPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="conclusion">{t('conclusion')}</Label>
                  <Textarea
                    id="conclusion"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder={t('conclusionPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
              
              <Button onClick={generateAnnualReport} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('generate')}
              </Button>

              {annualReportResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{t('result')}</CardTitle>
                    <CardDescription>
                      {t('wordCount')}: {annualReportResult.wordCount}, {t('charCount')}: {annualReportResult.characterCount}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50 whitespace-pre-wrap">
                      {annualReportResult.text}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(annualReportResult.text)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {t('copy')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText(
                          annualReportResult.text,
                          `informe-anual-${annualReportPeriod}.txt`,
                          'text/plain'
                        )}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('download')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
      )}

      {/* Press Release Section */}
      {activeTab === 'press-release' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('pressRelease')}</CardTitle>
              <CardDescription>{t('pressReleaseDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="press-period">{t('period')}</Label>
                  <Input
                    id="press-period"
                    value={pressReleasePeriod}
                    onChange={(e) => setPressReleasePeriod(e.target.value)}
                    placeholder="all-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="press-org-name">{t('organizationName')}</Label>
                  <Input
                    id="press-org-name"
                    value={pressOrganizationName}
                    onChange={(e) => setPressOrganizationName(e.target.value)}
                    placeholder={t('organizationNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="milestone">{t('milestone')}</Label>
                  <Input
                    id="milestone"
                    value={milestone}
                    onChange={(e) => setMilestone(e.target.value)}
                    placeholder={t('milestonePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">{t('contactEmail')}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t('contactEmailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{t('contactPhone')}</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={t('contactPhonePlaceholder')}
                  />
                </div>
              </div>
              
              <Button onClick={generatePressRelease} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('generate')}
              </Button>

              {pressReleaseResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{pressReleaseResult.title}</CardTitle>
                    <CardDescription>{pressReleaseResult.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/50 whitespace-pre-wrap">
                      <h3 className="font-semibold mb-2">{pressReleaseResult.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{pressReleaseResult.subtitle}</p>
                      
                      {pressReleaseResult.body.map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                      
                      <hr className="my-4" />
                      
                      <p className="text-sm italic">{pressReleaseResult.boilerplate}</p>
                      <p className="text-sm mt-4">{pressReleaseResult.contactInfo}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(pressReleaseResult.text)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {t('copy')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText(
                          pressReleaseResult.text,
                          `comunicado-prensa-${pressReleasePeriod}.txt`,
                          'text/plain'
                        )}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('download')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
      )}

      {/* KPI Preview */}
      {kpiPreview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('currentKpis')}</CardTitle>
            <CardDescription>{t('currentKpisDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {kpiPreview.map((kpi) => (
                <div key={kpi.key} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{kpi.displayName}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
