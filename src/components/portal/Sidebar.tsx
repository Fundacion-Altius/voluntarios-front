'use client';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarPrefs } from '@/components/navigation/SidebarPrefs';
import { GroupedNav } from '@/components/navigation/GroupedNav';
import { portalNavGroups } from './portalNav';

interface SidebarProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ userName, userEmail, onLogout, onNavigate }: SidebarProps) {
  const t = useTranslations('portal.nav');
  const tSide = useTranslations('portal.sidebar');
  const { pinned, groups } = portalNavGroups(tSide);

  return (
    <aside className="flex h-full min-h-0 w-64 flex-col border-r bg-card lg:h-screen">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/klaruk/symbol.svg" alt="" aria-hidden="true" className="size-8" />
        <span className="font-heading text-lg font-bold">{t('miPortal')}</span>
      </div>
      <GroupedNav pinned={pinned} groups={groups} ariaLabel={t('miPortal')} onNavigate={onNavigate} />
      <div className="border-t p-4">
        {userName && (
          <div className="mb-3 truncate">
            <p className="text-sm font-medium">{userName}</p>
            {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
          </div>
        )}
        <SidebarPrefs />
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-muted-foreground" onClick={onLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          {t('salir')}
        </Button>
      </div>
    </aside>
  );
}
