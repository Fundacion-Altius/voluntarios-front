import { isServiceWorkerEnabled } from "./ServiceWorkerRegister";

describe("isServiceWorkerEnabled", () => {
  it("skips registration in development without the flag", () => {
    expect(isServiceWorkerEnabled("development", undefined)).toBe(false);
    expect(isServiceWorkerEnabled("development", "false")).toBe(false);
  });

  it("registers in development when the flag is enabled", () => {
    expect(isServiceWorkerEnabled("development", "true")).toBe(true);
  });

  it("always registers in production regardless of the flag", () => {
    expect(isServiceWorkerEnabled("production", undefined)).toBe(true);
    expect(isServiceWorkerEnabled("production", "false")).toBe(true);
    expect(isServiceWorkerEnabled("production", "true")).toBe(true);
  });
});