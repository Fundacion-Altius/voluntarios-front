import { formatImpactNumber } from "./formatNumber";

describe("formatImpactNumber", () => {
  it("groups thousands with the locale's own separator", () => {
    expect(formatImpactNumber(9840, "es")).toBe("9.840");
    expect(formatImpactNumber(523000, "es")).toBe("523.000");
    expect(formatImpactNumber(9840, "ca")).toBe("9.840");
    expect(formatImpactNumber(9840, "en")).toBe("9,840");
    expect(formatImpactNumber(523000, "en")).toBe("523,000");
  });

  it("keeps decimals in the locale's decimal mark", () => {
    expect(formatImpactNumber(27.27, "es")).toBe("27,27");
    expect(formatImpactNumber(27.27, "en")).toBe("27.27");
  });
});
