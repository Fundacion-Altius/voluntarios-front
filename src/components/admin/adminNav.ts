import {
  LayoutDashboard, BarChart3, UserCheck, Users, ClipboardList, FileText, HeartPulse, Trophy,
  CalendarCheck, Scan, BookOpen, HandHeart, MessageCircle, Share2, Newspaper, Wallet, Coins,
  Megaphone, Scale, LineChart, Activity, Network, Bot, Plug, Download, ListChecks,
} from 'lucide-react';
import type { NavGroup } from '@/components/navigation/GroupedNav';

type T = (key: string) => string;

/** Admin navigation, grouped by category. Routes are unchanged. */
export function adminNavGroups(t: T): { pinned: NavGroup; groups: NavGroup[] } {
  const g = (k: string) => t(`groups.${k}`);
  const i = (k: string) => t(`items.${k}`);
  return {
    pinned: {
      id: 'inicio', label: g('inicio'), items: [
        { href: '/admin/dashboard', label: i('panel'), icon: LayoutDashboard },
        { href: '/admin/analytics', label: i('analitica'), icon: BarChart3 },
      ],
    },
    groups: [
      { id: 'voluntariado', label: g('voluntariado'), items: [
        { href: '/admin/candidatos', label: i('candidaturas'), icon: UserCheck },
        { href: '/admin/usuarios', label: i('personasVoluntarias'), icon: Users },
        { href: '/admin/onboarding', label: i('acogida'), icon: ClipboardList },
        { href: '/admin/contratos', label: i('contratos'), icon: FileText },
        { href: '/admin/bienestar', label: i('bienestar'), icon: HeartPulse },
        { href: '/admin/ranking', label: i('reconocimientos'), icon: Trophy },
      ] },
      { id: 'actividades', label: g('actividades'), items: [
        { href: '/admin/actividades', label: i('actividades'), icon: CalendarCheck },
        { href: '/admin/asistencia', label: i('asistencia'), icon: ListChecks },
        { href: '/admin/scanner', label: i('escaner'), icon: Scan },
        { href: '/admin/cursos', label: i('cursos'), icon: BookOpen },
        { href: '/admin/encuestas', label: i('encuestas'), icon: ClipboardList },
      ] },
      { id: 'personas', label: g('personas'), items: [
        { href: '/admin/beneficiarios', label: i('beneficiarias'), icon: HandHeart },
      ] },
      { id: 'comunicacion', label: g('comunicacion'), items: [
        { href: '/admin/mensajes', label: i('chat'), icon: MessageCircle },
        { href: '/admin/mensajeria', label: i('mensajeria'), icon: MessageCircle },
        { href: '/admin/redes-sociales', label: i('redes'), icon: Share2 },
        { href: '/admin/blog', label: i('noticias'), icon: Newspaper },
      ] },
      { id: 'financiacion', label: g('financiacion'), items: [
        { href: '/admin/grants', label: i('subvenciones'), icon: Wallet },
        { href: '/admin/fondos', label: i('fondos'), icon: Coins },
        { href: '/admin/campanas', label: i('campanas'), icon: Megaphone },
      ] },
      { id: 'gobierno', label: g('gobierno'), items: [
        { href: '/admin/gobernanza', label: i('gobernanza'), icon: Scale },
        { href: '/admin/impacto', label: i('impacto'), icon: LineChart },
        { href: '/admin/metricas-comunidad', label: i('salud'), icon: Activity },
        { href: '/admin/federacion', label: i('federacion'), icon: Network },
      ] },
      { id: 'datos', label: g('datos'), items: [
        { href: '/admin/automatizacion', label: i('automatizaciones'), icon: Bot },
        { href: '/admin/integraciones', label: i('integraciones'), icon: Plug },
        { href: '/admin/exportaciones', label: i('exportaciones'), icon: Download },
      ] },
    ],
  };
}
