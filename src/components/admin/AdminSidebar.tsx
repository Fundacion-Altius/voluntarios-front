'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SidebarPrefs } from '@/components/navigation/SidebarPrefs';
import { useSetRoutePending } from '@/components/navigation/RoutePending';
import {
  LayoutDashboard, Users, FileText, ClipboardList, BarChart3, UserCheck, CalendarCheck,
  Trophy, Scan, Newspaper, BookOpen, Coins, Bot, Download, MessageCircle, Wallet, LineChart, LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AdminSidebarProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

export default function AdminSidebar({ userName, userEmail, onLogout, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');
  const tAutomation = useTranslations('admin.automation');
  const setPending = useSetRoutePending();

  const links: NavLink[] = [
    { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/admin/contratos', label: t('contratos'), icon: FileText },
    { href: '/admin/usuarios', label: t('usuarios'), icon: Users },
    { href: '/admin/encuestas', label: t('encuestas'), icon: ClipboardList },
    { href: '/admin/analytics', label: t('analytics'), icon: BarChart3 },
    { href: '/admin/candidatos', label: t('candidatos'), icon: UserCheck },
    { href: '/admin/actividades', label: t('actividades'), icon: CalendarCheck },
    { href: '/admin/asistencia', label: t('asistencia'), icon: ClipboardList },
    { href: '/admin/blog', label: t('blog'), icon: Newspaper },
    { href: '/admin/cursos', label: t('cursos'), icon: BookOpen },
    { href: '/admin/onboarding', label: t('onboarding'), icon: ClipboardList },
    { href: '/admin/impacto', label: t('impacto'), icon: LineChart },
    { href: '/admin/fondos', label: t('fondos'), icon: Coins },
    { href: '/admin/grants', label: t('grants'), icon: Wallet },
    { href: '/admin/automatizacion', label: tAutomation('navLabel'), icon: Bot },
    { href: '/admin/mensajeria', label: t('mensajeria'), icon: MessageCircle },
    { href: '/admin/mensajes', label: t('mensajes'), icon: MessageCircle },
    { href: '/admin/exportaciones', label: t('exportaciones'), icon: Download },
    { href: '/admin/scanner', label: t('scanner'), icon: Scan },
    { href: '/admin/ranking', label: t('ranking'), icon: Trophy },
  ];

  return (
    <aside className="flex h-full min-h-0 w-60 flex-col border-r bg-card lg:h-screen">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          A
        </div>
        <span className="font-heading text-lg font-bold">{t('panelAdmin')}</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((l) => {
          const Icon = l.icon;
          const isActive = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link key={l.href} href={l.href} onClick={() => { setPending(true); onNavigate?.(); }}>
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
        <SidebarPrefs />
        <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-muted-foreground" onClick={onLogout}>
          <LogOut className="size-4" />
          {t('salir')}
        </Button>
      </div>
    </aside>
  );
}
