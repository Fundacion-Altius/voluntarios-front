'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SidebarPrefs } from '@/components/navigation/SidebarPrefs';
import { GroupedNav } from '@/components/navigation/GroupedNav';
import { cn } from '@/lib/utils';
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
  const [collapsed, setCollapsed] = useState(false);
  const { pinned, groups } = adminNavGroups(t);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-full min-h-0 flex-col overflow-hidden border-r bg-card transition-[width] duration-200 lg:h-screen',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <SidebarHeader
          collapsed={collapsed}
          title={t('title')}
          collapseLabel={t('collapse')}
          expandLabel={t('expand')}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <GroupedNav
          pinned={pinned}
          groups={groups}
          initialGroup={initialGroup}
          ariaLabel={t('title')}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <SidebarFooter
          collapsed={collapsed}
          userName={userName}
          userEmail={userEmail}
          logoutLabel={tNav('salir')}
          onLogout={onLogout}
        />
      </aside>
    </TooltipProvider>
  );
}

interface SidebarHeaderProps {
  collapsed: boolean;
  title: string;
  collapseLabel: string;
  expandLabel: string;
  onToggle: () => void;
}

function SidebarHeader({ collapsed, title, collapseLabel, expandLabel, onToggle }: SidebarHeaderProps) {
  const logo = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/klaruk/symbol.svg" alt="" aria-hidden="true" className="size-8 shrink-0 dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/klaruk/symbol-dark.svg" alt="" aria-hidden="true" className="hidden size-8 shrink-0 dark:block" />
    </>
  );

  return (
    <div
      className={cn(
        'flex items-center border-b py-4',
        collapsed ? 'flex-col gap-2 px-2' : 'gap-2 px-5',
      )}
    >
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center">{logo}</span>
          </TooltipTrigger>
          <TooltipContent side="right">{title}</TooltipContent>
        </Tooltip>
      ) : (
        <>
          {logo}
          <span className="font-heading text-lg font-bold">{title}</span>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(!collapsed && 'ml-auto')}
        aria-expanded={!collapsed}
        aria-label={collapsed ? expandLabel : collapseLabel}
        onClick={onToggle}
      >
        <PanelLeft className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

interface SidebarFooterProps {
  collapsed: boolean;
  userName?: string;
  userEmail?: string;
  logoutLabel: string;
  onLogout: () => void;
}

function SidebarFooter({ collapsed, userName, userEmail, logoutLabel, onLogout }: SidebarFooterProps) {
  return (
    <div className={cn('border-t', collapsed ? 'p-2' : 'p-4')}>
      {!collapsed && userName && (
        <div className="mb-3 truncate">
          <p className="text-sm font-medium">{userName}</p>
          {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
        </div>
      )}
      <SidebarPrefs />
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="w-full justify-center text-muted-foreground"
              aria-label={logoutLabel}
              onClick={onLogout}
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{logoutLabel}</TooltipContent>
        </Tooltip>
      ) : (
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-muted-foreground" onClick={onLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          {logoutLabel}
        </Button>
      )}
    </div>
  );
}
