'use client';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Home, Calendar, MessageSquare, BookOpen, Award, Bell, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useSetRoutePending } from '@/components/navigation/RoutePending';
import { isActivePath } from '@/components/navigation/GroupedNav';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

interface BottomNavProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

const tabClass = (active: boolean) =>
  `flex min-h-14 min-w-0 flex-1 basis-0 flex-col items-center justify-start gap-0.5 px-0.5 pt-2 pb-1.5 text-[11px] leading-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-xs ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`;

export default function BottomNav({ userName, userEmail, onLogout }: BottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations('portal.nav');
  const tSide = useTranslations('portal.sidebar');
  const setPending = useSetRoutePending();

  const tabs = [
    { href: '/portal', label: tSide('items.inicio'), icon: Home, exact: true },
    { href: '/portal/actividades', label: tSide('items.actividades'), icon: Calendar },
    { href: '/portal/mensajes', label: tSide('items.chat'), icon: MessageSquare },
    { href: '/portal/cursos', label: tSide('items.cursos'), icon: BookOpen },
    { href: '/portal/logros', label: tSide('items.logros'), icon: Award },
    { href: '/portal/notificaciones', label: tSide('mobile.notificaciones'), icon: Bell },
  ];

  return (
    <>
      <nav aria-label={t('miPortal')} className="fixed inset-x-0 bottom-0 z-50 flex items-stretch gap-1 border-t bg-card px-1 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActivePath(pathname, tab);
          return (
            <Link key={tab.href} href={tab.href} onClick={() => setPending(true)} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="block w-full truncate text-center">{tab.label}</span>
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className={tabClass(false)}>
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span className="block w-full truncate text-center">{t('mas')}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 sm:max-w-sm">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('miPortal')}</SheetTitle>
            </SheetHeader>
            <Sidebar userName={userName} userEmail={userEmail} onLogout={onLogout} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </nav>
      <div className="h-16" />
    </>
  );
}
