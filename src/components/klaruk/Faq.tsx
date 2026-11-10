import type { ReactNode } from "react";
export type QA = { q: string; a: ReactNode };
export default function Faq({ items, openFirst = false }: { items: QA[]; openFirst?: boolean }) {
  return (
    <div className="faq">
      {items.map((it, i) => (
        <details key={it.q} open={openFirst && i === 0}>
          <summary>{it.q}</summary>
          <div className="faq-a">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
