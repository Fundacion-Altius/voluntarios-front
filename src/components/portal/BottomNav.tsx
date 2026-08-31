'use client';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Home, BookOpen, Calendar, Users, MessageSquare, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

interface BottomNavProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export default function BottomNav({ userName, userEmail, onLogout }: BottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations('portal.nav');

  const primaryTabs = [
    { href: '/portal', label: t('inicio'), icon: Home },
    { href: '/portal/cursos', label: t('cursos'), icon: BookOpen },
    { href: '/portal/actividades', label: t('actividades'), icon: Calendar },
    { href: '/portal/proyectos', label: t('proyectos'), icon: Users },
    { href: '/portal/mensajes', label: t('mensajes'), icon: MessageSquare },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t bg-card pb-safe">
        {primaryTabs.map((tabs) => {
          const Icon = tabs.icon;
          const isActive = tabs.href === '/portal' ? pathname === '/portal' : pathname.startsWith(tabs.href);
          return (
            <Link
              key={tabs.href}
              href={tabs.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
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
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <MoreHorizontal className="size-5" />
              {t('mas')}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0 sm:max-w-sm">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('miPortal')}</SheetTitle>
            </SheetHeader>
            <Sidebar
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
