'use client';

import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { SidebarPrefs } from '@/components/navigation/SidebarPrefs';
import { cn } from '@/lib/utils';

interface CollapsibleSidebarShellProps {
  title: string;
  collapseLabel: string;
  expandLabel: string;
  logoutLabel: string;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  children: (collapsed: boolean) => ReactNode;
}

/**
 * Admin/portal chrome on top of shadcn Sidebar (`collapsible="icon"` + SidebarRail).
 * Toggle is the edge rail — no control next to the logo. Caller must wrap with SidebarProvider.
 */
export function CollapsibleSidebarShell({
  title,
  collapseLabel,
  expandLabel,
  logoutLabel,
  userName,
  userEmail,
  onLogout,
  children,
}: CollapsibleSidebarShellProps) {
  return (
    <Sidebar collapsible="icon" className="overflow-hidden group-data-[collapsible=icon]:overflow-hidden">
      <SidebarBrandHeader title={title} />
      <SidebarBody>{children}</SidebarBody>
      <SidebarUserFooter
        userName={userName}
        userEmail={userEmail}
        logoutLabel={logoutLabel}
        onLogout={onLogout}
      />
      <SidebarEdgeRail collapseLabel={collapseLabel} expandLabel={expandLabel} />
    </Sidebar>
  );
}

function SidebarBody({ children }: { children: (collapsed: boolean) => ReactNode }) {
  const { state } = useSidebar();
  // Icon mode: clip here, let the nav inside scroll with scrollbar-none (avoids a hollow gutter).
  return (
    <SidebarContent className="overflow-hidden group-data-[collapsible=icon]:overflow-hidden">
      {children(state === 'collapsed')}
    </SidebarContent>
  );
}

function SidebarBrandHeader({ title }: { title: string }) {
  return (
    <SidebarHeader className="border-b border-sidebar-border">
      <div className="flex w-full items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/klaruk/symbol.svg" alt="" aria-hidden="true" className="size-8 shrink-0 dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/klaruk/symbol-dark.svg" alt="" aria-hidden="true" className="hidden size-8 shrink-0 dark:block" />
        <span className="font-heading text-lg font-bold group-data-[collapsible=icon]:hidden">{title}</span>
      </div>
    </SidebarHeader>
  );
}

function SidebarUserFooter({
  userName,
  userEmail,
  logoutLabel,
  onLogout,
}: {
  userName?: string;
  userEmail?: string;
  logoutLabel: string;
  onLogout: () => void;
}) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarFooter
      className={cn(
        'overflow-hidden border-t border-sidebar-border',
        collapsed && 'items-center px-1',
      )}
    >
      {!collapsed && userName && (
        <div className="truncate px-2">
          <p className="text-sm font-medium">{userName}</p>
          {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
        </div>
      )}
      {/* Language switcher is too wide for the icon rail; keep theme only when collapsed. */}
      <SidebarPrefs compact={collapsed} hideLanguage={collapsed} />
      <Button
        variant="ghost"
        size={collapsed ? 'icon-sm' : 'default'}
        className={cn(
          'text-muted-foreground',
          collapsed ? 'size-8 shrink-0' : 'w-full justify-start gap-3 text-sm',
        )}
        aria-label={logoutLabel}
        onClick={onLogout}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {!collapsed && logoutLabel}
      </Button>
    </SidebarFooter>
  );
}

function SidebarEdgeRail({
  collapseLabel,
  expandLabel,
}: {
  collapseLabel: string;
  expandLabel: string;
}) {
  const { state } = useSidebar();
  const label = state === 'collapsed' ? expandLabel : collapseLabel;
  return <SidebarRail aria-label={label} title={label} />;
}
