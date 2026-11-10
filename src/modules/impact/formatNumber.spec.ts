import { formatImpactNumber, localizeImpactUnit } from "./formatNumber";

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

  it("shows stored unit codes in the active language", () => {
    const es = (key: string) =>
      ({ people: "personas", students: "alumnos", volunteers: "voluntarios", perHour: "personas/hora" })[key] ?? key;
    expect(localizeImpactUnit("people", es)).toBe("personas");
    expect(localizeImpactUnit("students", es)).toBe("alumnos");
    expect(localizeImpactUnit("volunteers", es)).toBe("voluntarios");
    expect(localizeImpactUnit("people/hour", es)).toBe("personas/hora");
    expect(localizeImpactUnit("%", es)).toBe("%");
    expect(localizeImpactUnit("raciones", es)).toBe("raciones");
    expect(localizeImpactUnit(undefined, es)).toBe("");
  });
});
