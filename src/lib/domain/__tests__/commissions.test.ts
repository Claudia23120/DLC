import { describe, expect, it } from "vitest";
import {
  commissionDurationLabel,
  commissionMonths,
  commissionPeriodLabel,
  dateToMonthInput,
  matchesCommissionSearch,
  membersWithoutCommission,
  monthInputToDate,
} from "../commissions";

describe("commissionMonths", () => {
  it("counts months inclusively across years", () => {
    expect(commissionMonths({ starts_on: "2025-11-01", ends_on: "2026-02-01" })).toBe(4);
    expect(commissionMonths({ starts_on: "2026-01-01", ends_on: "2026-10-01" })).toBe(10);
    expect(commissionMonths({ starts_on: "2026-08-01", ends_on: "2026-08-01" })).toBe(1);
  });

  it("is null for all-year commissions", () => {
    expect(commissionMonths({ starts_on: null, ends_on: null })).toBeNull();
  });
});

describe("commission labels", () => {
  it("formats the period and duration", () => {
    const c = { starts_on: "2025-11-01", ends_on: "2026-02-01" };
    expect(commissionPeriodLabel(c)).toBe("Novembre 2025 – Febrer 2026");
    expect(commissionDurationLabel(c)).toBe("4 mesos");
  });

  it("collapses a single-month period", () => {
    const c = { starts_on: "2026-08-01", ends_on: "2026-08-01" };
    expect(commissionPeriodLabel(c)).toBe("Agost 2026");
    expect(commissionDurationLabel(c)).toBe("1 mes");
  });

  it("labels all-year commissions", () => {
    const c = { starts_on: null, ends_on: null };
    expect(commissionPeriodLabel(c)).toBe("Tot l'any");
    expect(commissionDurationLabel(c)).toBeNull();
  });
});

describe("month input conversion", () => {
  it("round-trips a month", () => {
    expect(monthInputToDate("2026-01")).toBe("2026-01-01");
    expect(dateToMonthInput("2026-01-01")).toBe("2026-01");
  });

  it("rejects empty or malformed input", () => {
    expect(monthInputToDate("")).toBeNull();
    expect(monthInputToDate("2026")).toBeNull();
    expect(dateToMonthInput(null)).toBe("");
  });
});

describe("matchesCommissionSearch", () => {
  const c = {
    name: "Retoca'Mmmm",
    description: "Trobada de colles de percussió",
    requirements: null,
    members: [{ full_name: "Mercè Puig", nickname: "Nin" }],
  };

  it("matches name, description and members ignoring case and accents", () => {
    expect(matchesCommissionSearch(c, "retoca")).toBe(true);
    expect(matchesCommissionSearch(c, "PERCUSSIO")).toBe(true);
    expect(matchesCommissionSearch(c, "merce")).toBe(true);
    expect(matchesCommissionSearch(c, "nin")).toBe(true);
  });

  it("matches everything on an empty query and nothing unrelated", () => {
    expect(matchesCommissionSearch(c, "  ")).toBe(true);
    expect(matchesCommissionSearch(c, "carnestoltes")).toBe(false);
  });
});

describe("membersWithoutCommission", () => {
  it("returns members not in any commission, in order", () => {
    const members = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const commissions = [{ members: [{ id: "b" }] }, { members: [] }];
    expect(membersWithoutCommission(members, commissions).map((m) => m.id)).toEqual(["a", "c"]);
  });
});
