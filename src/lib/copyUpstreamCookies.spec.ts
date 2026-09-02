import { copyUpstreamCookies } from "./copyUpstreamCookies";

describe("copyUpstreamCookies", () => {
  it("copies all Set-Cookie headers from getSetCookie", () => {
    const outbound = { headers: new Headers() };
    const upstream = {
      headers: {
        getSetCookie: () => ["a=1; Path=/", "b=2; Path=/"],
        get: () => null,
      },
    } as unknown as Response;

    copyUpstreamCookies(upstream, outbound);

    expect(outbound.headers.get("set-cookie")).toBe("a=1; Path=/, b=2; Path=/");
  });

  it("falls back to a single set-cookie header", () => {
    const outbound = { headers: new Headers() };
    const upstream = {
      headers: {
        getSetCookie: () => [],
        get: (name: string) => (name === "set-cookie" ? "only=1; Path=/" : null),
      },
    } as unknown as Response;

    copyUpstreamCookies(upstream, outbound);

    expect(outbound.headers.get("set-cookie")).toBe("only=1; Path=/");
  });
});
