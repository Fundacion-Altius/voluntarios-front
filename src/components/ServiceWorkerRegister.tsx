'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
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
