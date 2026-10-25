"use client";
import { useId, useState } from "react";
import type { FeatureGroup } from "./features";

// Line icons per feature group, in the order of `features`.
const ICONS: string[] = [
  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  '<path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
  '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
];
const TONES = ["brand", "leaf", "gold"] as const;
const VISIBLE = 2;

export default function FeatureCard({ f, index }: { f: FeatureGroup; index: number }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const extra = f.items.length - VISIBLE;
  return (
    <article className={`card feature tone-${TONES[index % TONES.length]}`}>
      <span className="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[index % ICONS.length] }} />
      </span>
      <h3>{f.title}</h3>
      <p className="benefit">{f.benefit}</p>
      <ul className="ticks feature-list" id={listId}>
        {f.items.map((it, i) => <li key={it} hidden={!open && i >= VISIBLE}>{it}</li>)}
      </ul>
      {extra > 0 ? (
        <button type="button" className="more" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((v) => !v)}>
          {open ? "Ver menos" : `Ver ${extra} más`}
        </button>
      ) : null}
    </article>
  );
}
