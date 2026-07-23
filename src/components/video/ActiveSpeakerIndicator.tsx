'use client';

export function ActiveSpeakerIndicator({ attention }: { attention: number | null }) {
  if (attention === null) return null;

  const label = attention > 0.7 ? 'High attention' : attention > 0.4 ? 'Attention' : 'Low attention';
  const color = attention > 0.7 ? 'text-green-600' : attention > 0.4 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${color}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </div>
  );
}
