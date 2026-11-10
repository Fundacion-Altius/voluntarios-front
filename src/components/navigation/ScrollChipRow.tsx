"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal chip/tab/step scroller: keeps the active item in view and shows
 * edge fades when content overflows (mobile tabs, impact/comandero steps).
 */
export function ScrollChipRow({
  activeKey,
  children,
  className,
  scrollerClassName,
  fade = true,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: {
  activeKey: string;
  children: ReactNode;
  className?: string;
  scrollerClassName?: string;
  fade?: boolean;
  "aria-label"?: string;
  "data-testid"?: string;
}) {
  const scrollerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>('[data-scroll-active="true"]');
    if (!active || typeof active.scrollIntoView !== "function") return;
    active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeKey]);

  return (
    <div className={cn("relative min-w-0", className)}>
      <nav
        ref={scrollerRef}
        aria-label={ariaLabel}
        data-testid={testId}
        className={cn("overflow-x-auto overscroll-x-contain [scrollbar-width:thin]", scrollerClassName)}
      >
        {children}
      </nav>
      {fade && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-background to-transparent md:hidden"
          />
          <div
            aria-hidden
            data-testid="scroll-chip-fade-end"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent"
          />
        </>
      )}
    </div>
  );
}
