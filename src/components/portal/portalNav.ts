import { Home, Bell, Calendar, Users, PackageSearch, BookOpen, MessageSquare, Video, Newspaper, Award, Trophy } from 'lucide-react';
import type { NavGroup } from '@/components/navigation/GroupedNav';

type T = (key: string) => string;

/** Volunteer portal navigation, grouped by category. Routes are unchanged. */
export function portalNavGroups(t: T): { pinned: NavGroup; groups: NavGroup[] } {
  const g = (k: string) => t(`groups.${k}`);
  const i = (k: string) => t(`items.${k}`);
  return {
    pinned: { id: 'miDia', label: g('miDia'), items: [
      { href: '/portal', label: i('inicio'), icon: Home, exact: true },
      { href: '/portal/notificaciones', label: i('notificaciones'), icon: Bell },
    ] },
    groups: [
      { id: 'participar', label: g('participar'), items: [
        { href: '/portal/actividades', label: i('actividades'), icon: Calendar },
        { href: '/portal/proyectos', label: i('proyectos'), icon: Users },
        { href: '/portal/ayuda-alimentaria', label: i('ayudaAlimentaria'), icon: PackageSearch },
        { href: '/portal/cursos', label: i('cursos'), icon: BookOpen },
      ] },
      { id: 'comunidad', label: g('comunidad'), items: [
        { href: '/portal/mensajes', label: i('chat'), icon: MessageSquare },
        { href: '/portal/video', label: i('video'), icon: Video },
        { href: '/portal/noticias', label: i('noticias'), icon: Newspaper },
      ] },
      { id: 'progreso', label: g('progreso'), items: [
        { href: '/portal/logros', label: i('logros'), icon: Award },
        { href: '/portal/ranking', label: i('ranking'), icon: Trophy },
      ] },
    ],
  };
}
