import { describe, expect, it } from "vitest";
import { InMemoryPersistenceAdapter } from "../src/persistence/PersistenceAdapter.js";

describe("InMemoryPersistenceAdapter", () => {
  it("returns null for a key that was never set", () => {
    const adapter = new InMemoryPersistenceAdapter();
    expect(adapter.getItem("missing")).toBeNull();
  });

  it("round-trips a stored value", () => {
    const adapter = new InMemoryPersistenceAdapter();
    adapter.setItem("k", "123");
    expect(adapter.getItem("k")).toBe("123");
  });
});
