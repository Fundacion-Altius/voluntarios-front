'use client';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function SidebarPrefs() {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  );
}
