// Decorative drawing: scattered spreadsheets and chats flowing into one Klaruk hub.
export default function ScatterToOne() {
  return (
    <svg className="scatter" viewBox="0 0 420 300" aria-hidden="true" focusable="false">
      <g className="sc-lines" fill="none" strokeWidth="1.5" strokeDasharray="4 6">
        <path d="M92 58 C180 70 220 120 300 150" />
        <path d="M70 150 C150 150 220 150 300 150" />
        <path d="M96 240 C180 230 220 180 300 150" />
        <path d="M200 30 C230 80 260 120 300 150" />
      </g>
      {/* spreadsheet */}
      <g className="sc-card" transform="translate(28 30)">
        <rect width="92" height="60" rx="8" />
        <path className="sc-grid" d="M0 20h92M0 40h92M30 0v60M61 0v60" />
      </g>
      {/* chat bubbles */}
      <g className="sc-card" transform="translate(16 124)">
        <rect width="78" height="44" rx="12" />
        <rect className="sc-bar" x="12" y="14" width="44" height="5" rx="2.5" />
        <rect className="sc-bar" x="12" y="25" width="30" height="5" rx="2.5" />
      </g>
      <g className="sc-card" transform="translate(40 214)">
        <rect width="86" height="48" rx="12" />
        <rect className="sc-bar" x="12" y="15" width="56" height="5" rx="2.5" />
        <rect className="sc-bar" x="12" y="27" width="36" height="5" rx="2.5" />
      </g>
      {/* paper */}
      <g className="sc-card" transform="translate(172 8)">
        <rect width="52" height="64" rx="6" />
        <rect className="sc-bar" x="10" y="14" width="32" height="4" rx="2" />
        <rect className="sc-bar" x="10" y="24" width="24" height="4" rx="2" />
        <rect className="sc-bar" x="10" y="34" width="28" height="4" rx="2" />
      </g>
      {/* hub */}
      <circle className="sc-glow" cx="330" cy="150" r="70" />
      <circle className="sc-hub" cx="330" cy="150" r="46" />
      <g transform="translate(306 126) scale(.75)">
        <rect x="12" y="8" width="11" height="48" rx="3" fill="#fff" />
        <path d="M52 10 L31 32 L52 54" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
