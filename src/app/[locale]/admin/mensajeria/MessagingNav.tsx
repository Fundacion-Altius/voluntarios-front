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
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex h-10 items-center justify-center rounded-md px-3 text-center text-sm font-medium ${
            pathname === link.href ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
          }`}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );
}
