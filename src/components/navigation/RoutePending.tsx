'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { Loader2 } from 'lucide-react';

const RoutePendingContext = createContext<(pending: boolean) => void>(() => {});

export function useSetRoutePending() {
  return useContext(RoutePendingContext);
}

export function RoutePendingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  const set = useCallback((value: boolean) => setPending(value), []);

  return (
    <RoutePendingContext.Provider value={set}>
      <div className="relative min-h-screen">
        {pending && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/40">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
            <span className="sr-only">Cargando</span>
          </div>
        )}
        {children}
      </div>
    </RoutePendingContext.Provider>
  );
}
