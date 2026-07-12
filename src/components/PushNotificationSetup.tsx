'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function PushNotificationSetup() {
  const { data: session } = useSession();
  const doneRef = useRef(false);

  useEffect(() => {
    const authToken = (session as any)?.authToken;
    if (!authToken || doneRef.current) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;

        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
        }

        const res = await fetch(`${API_URL}/api/push/public-key`);
        if (!res.ok) return;
        const { publicKey } = await res.json();

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });

        const subData = subscription.toJSON();

        await fetch(`${API_URL}/api/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: subData.endpoint,
            keys: subData.keys,
          }),
        });

        doneRef.current = true;
      } catch {
        // user denied permission or push not available
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !doneRef.current) {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') setup();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') setup();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  return null;
}
