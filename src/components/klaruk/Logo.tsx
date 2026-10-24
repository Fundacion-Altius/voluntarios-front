// Marketing pages force the light theme, so only the light wordmark is used.
export default function Logo({ height = 30 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/klaruk/wordmark.svg" alt="Klaruk" height={height} style={{ height, width: "auto", display: "block" }} />;
}
