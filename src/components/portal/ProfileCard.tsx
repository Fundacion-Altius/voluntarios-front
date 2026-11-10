'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/apiUrl';

const API_URL = getApiBaseUrl();

export interface Profile {
  level: string;
  totalPoints: number;
  weekPoints: number;
  currentStreak: number;
  badges: { id: string; badge_type: string }[];
}

function levelBadgeClass(level: string): string {
  const map: Record<string, string> = {
    bronze: 'bg-amber-700 text-white',
    silver: 'bg-gray-400 text-white',
    gold: 'bg-yellow-500 text-white',
    diamond: 'bg-blue-500 text-white',
  };
  return map[level] || '';
}

function levelLabel(level: string, t: any): string {
  const map: Record<string, string> = {
    bronze: t('bronce'), silver: t('plata'), gold: t('oro'), diamond: t('diamante'),
  };
  return map[level] || level;
}

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const t = useTranslations('portal.home');

  const handleCertificate = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/certificate`, { credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {}
  }, []);

  const handleShareCard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/gamification/share-card`, { credentials: 'include' });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {}
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>{t('miPerfil')}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('nivel')}</p>
            <Badge className={levelBadgeClass(profile.level)}>{levelLabel(profile.level, t)}</Badge>
          </div>
          <div><p className="text-xs text-muted-foreground">{t('puntosTotales')}</p><p className="text-lg font-bold">{profile.totalPoints}</p></div>
          <div><p className="text-xs text-muted-foreground">{t('puntosSemana')}</p><p className="text-lg font-bold">{profile.weekPoints}</p></div>
          <div><p className="text-xs text-muted-foreground">{t('racha')}</p><p className="text-lg font-bold">{profile.currentStreak} {t('semanas')}</p></div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={handleCertificate}>{t('descargarCertificado')}</Button>
          <Button size="sm" variant="outline" onClick={handleShareCard}>{t('compartirTarjeta')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}