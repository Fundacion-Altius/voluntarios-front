'use client';

import { useEffect } from 'react';

export function isServiceWorkerEnabled(nodeEnv: string | undefined, enableFlag: string | undefined): boolean {
  return nodeEnv === 'production' || enableFlag === 'true';
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!isServiceWorkerEnabled(process.env.NODE_ENV, process.env.NEXT_PUBLIC_ENABLE_SW)) {
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('SW registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('SW registration failed:', err);
      });
  }, []);

  return null;
}
