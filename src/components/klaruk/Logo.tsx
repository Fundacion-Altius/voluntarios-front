// Both wordmarks are rendered; CSS shows the one matching the active theme.
export default function Logo({ height = 30 }: { height?: number }) {
  const style = { height, width: "auto" } as const;
  return (
    <span className="logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-light" src="/klaruk/wordmark.svg" alt="Klaruk" height={height} style={style} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-dark" src="/klaruk/wordmark-dark.svg" alt="Klaruk" height={height} style={style} />
    </span>
  );
}
