'use client';

export function ActiveSpeakerIndicator({ connected, attention }: { connected?: boolean; attention?: number | null }) {
  const isConnected = connected ?? true;
  if (!isConnected) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      En vivo
    </div>
  );
}
