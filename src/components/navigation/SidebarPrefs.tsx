'use client';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

export function SidebarPrefs({
  compact = false,
  hideLanguage = false,
}: {
  compact?: boolean;
  hideLanguage?: boolean;
}) {
  return (
    <div
      className={cn(
        'mb-3 flex gap-2 overflow-hidden',
        compact ? 'flex-col items-center' : 'items-center justify-between',
      )}
    >
      <ThemeToggle />
      {!hideLanguage && <LanguageSwitcher />}
    </div>
  );
}
