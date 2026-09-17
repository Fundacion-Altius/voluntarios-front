'use client';

import { useEffect, useState } from 'react';

const DEFAULT_DURATION_MS = 900;

/**
 * Animates a number from 0 to `target` on first render (ease-out cubic).
 * Snaps to the exact target at the end so displayed values never drift.
 * Users with prefers-reduced-motion (or environments without
 * requestAnimationFrame, e.g. tests) get the final value immediately.
 */
export function useCountUp(target: number, durationMs: number = DEFAULT_DURATION_MS): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof requestAnimationFrame === 'undefined' || durationMs <= 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(progress >= 1 ? target : target * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
