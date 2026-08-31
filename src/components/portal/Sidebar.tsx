'use client';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Award, Trophy, Newspaper, BookOpen, Users, MessageSquare, Bell, LogOut, type LucideIcon } from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

export default function Sidebar({ userName, userEmail, onLogout, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('portal.nav');

  const links: NavLink[] = [
    { href: '/portal', label: t('inicio'), icon: Home },
    { href: '/portal/cursos', label: t('cursos'), icon: BookOpen },
    { href: '/portal/actividades', label: t('actividades'), icon: Calendar },
    { href: '/portal/proyectos', label: t('proyectos'), icon: Users },
    { href: '/portal/mensajes', label: t('mensajes'), icon: MessageSquare },
    { href: '/portal/noticias', label: t('noticias'), icon: Newspaper },
    { href: '/portal/logros', label: t('logros'), icon: Award },
    { href: '/portal/ranking', label: t('ranking'), icon: Trophy },
    { href: '/portal/notificaciones', label: t('notificaciones'), icon: Bell },
  ];

  return (
    <aside className="flex h-full min-h-0 w-60 flex-col border-r bg-card lg:h-screen">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          V
        </div>
        <span className="font-heading text-lg font-bold">{t('miPortal')}</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((l) => {
          const Icon = l.icon;
          const isActive = pathname === l.href || (l.href !== '/portal' && pathname.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} onClick={onNavigate}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 text-sm"
              >
                <Icon className="size-4 shrink-0" />
                {l.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        {userName && (
          <div className="mb-3 truncate">
            <p className="text-sm font-medium">{userName}</p>
            {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-muted-foreground" onClick={onLogout}>
          <LogOut className="size-4" />
          {t('salir')}
        </Button>
      </div>
    </aside>
  );
}
