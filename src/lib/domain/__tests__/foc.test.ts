import { describe, expect, it } from "vitest";
import { defaultFocConfig, focStorageKey, focUid } from "../foc";

describe("defaultFocConfig", () => {
  it("seeds two trams and the standard task rows", () => {
    const cfg = defaultFocConfig("Correfoc", ["Anna", "Pau"]);
    expect(cfg.title).toBe("Correfoc");
    expect(cfg.cremadors).toEqual(["Anna", "Pau"]);
    expect(cfg.trams.map((t) => t.name)).toEqual(["Tram 1", "Tram 2"]);
    expect(cfg.tasks.map((t) => t.label)).toEqual(["Fogall", "Carro", "Repartidors Piro"]);
  });

  it("falls back to a default title and copies the cremadors list", () => {
    const names = ["Anna"];
    const cfg = defaultFocConfig("", names);
    expect(cfg.title).toBe("Correfoc");
    names.push("Pau");
    expect(cfg.cremadors).toEqual(["Anna"]);
  });
});

describe("focUid / focStorageKey", () => {
  it("generates distinct ids", () => {
    expect(focUid()).not.toBe(focUid());
  });

  it("namespaces the storage key per event", () => {
    expect(focStorageKey("42")).toBe("foc-config:42");
  });
});
