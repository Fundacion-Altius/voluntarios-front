export function copyUpstreamCookies(upstream: Response, outbound: { headers: Headers }): void {
  const many = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  if (many.length > 0) {
    for (const cookie of many) {
      outbound.headers.append("set-cookie", cookie);
    }
    return;
  }
  const single = upstream.headers.get("set-cookie");
  if (single) outbound.headers.set("set-cookie", single);
}
