'use client';

import { useEffect, useState } from 'react';
import { ChefHat, Wine } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { LineStatus, QueueLine, Station } from '@/modules/comandero/types';
import { formatWaitClock, waitIsLate, waitSeconds } from '@/modules/comandero/floorStatus';
import { useComanderoStation } from '@/modules/comandero/useComandero';
import { cn } from '@/lib/utils';

/** The next action a station can take on a line; anything else falls back to a plain "advance". */
function nextActionKey(status: LineStatus): string {
  return status === 'pedido' || status === 'en_preparacion' ? `next.${status}` : 'advance';
}

function groupByTable(lines: QueueLine[]): Array<{ tableId: string; tableLabel: string; lines: QueueLine[] }> {
  const map = new Map<string, { tableId: string; tableLabel: string; lines: QueueLine[] }>();
  for (const line of lines) {
    const existing = map.get(line.table_id);
    if (existing) existing.lines.push(line);
    else map.set(line.table_id, { tableId: line.table_id, tableLabel: line.table_label, lines: [line] });
  }
  return Array.from(map.values());
}

function oldestWait(lines: QueueLine[], now: number): number {
  return Math.max(0, ...lines.map((l) => waitSeconds(l, now)));
}

function primaryLine(lines: QueueLine[]): QueueLine {
  const preparing = lines.find((l) => l.status === 'en_preparacion');
  if (preparing) return preparing;
  const ordered = lines.find((l) => l.status === 'pedido');
  return ordered ?? lines[0];
}

export function StationView({ sessionId, station }: { sessionId: string; station: Station }) {
  const t = useTranslations('comandero.portal');
  const tStatus = useTranslations('comandero.status');
  const locale = useLocale();
  const stationName = t(`role.${station}`);
  const { lines, error, advance } = useComanderoStation(sessionId, station);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const onAdvance = async (lineId: string) => {
    setActionError(null);
    setPending(lineId);
    const err = await advance(lineId);
    if (err) setActionError(err);
    setPending(null);
  };

  const Icon = station === 'barra' ? Wine : ChefHat;
  const tickets = groupByTable(lines);

  return (
    <div
      className="rounded-2xl bg-[#14151c] p-4 text-[#f4f3ef] shadow-sm md:p-5"
      data-testid={`comandero-station-${station}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2c2f3d] pb-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#9fa2ff] text-[#14151c]">
            <Icon className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-white">{t('station.title', { station: stationName })}</h2>
            <p className="text-sm text-[#a7abc0]">{t('station.liveHint')}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#2b2e40] px-3 py-1 text-sm font-semibold" data-testid="comandero-station-count">
          {lines.length}
        </span>
      </div>

      {error && <p className="mb-3 rounded-md bg-red-950/50 p-2 text-sm text-red-200">{error}</p>}
      {actionError && <p className="mb-3 rounded-md bg-red-950/50 p-2 text-sm text-red-200">{actionError}</p>}

      {lines.length === 0 ? (
        <p className="text-sm text-[#a7abc0]">
          {t('station.empty', { station: stationName.toLocaleLowerCase(locale) })}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket) => {
            const wait = oldestWait(ticket.lines, now);
            const focus = primaryLine(ticket.lines);
            const late = waitIsLate(wait);
            return (
              <article
                key={ticket.tableId}
                className={cn(
                  'flex flex-col gap-3 rounded-[1.125rem] border border-[#32364a] bg-[#232636] p-3.5',
                  late && 'border-[#e2bd7a] shadow-[0_0_0_2px_rgba(226,189,122,0.25)]',
                )}
                data-testid="comandero-station-ticket"
              >
                <header className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-xl font-bold text-white">{ticket.tableLabel}</h3>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 font-heading text-base font-bold',
                      late ? 'bg-[#4a1824] text-[#ff8aa0]' : 'bg-[#3a3018] text-[#e2bd7a]',
                    )}
                  >
                    {formatWaitClock(wait)}
                  </span>
                </header>
                <ul className="grid flex-1 gap-2">
                  {ticket.lines.map((l) => (
                    <li
                      key={l.id}
                      data-testid="comandero-station-line"
                      className="rounded-xl bg-[#2b2e40] p-3 text-sm"
                    >
                      <span className="block font-medium text-white">{l.name}</span>
                      <span className="mt-1 block text-xs text-[#b8bdd4]">
                        {[l.note, tStatus(l.status)].filter(Boolean).join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="min-h-12 w-full rounded-xl bg-[#e2bd7a] text-[#1a1408] hover:bg-[#d4ad68]"
                  data-testid="comandero-advance-line"
                  disabled={pending === focus.id}
                  onClick={() => void onAdvance(focus.id)}
                >
                  {t(`station.${nextActionKey(focus.status)}`)}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
