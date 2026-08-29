'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const LINKS = [
  { href: '/admin/mensajeria', key: 'config' as const },
  { href: '/admin/mensajeria/plantillas', key: 'templates' as const },
  { href: '/admin/mensajeria/enviar', key: 'composer' as const },
  { href: '/admin/mensajeria/registro', key: 'logs' as const },
];

export function MessagingNav() {
  const pathname = usePathname();
  const t = useTranslations('admin.messaging');
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-md px-3 py-1 text-sm ${pathname === link.href ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );
}
