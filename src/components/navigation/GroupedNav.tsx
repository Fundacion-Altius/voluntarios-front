'use client';

import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSetRoutePending } from '@/components/navigation/RoutePending';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only match this exact path (e.g. the portal home). */
  exact?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export function isActivePath(pathname: string, item: Pick<NavItem, 'href' | 'exact'>): boolean {
  if (pathname === item.href) return true;
  return !item.exact && pathname.startsWith(`${item.href}/`);
}

export function groupForPath(groups: NavGroup[], pathname: string): string | undefined {
  return groups.find((g) => g.items.some((i) => isActivePath(pathname, i)))?.id;
}

interface GroupedNavProps {
  /** Always-open first group (rendered without a toggle). */
  pinned: NavGroup;
  /** Collapsible groups; only one is open at a time. */
  groups: NavGroup[];
  /** Group to open initially instead of the one holding the current route. */
  initialGroup?: string;
  ariaLabel: string;
  onNavigate?: () => void;
  /** Render the nav as a narrow icon-only rail. Defaults to `false`. */
  collapsed?: boolean;
}

function NavLinks({
  items,
  pathname,
  onClick,
  collapsed,
}: {
  items: NavItem[];
  pathname: string;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    // Collapsed: flex + items-center — mx-auto does nothing on buttonVariants' inline-flex.
    <ul className={cn('space-y-1', collapsed && 'flex flex-col items-center')}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item);
        const link = (
          <Link
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-label={collapsed ? item.label : undefined}
            onClick={onClick}
            className={cn(
              buttonVariants({
                variant: active ? 'secondary' : 'ghost',
                size: collapsed ? 'icon-sm' : 'default',
              }),
              'text-sm',
              collapsed ? 'size-8 shrink-0' : 'w-full justify-start gap-3',
              active && 'font-semibold text-primary',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {!collapsed && item.label}
          </Link>
        );
        return (
          <li key={item.href} className={cn(collapsed && 'flex w-full justify-center')}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function GroupedNav({ pinned, groups, initialGroup, ariaLabel, onNavigate, collapsed = false }: GroupedNavProps) {
  const pathname = usePathname();
  const setPending = useSetRoutePending();
  const [open, setOpen] = useState<string>(initialGroup ?? groupForPath(groups, pathname) ?? '');

  // When the route changes (not on first render), open the group that holds it.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const g = groupForPath(groups, pathname);
    setOpen(g ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleClick = () => {
    setPending(true);
    onNavigate?.();
  };

  if (collapsed) {
    const flatItems = [...pinned.items, ...groups.flatMap((g) => g.items)];
    // One scroll container, no nested overflow; scrollbar-none kills track+thumb (not just the thumb).
    return (
      <nav
        aria-label={ariaLabel}
        className="flex min-h-0 flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-1.5 scrollbar-none"
      >
        <NavLinks items={flatItems} pathname={pathname} onClick={handleClick} collapsed={collapsed} />
      </nav>
    );
  }

  return (
    <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto overflow-x-hidden p-3">
      <section aria-labelledby={`nav-group-${pinned.id}`} className="mb-2">
        <h2 id={`nav-group-${pinned.id}`} className="flex min-h-10 items-center px-3 text-sm font-semibold text-foreground">
          {pinned.label}
        </h2>
        <NavLinks items={pinned.items} pathname={pathname} onClick={handleClick} collapsed={collapsed} />
      </section>
      <Accordion type="single" collapsible value={open} onValueChange={setOpen}>
        {groups.map((g) => (
          <AccordionItem key={g.id} value={g.id} id={`nav-group-${g.id}`}>
            <AccordionTrigger className="min-h-10 items-center px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground hover:no-underline">
              {g.label}
            </AccordionTrigger>
            <AccordionContent>
              <NavLinks items={g.items} pathname={pathname} onClick={handleClick} collapsed={collapsed} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </nav>
  );
}
