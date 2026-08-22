'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

const LOCALES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'ca', label: 'CA' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-md border border-input bg-transparent px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Cambiar idioma"
      >
        {locale.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-md divide-y">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => switchLocale(l.code)}
              className={`w-full px-3 py-1.5 text-sm text-left hover:bg-accent ${locale === l.code ? 'text-primary' : 'text-popover-foreground'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
