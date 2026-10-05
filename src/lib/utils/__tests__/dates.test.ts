import { afterEach, describe, expect, it, vi } from "vitest";
import { isPast, madridDateTimeToISO, madridParts } from "../dates";

describe("madridDateTimeToISO", () => {
  it("uses CEST (UTC+2) in summer", () => {
    expect(madridDateTimeToISO("2026-07-15", "21:30")).toBe("2026-07-15T19:30:00.000Z");
  });

  it("uses CET (UTC+1) in winter", () => {
    expect(madridDateTimeToISO("2026-01-15", "21:30")).toBe("2026-01-15T20:30:00.000Z");
  });

  it("defaults the time to midnight and rejects an empty date", () => {
    expect(madridDateTimeToISO("2026-01-15", "")).toBe("2026-01-14T23:00:00.000Z");
    expect(madridDateTimeToISO("", "10:00")).toBeNull();
  });

  it("round-trips through madridParts", () => {
    const iso = madridDateTimeToISO("2026-03-29", "12:00")!; // day DST starts
    expect(madridParts(iso)).toMatchObject({ year: 2026, month: 3, day: 29, hour: 12, minute: 0 });
  });
});

describe("isPast", () => {
  afterEach(() => vi.useRealTimers());

  it("compares against now and treats null as not past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
    expect(isPast("2026-05-31T12:00:00Z")).toBe(true);
    expect(isPast("2026-06-02T12:00:00Z")).toBe(false);
    expect(isPast(null)).toBe(false);
  });
});
