'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, CalendarCheck, Scan, MessageCircle, Users, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { useSetRoutePending } from '@/components/navigation/RoutePending';
import { isActivePath, groupForPath } from '@/components/navigation/GroupedNav';
import AdminSidebar from './AdminSidebar';
import { adminNavGroups } from './adminNav';

interface AdminBottomNavProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

const tabClass = (active: boolean) =>
  `flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-xs ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`;

export default function AdminBottomNav({ userName, userEmail, onLogout }: AdminBottomNavProps) {
  const pathname = usePathname();
  const [sheetGroup, setSheetGroup] = useState<string | null>(null);
  const t = useTranslations('admin.sidebar');
  const tNav = useTranslations('admin.nav');
  const setPending = useSetRoutePending();
  const { groups } = adminNavGroups(t);
  const inVoluntariado = groupForPath(groups, pathname) === 'voluntariado';

  const tabs = [
    { href: '/admin/dashboard', label: t('items.panel'), icon: LayoutDashboard },
    { href: '/admin/actividades', label: t('mobile.actividades'), icon: CalendarCheck },
    { href: '/admin/scanner', label: t('items.escaner'), icon: Scan },
    { href: '/admin/mensajes', label: t('items.chat'), icon: MessageCircle },
  ];

  return (
    <>
      <nav aria-label={t('title')} className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t bg-card pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActivePath(pathname, tab);
          return (
            <Link key={tab.href} href={tab.href} onClick={() => setPending(true)} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
        {/* Voluntariado opens the menu with its group expanded. */}
        <button type="button" aria-haspopup="dialog" aria-expanded={sheetGroup === 'voluntariado'} className={tabClass(inVoluntariado)} onClick={() => setSheetGroup('voluntariado')}>
          <Users className="size-5" aria-hidden="true" />
          <span className="truncate">{t('groups.voluntariado')}</span>
        </button>
        <button type="button" aria-haspopup="dialog" aria-expanded={sheetGroup === 'all'} className={tabClass(false)} onClick={() => setSheetGroup('all')}>
          <MoreHorizontal className="size-5" aria-hidden="true" />
          <span className="truncate">{tNav('mas')}</span>
        </button>
        <Sheet open={sheetGroup !== null} onOpenChange={(o) => { if (!o) setSheetGroup(null); }}>
          <SheetContent side="left" className="w-64 p-0 sm:max-w-sm">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('title')}</SheetTitle>
            </SheetHeader>
            <AdminSidebar
              userName={userName}
              userEmail={userEmail}
              onLogout={onLogout}
              onNavigate={() => setSheetGroup(null)}
              initialGroup={sheetGroup === 'voluntariado' ? 'voluntariado' : undefined}
            />
          </SheetContent>
        </Sheet>
      </nav>
      <div className="h-16" />
    </>
  );
}
