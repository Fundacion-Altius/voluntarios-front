'use client';

import { useEffect, useState } from 'react';

/** True at the `lg` breakpoint (1024px+), where desktop sidebars are shown. */
export function useLgUp(): boolean {
  const [lgUp, setLgUp] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setLgUp(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return lgUp;
}
