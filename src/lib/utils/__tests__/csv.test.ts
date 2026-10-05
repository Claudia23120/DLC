import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "../csv";

describe("csvCell", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("renders null/undefined as empty and keeps numbers", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(12)).toBe("12");
    expect(csvCell(-3)).toBe("-3");
  });

  it("neutralises spreadsheet formulas in text", () => {
    expect(csvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(csvCell("+34600111222")).toBe("'+34600111222");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
});

describe("csvRow", () => {
  it("joins cells with commas", () => {
    expect(csvRow(["a", 1, null])).toBe("a,1,");
  });
});
