'use client';

import { useTranslations } from 'next-intl';
import { CollapsibleSidebarShell } from '@/components/navigation/CollapsibleSidebarShell';
import { GroupedNav } from '@/components/navigation/GroupedNav';
import { adminNavGroups } from './adminNav';

interface AdminSidebarProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onNavigate?: () => void;
  /** Group to open first (used by the mobile "Voluntariado" tab). */
  initialGroup?: string;
}

export default function AdminSidebar({ userName, userEmail, onLogout, onNavigate, initialGroup }: AdminSidebarProps) {
  const t = useTranslations('admin.sidebar');
  const tNav = useTranslations('admin.nav');
  const { pinned, groups } = adminNavGroups(t);

  return (
    <CollapsibleSidebarShell
      title={t('title')}
      collapseLabel={t('collapse')}
      expandLabel={t('expand')}
      logoutLabel={tNav('salir')}
      userName={userName}
      userEmail={userEmail}
      onLogout={onLogout}
    >
      {(collapsed) => (
        <GroupedNav
          pinned={pinned}
          groups={groups}
          initialGroup={initialGroup}
          ariaLabel={t('title')}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      )}
    </CollapsibleSidebarShell>
  );
}
