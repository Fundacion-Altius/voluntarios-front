'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, FileText, Users, Wallet, MessageCircle, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { useSetRoutePending } from '@/components/navigation/RoutePending';
import AdminSidebar from './AdminSidebar';

interface AdminBottomNavProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export default function AdminBottomNav({ userName, userEmail, onLogout }: AdminBottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations('admin.nav');
  const setPending = useSetRoutePending();

  const primaryTabs = [
    { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/contratos', label: t('contratos'), icon: FileText },
    { href: '/admin/usuarios', label: t('usuarios'), icon: Users },
    { href: '/admin/grants', label: t('grants'), icon: Wallet },
    { href: '/admin/mensajeria', label: t('mensajeria'), icon: MessageCircle },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t bg-card pb-safe">
        {primaryTabs.map((tabs) => {
          const Icon = tabs.icon;
          const isActive = pathname === tabs.href || pathname.startsWith(`${tabs.href}/`);
          return (
            <Link
              key={tabs.href}
              href={tabs.href}
              onClick={() => setPending(true)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] sm:px-3 sm:text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="size-5" />
              {tabs.label}
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] text-muted-foreground sm:px-3 sm:text-xs"
              onClick={() => setOpen(true)}
            >
              <MoreHorizontal className="size-5" />
              {t('mas')}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 sm:max-w-sm">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('panelAdmin')}</SheetTitle>
            </SheetHeader>
            <AdminSidebar
              userName={userName}
              userEmail={userEmail}
              onLogout={onLogout}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </nav>
      <div className="h-16" />
    </>
  );
}
