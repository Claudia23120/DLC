import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl, icsFilename } from "../ics";

const event = {
  uid: "abc",
  title: "Correfoc, Les Corts",
  location: "Plaça; Major",
  description: "Línia 1\nLínia 2",
  start: "2026-07-15T19:30:00.000Z",
};

describe("buildIcs", () => {
  const ics = buildIcs(event);

  it("is a well-formed single-event calendar with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("UID:abc@diableslescorts.cat");
    expect(ics).toContain("DTSTART:20260715T193000Z");
  });

  it("defaults to a two hour duration", () => {
    expect(ics).toContain("DTEND:20260715T213000Z");
  });

  it("escapes reserved characters", () => {
    expect(ics).toContain("SUMMARY:Correfoc\\, Les Corts");
    expect(ics).toContain("LOCATION:Plaça\\; Major");
    expect(ics).toContain("DESCRIPTION:Línia 1\\nLínia 2");
  });
});

describe("googleCalendarUrl / icsFilename", () => {
  it("builds a template URL", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20260715T193000Z/20260715T213000Z");
  });

  it("makes a safe filename", () => {
    expect(icsFilename("Correfoc: Les Corts!")).toBe("correfoc-les-corts.ics");
  });
});
