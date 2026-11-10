'use client';

interface BookingQrProps {
  dataUrl?: string | null;
  payload?: string | null;
  label: string;
  hint?: string;
}

export function BookingQr({ dataUrl, payload, label, hint }: BookingQrProps) {
  if (!dataUrl && !payload) return null;
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border bg-white p-2">
      {dataUrl ? (
        <img src={dataUrl} alt={label} className="size-36" />
      ) : null}
      {hint ? <p className="text-center text-[10px] text-muted-foreground">{hint}</p> : null}
      {payload ? (
        <p className="max-w-40 break-all text-center font-mono text-[9px] text-muted-foreground">{payload}</p>
      ) : null}
    </div>
  );
}
