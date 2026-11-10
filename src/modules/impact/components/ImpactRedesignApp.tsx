'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  getCatalogItem,
  suggestForProfiles,
  type ImpactAdminView,
  type ImpactCatalogItem,
  type ImpactGuidedProfile,
  type ImpactIndicatorSelection,
  type TenantImpactConfig,
} from '@/modules/impact/catalog';
import { ImpactStepStrip } from '@/modules/impact/components/ImpactStepStrip';
import { PublicToggle, SourceBadge } from '@/modules/impact/components/SourceBadge';
import type { ImpactKpi } from '@/modules/impact/types';

const PROFILES: { id: ImpactGuidedProfile; ico: string }[] = [
  { id: 'direct_care', ico: '🍲' },
  { id: 'volunteering', ico: '🤝' },
  { id: 'advocacy', ico: '📣' },
  { id: 'network', ico: '🔗' },
];

type FilterChip = 'for_you' | 'outcome' | 'operation' | 'network' | 'fgps_entity' | 'fgps_project';

function formatKpiValue(kpi: ImpactKpi | undefined, manual?: number | null, unit?: string): string {
  if (manual != null && !Number.isNaN(manual)) {
    return unit ? `${manual} ${unit}` : String(manual);
  }
  if (!kpi) return '—';
  if (kpi.unit === '%') return `${kpi.value} %`;
  return String(kpi.value);
}

function resolveKpi(
  item: ImpactCatalogItem | undefined,
  kpis: ImpactKpi[],
): ImpactKpi | undefined {
  if (!item?.mapsToKpi) return undefined;
  return kpis.find((k) => k.key === item.mapsToKpi);
}

