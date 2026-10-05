import { describe, expect, it } from "vitest";
import { safeNextPath } from "../safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/bolos/123?x=1")).toBe("/bolos/123?x=1");
  });

  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "@evil.com", "evil.com", ""])(
    "rejects %j",
    (value) => {
      expect(safeNextPath(value)).toBe("/bolos");
    },
  );

  it("falls back when missing", () => {
    expect(safeNextPath(null)).toBe("/bolos");
    expect(safeNextPath(undefined, "/x")).toBe("/x");
  });
});
