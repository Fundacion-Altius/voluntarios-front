'use client';

import { useTranslations } from 'next-intl';
import { CollapsibleSidebarShell } from '@/components/navigation/CollapsibleSidebarShell';
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
    <CollapsibleSidebarShell
      title={t('miPortal')}
      collapseLabel={tSide('collapse')}
      expandLabel={tSide('expand')}
      logoutLabel={t('salir')}
      userName={userName}
      userEmail={userEmail}
      onLogout={onLogout}
    >
      {(collapsed) => (
        <GroupedNav
          pinned={pinned}
          groups={groups}
          ariaLabel={t('miPortal')}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      )}
    </CollapsibleSidebarShell>
  );
}