export function ImpactRedesignApp({
  config,
  catalog,
  kpis,
  loading,
  saving,
  error,
  canEdit,
  onSave,
  onManual,
}: {
  config: TenantImpactConfig | null;
  catalog: ImpactCatalogItem[];
  kpis: ImpactKpi[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  canEdit: boolean;
  onSave: (patch: Partial<TenantImpactConfig>) => Promise<TenantImpactConfig | null>;
  onManual: (body: {
    key: string;
    value: number;
    unit?: string;
    evidence?: string;
    isEstimate?: boolean;
    showOnPublicPage?: boolean;
  }) => Promise<TenantImpactConfig | null>;
}) {
  const t = useTranslations('admin.impact');
  const [view, setView] = useState<ImpactAdminView>('home');
  const [profiles, setProfiles] = useState<ImpactGuidedProfile[]>(['direct_care', 'network']);
  const [setupKey, setSetupKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterChip>('for_you');
  const [search, setSearch] = useState('');
  const [periodLabel] = useState('2026');
  const [manualForm, setManualForm] = useState({
    value: '',
    unit: '',
    evidence: '',
    isEstimate: false,
    showOnPublicPage: false,
  });

  const items = catalog.length ? catalog : [];
  const selected = config?.selected ?? [];
  const selectedKeys = new Set(selected.map((s) => s.key));

  const suggestions = useMemo(
    () => suggestForProfiles(profiles, 5),
    [profiles],
  );

  const sourceLabels = {
    automatic: t('source.automatic'),
    semiautomatic: t('source.semiautomatic'),
    entity_provided: t('source.entity_provided'),
  };

  const stepLabels = {
    stepOf: t('steps.of'),
    stepStart: t('steps.start'),
    stepMine: t('steps.mine'),
    stepPublic: t('steps.public'),
    stepPaths: t('steps.paths'),
  };

  const goSetup = (key: string) => {
    const sel = selected.find((s) => s.key === key);
    const item = getCatalogItem(key) ?? items.find((i) => i.key === key);
    setSetupKey(key);
    setManualForm({
      value: sel?.manualValue != null ? String(sel.manualValue) : '',
      unit: sel?.manualUnit ?? item?.unit ?? '',
      evidence: sel?.evidence ?? '',
      isEstimate: sel?.isEstimate ?? false,
      showOnPublicPage: sel?.showOnPublicPage ?? false,
    });
    setView('library-setup');
  };

  const toggleProfile = (id: ImpactGuidedProfile) => {
    setProfiles((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const applySuggestedSet = async () => {
    if (!canEdit) return;
    const next: ImpactIndicatorSelection[] = suggestions.map((item, idx) => ({
      key: item.key,
      showOnPublicPage: idx < 3,
    }));
    const saved = await onSave({ selected: next, guidedCompleted: true });
    if (saved) setView('library-mine');
  };

  const addIndicator = async (key: string) => {
    if (!canEdit || !config) return;
    if (selectedKeys.has(key)) {
      goSetup(key);
      return;
    }
    const next = [...selected, { key, showOnPublicPage: false }];
    const saved = await onSave({ selected: next, guidedCompleted: true });
    if (saved) goSetup(key);
  };

  const removeIndicator = async (key: string) => {
    if (!canEdit || !config) return;
    await onSave({ selected: selected.filter((s) => s.key !== key) });
  };

  const togglePublic = async (key: string) => {
    if (!canEdit || !config) return;
    await onSave({
      selected: selected.map((s) =>
        s.key === key ? { ...s, showOnPublicPage: !s.showOnPublicPage } : s,
      ),
    });
  };

  const saveSetup = async (then: ImpactAdminView) => {
    if (!canEdit || !setupKey) return;
    const item = getCatalogItem(setupKey) ?? items.find((i) => i.key === setupKey);
    const needsManual = item?.sourceType === 'entity_provided' || item?.sourceType === 'semiautomatic';
    if (needsManual && manualForm.value.trim() !== '') {
      const value = Number(manualForm.value);
      if (Number.isNaN(value)) return;
      const saved = await onManual({
        key: setupKey,
        value,
        unit: manualForm.unit || item?.unit,
        evidence: manualForm.evidence,
        isEstimate: manualForm.isEstimate,
        showOnPublicPage: manualForm.showOnPublicPage,
      });
      if (saved) setView(then);
      return;
    }
    if (!selectedKeys.has(setupKey)) {
      await onSave({
        selected: [
          ...selected,
          {
            key: setupKey,
            showOnPublicPage: manualForm.showOnPublicPage,
            isEstimate: manualForm.isEstimate,
          },
        ],
      });
    } else {
      await onSave({
        selected: selected.map((s) =>
          s.key === setupKey
            ? {
                ...s,
                showOnPublicPage: manualForm.showOnPublicPage,
                isEstimate: manualForm.isEstimate,
              }
            : s,
        ),
      });
    }
    setView(then);
  };

  const catalogFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedKeys.has(item.key) && filter === 'for_you') {
        /* still show */
      }
      if (filter === 'outcome' && item.layer !== 'outcome') return false;
      if (filter === 'operation' && item.layer !== 'operation') return false;
      if (filter === 'network' && item.layer !== 'network') return false;
      if (filter === 'fgps_entity' && item.fgpsScope !== 'entity') return false;
      if (filter === 'fgps_project' && item.fgpsScope !== 'project') return false;
      if (filter === 'for_you') {
        const score = item.profiles.filter((p) => profiles.includes(p)).length;
        if (score === 0 && profiles.length > 0) return false;
      }
      if (!q) return true;
      const label = t(`catalog.${item.key}.title`).toLowerCase();
      const why = t(`catalog.${item.key}.why`).toLowerCase();
      return label.includes(q) || why.includes(q) || item.key.includes(q);
    });
  }, [items, filter, search, profiles, selectedKeys, t]);

  if (loading || !config) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const readyCount = selected.filter((s) => {
    const item = getCatalogItem(s.key);
    if (!item) return false;
    if (item.sourceType === 'entity_provided') return s.manualValue != null;
    return true;
  }).length;
  const needCount = selected.length - readyCount;
  const publicCount = selected.filter((s) => s.showOnPublicPage).length;

  const outcomeKeys = selected.filter((s) => getCatalogItem(s.key)?.layer === 'outcome');
  const operationKeys = selected.filter((s) => getCatalogItem(s.key)?.layer !== 'outcome');

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {!canEdit && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {t('readOnlyNave')}
        </div>
      )}

      {view !== 'home' && (
        <ImpactStepStrip active={view} onGo={setView} labels={stepLabels} />
      )}

      {view === 'home' && (
        <section className="space-y-5">
          <header className="pr-10">
            <h1 className="text-2xl font-bold tracking-tight">{t('homeTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('homeSubtitle', {
                org: config.organizationName || t('yourOrg'),
              })}
            </p>
          </header>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex gap-1 rounded-md border border-border bg-muted/50 p-1">
              <span className="rounded-[5px] bg-card px-3 py-1.5 text-sm font-semibold text-primary shadow-sm">
                {periodLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setView('library-mine')}>
                {t('ctaMine')}
              </Button>
              <Button type="button" size="sm" onClick={() => setView('editor')}>
                {t('ctaEditPublic')}
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t('layerImpact')}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{t('layerImpactHint')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(outcomeKeys.length ? outcomeKeys : selected.slice(0, 2)).map((sel) => {
                const item = getCatalogItem(sel.key);
                const kpi = resolveKpi(item, kpis);
                return (
                  <div
                    key={sel.key}
                    className="flex min-h-24 flex-col gap-1 rounded-[10px] border border-primary/30 bg-gradient-to-b from-primary/10 to-card p-3.5"
                  >
                    <div className="text-[12.5px] font-semibold text-muted-foreground">
                      {t(`catalog.${sel.key}.title`)}
                    </div>
                    <div className="text-[26px] font-bold tracking-tight">
                      {formatKpiValue(kpi, sel.manualValue, sel.manualUnit)}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {item && <SourceBadge type={item.sourceType} labels={sourceLabels} />}
                      {(sel.isEstimate || kpi?.isEstimate) && (
                        <span className="rounded-[5px] border border-border bg-muted px-1.5 py-0.5 font-bold">
                          {t('estimated')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {selected.length === 0 && (
                <p className="text-sm text-muted-foreground sm:col-span-2">{t('emptyHome')}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t('layerOps')}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{t('layerOpsHint')}</p>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {(operationKeys.length ? operationKeys : selected.slice(2, 6)).map((sel) => {
                const item = getCatalogItem(sel.key);
                const kpi = resolveKpi(item, kpis);
                return (
                  <div
                    key={sel.key}
                    className="flex min-h-24 flex-col gap-1 rounded-[10px] border border-border bg-card p-3"
                  >
                    <div className="text-[12.5px] font-semibold text-muted-foreground">
                      {t(`catalog.${sel.key}.title`)}
                    </div>
                    <div className="text-[22px] font-bold tracking-tight">
                      {formatKpiValue(kpi, sel.manualValue, sel.manualUnit)}
                    </div>
                    {item && <SourceBadge type={item.sourceType} labels={sourceLabels} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
            {t('firstTime')}{' '}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setView('library-start')}
            >
              {t('ctaGuided')}
            </Button>
          </div>
        </section>
      )}

      {view === 'library-start' && (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{t('guidedTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('guidedSubtitle')}</p>
          </header>
          <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
            <h2 className="text-xl font-semibold">{t('guidedQuestion')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('guidedLead')}</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {PROFILES.map((p) => {
                const on = profiles.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProfile(p.id)}
                    className={[
                      'flex min-h-14 items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left',
                      on ? 'border-primary bg-primary/10' : 'border-border bg-card',
                    ].join(' ')}
                  >
                    <span className="text-xl">{p.ico}</span>
                    <span>
                      <strong className="block text-sm">{t(`profiles.${p.id}.title`)}</strong>
                      <span className="text-xs text-muted-foreground">
                        {t(`profiles.${p.id}.desc`)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3.5">
              <h3 className="mb-2 text-sm font-semibold">
                {t('guidedSuggest', { count: suggestions.length })}
              </h3>
              <div className="space-y-2">
                {suggestions.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div>
                      <strong className="text-sm">{t(`catalog.${item.key}.title`)}</strong>
                      <div className="text-xs text-muted-foreground">
                        {t(`catalog.${item.key}.why`)}
                      </div>
                    </div>
                    <SourceBadge type={item.sourceType} labels={sourceLabels} />
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-16 z-10 mt-4 flex gap-2 bg-background/95 py-2 lg:bottom-0">
              <Button type="button" variant="outline" onClick={() => setView('library-add')}>
                {t('seeMore')}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!canEdit || saving}
                onClick={() => void applySuggestedSet()}
              >
                {t('useThisSet')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {view === 'library-mine' && (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{t('mineTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('mineSubtitle')}</p>
          </header>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t('activeCount', { count: selected.length })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {needCount > 0 ? t('needsConfig', { count: needCount }) : t('allReady')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setView('library-add')}
                >
                  {t('addAnother')}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                  <b className="block text-lg">{readyCount}</b>
                  <span className="text-xs text-muted-foreground">{t('statReady')}</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                  <b className="block text-lg">{needCount}</b>
                  <span className="text-xs text-muted-foreground">{t('statNeed')}</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-2.5 text-center">
                  <b className="block text-lg">{publicCount}</b>
                  <span className="text-xs text-muted-foreground">{t('statPublic')}</span>
                </div>
              </div>

              {selected.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t('emptyMine')}{' '}
                  <button type="button" className="text-primary underline" onClick={() => setView('library-start')}>
                    {t('ctaGuided')}
                  </button>
                </div>
              )}

              {selected.map((sel) => {
                const item = getCatalogItem(sel.key);
                const kpi = resolveKpi(item, kpis);
                const needs =
                  item?.sourceType === 'entity_provided' && (sel.manualValue == null || sel.manualValue === undefined);
                return (
                  <div
                    key={sel.key}
                    className={[
                      'flex flex-col gap-3 rounded-[10px] border bg-card p-3.5 sm:flex-row sm:items-start sm:justify-between',
                      needs ? 'border-destructive/40' : 'border-border',
                    ].join(' ')}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{t(`catalog.${sel.key}.title`)}</div>
                      <div className="mt-1 text-2xl font-bold tracking-tight">
                        {formatKpiValue(kpi, sel.manualValue, sel.manualUnit)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {needs && (
                          <span className="rounded-[5px] bg-destructive/10 px-1.5 py-0.5 font-bold text-destructive">
                            {t('missingValue')}
                          </span>
                        )}
                        {item && <SourceBadge type={item.sourceType} labels={sourceLabels} />}
                        {item?.fgpsScope && (
                          <span>FGPS · {item.fgpsScope === 'entity' ? t('fgpsEntity') : t('fgpsProject')}</span>
                        )}
                      </div>
                      <PublicToggle
                        on={sel.showOnPublicPage}
                        disabled={!canEdit || saving}
                        label={t('showOnPublic')}
                        onToggle={() => void togglePublic(sel.key)}
                      />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" size="sm" onClick={() => goSetup(sel.key)}>
                        {needs ? t('configureNow') : t('viewDetail')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canEdit || saving}
                        onClick={() => void removeIndicator(sel.key)}
                      >
                        {t('remove')}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="sticky bottom-16 z-10 flex justify-between gap-2 bg-background/95 py-2 lg:bottom-0">
                <Button type="button" variant="outline" onClick={() => setView('library-add')}>
                  {t('addAnother')}
                </Button>
                <Button type="button" onClick={() => setView('editor')}>
                  {t('nextPublic')}
                </Button>
              </div>
            </div>
            <aside className="h-fit rounded-[10px] border border-border bg-muted/30 p-3.5">
              <h3 className="font-semibold">{t('howItGoes')}</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                <li>{t('help1')}</li>
                <li>{t('help2')}</li>
                <li>{t('help3')}</li>
              </ol>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setView('library-start')}
              >
                {t('repeatGuided')}
              </Button>
            </aside>
          </div>
        </section>
      )}

      {view === 'library-add' && (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{t('addTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('addSubtitle')}</p>
          </header>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="max-w-xl"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(
              [
                ['for_you', t('filter.forYou')],
                ['outcome', t('filter.outcome')],
                ['operation', t('filter.operation')],
                ['network', t('filter.network')],
                ['fgps_entity', t('filter.fgpsEntity')],
                ['fgps_project', t('filter.fgpsProject')],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={[
                  'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold',
                  filter === id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {catalogFiltered.map((item) => (
              <div
                key={item.key}
                className="flex flex-col gap-2 rounded-[10px] border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <strong>{t(`catalog.${item.key}.title`)}</strong>
                  <div className="text-sm text-muted-foreground">{t(`catalog.${item.key}.why`)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <SourceBadge type={item.sourceType} labels={sourceLabels} />
                    {item.fgpsScope && (
                      <span>· FGPS {item.fgpsScope === 'entity' ? t('fgpsEntity') : t('fgpsProject')}</span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canEdit || saving}
                  onClick={() => void addIndicator(item.key)}
                >
                  {selectedKeys.has(item.key) ? t('configureNow') : t('add')}
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => setView('library-mine')}>
            {t('backMine')}
          </Button>
        </section>
      )}

      {view === 'library-setup' && setupKey && (
        <section className="mx-auto max-w-xl space-y-4">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{t('setupTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('setupSubtitle')}</p>
          </header>
          {(() => {
            const item = getCatalogItem(setupKey) ?? items.find((i) => i.key === setupKey);
            if (!item) return <p>{t('unknownIndicator')}</p>;
            return (
              <>
                <div className="rounded-[10px] border border-border bg-gradient-to-b from-primary/10 to-card p-4">
                  <h2 className="text-xl font-semibold">{t(`catalog.${item.key}.title`)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`catalog.${item.key}.why`)}</p>
                </div>
                <div className="space-y-3 border-l-2 border-primary/30 pl-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        1
                      </span>
                      <strong>{t('setupWhat')}</strong>
                    </div>
                    <p className="pl-8 text-sm text-muted-foreground">{t(`catalog.${item.key}.measures`)}</p>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        2
                      </span>
                      <strong>{t('setupSource')}</strong>
                    </div>
                    <div className="ml-8 rounded-lg border border-border bg-card p-3">
                      <SourceBadge type={item.sourceType} labels={sourceLabels} />
                      <p className="mt-1 text-sm text-muted-foreground">{t(`sourceHint.${item.sourceType}`)}</p>
                    </div>
                  </div>
                  {(item.sourceType === 'entity_provided' || item.sourceType === 'semiautomatic') && (
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          3
                        </span>
                        <strong>{t('setupValue')}</strong>
                      </div>
                      <div className="ml-8 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="imp-val">{t('value')}</Label>
                            <Input
                              id="imp-val"
                              value={manualForm.value}
                              disabled={!canEdit}
                              onChange={(e) => setManualForm((f) => ({ ...f, value: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="imp-unit">{t('unit')}</Label>
                            <Input
                              id="imp-unit"
                              value={manualForm.unit}
                              disabled={!canEdit}
                              onChange={(e) => setManualForm((f) => ({ ...f, unit: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="imp-ev">{t('evidence')}</Label>
                          <Textarea
                            id="imp-ev"
                            value={manualForm.evidence}
                            disabled={!canEdit}
                            onChange={(e) => setManualForm((f) => ({ ...f, evidence: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={manualForm.isEstimate}
                            disabled={!canEdit}
                            onChange={(e) =>
                              setManualForm((f) => ({ ...f, isEstimate: e.target.checked }))
                            }
                          />
                          <strong>{t('markEstimate')}</strong>
                        </label>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        4
                      </span>
                      <strong>{t('setupPublic')}</strong>
                    </div>
                    <div className="ml-8">
                      <PublicToggle
                        on={manualForm.showOnPublicPage}
                        disabled={!canEdit}
                        label={t('showOnPublic')}
                        onToggle={() =>
                          setManualForm((f) => ({ ...f, showOnPublicPage: !f.showOnPublicPage }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!canEdit || saving}
                    onClick={() => void saveSetup('library-mine')}
                  >
                    {t('saveEntity')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canEdit || saving}
                    onClick={() => void saveSetup('editor')}
                  >
                    {t('saveAndPublic')}
                  </Button>
                </div>
              </>
            );
          })()}
        </section>
      )}

      {view === 'editor' && (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{t('editorTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('editorSubtitle')}</p>
          </header>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="space-y-3">
              <div className="rounded-[10px] border border-border bg-card p-3.5">
                <h2 className="font-semibold">{t('fromMine')}</h2>
                <p className="text-sm text-muted-foreground">{t('fromMineHint')}</p>
                <div className="mt-2 space-y-1.5">
                  {selected.filter((s) => s.showOnPublicPage).map((sel) => {
                    const item = getCatalogItem(sel.key);
                    const kpi = resolveKpi(item, kpis);
                    return (
                      <div
                        key={sel.key}
                        className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium"
                      >
                        {formatKpiValue(kpi, sel.manualValue, sel.manualUnit)} ·{' '}
                        {t(`catalog.${sel.key}.title`)}
                      </div>
                    );
                  })}
                  {publicCount === 0 && (
                    <p className="text-sm text-muted-foreground">{t('noPublicYet')}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setView('library-mine')}
                >
                  {t('changeSelection')}
                </Button>
              </div>
              <div className="space-y-2 rounded-[10px] border border-border bg-card p-3.5">
                <Label htmlFor="headline">{t('publicHeadline')}</Label>
                <Input
                  id="headline"
                  value={config.publicHeadline ?? ''}
                  disabled={!canEdit}
                  onChange={(e) =>
                    void onSave({ publicHeadline: e.target.value })
                  }
                  placeholder={t('publicHeadlinePlaceholder')}
                />
                <Label htmlFor="org">{t('organizationName')}</Label>
                <Input
                  id="org"
                  value={config.organizationName}
                  disabled={!canEdit}
                  onChange={(e) => void onSave({ organizationName: e.target.value })}
                />
              </div>
            </aside>
            <div className="rounded-[10px] border border-border bg-[#f6f5f1] p-4 text-[#1b1d2a] dark:bg-[#14151c] dark:text-[#eef0f7]">
              <div className="text-sm font-semibold text-primary">
                {config.organizationName || t('yourOrg')}
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {config.publicHeadline || t('defaultHeadline')}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{t('dataPeriod', { period: periodLabel })}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selected
                  .filter((s) => s.showOnPublicPage)
                  .map((sel) => {
                    const item = getCatalogItem(sel.key);
                    const kpi = resolveKpi(item, kpis);
                    return (
                      <div key={sel.key} className="rounded-lg border border-border bg-card p-3">
                        <div className="text-xl font-bold">
                          {formatKpiValue(kpi, sel.manualValue, sel.manualUnit)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t(`catalog.${sel.key}.publicLine`)}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{t('methodNote')}</span>
                <span className="font-semibold text-primary">{t('madeWithKlaruk')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setView('library-mine')}>
              {t('backMine')}
            </Button>
            <Button type="button" onClick={() => setView('paths')}>
              {t('nextPaths')}
            </Button>
          </div>
        </section>
      )}

      {view === 'paths' && (
        <section className="space-y-4">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{t('pathsTitle')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('pathsSubtitle')}</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] border border-border bg-card p-4">
              <h3 className="font-semibold">{t('pathComm')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('pathCommDesc')}</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/admin/impacto/communication">{t('createSocialCard')}</Link>
              </Button>
            </div>
            <div className="rounded-[10px] border border-border bg-card p-4">
              <h3 className="font-semibold">{t('pathExport')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('pathExportDesc')}</p>
              <Button asChild size="sm" variant="secondary" className="mt-3">
                <Link href="/admin/impacto/communication">{t('exportMemory')}</Link>
              </Button>
            </div>
          </div>
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t('rolesNote')}
          </p>
          <Button type="button" variant="outline" onClick={() => setView('home')}>
            {t('backHome')}
          </Button>
        </section>
      )}
    </div>
  );
}
