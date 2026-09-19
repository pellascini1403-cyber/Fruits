import { describe, expect, it } from "vitest";
import { NextFruitSystem } from "../src/systems/NextFruitSystem.js";
import { getSpawnableLevels } from "../src/fruits/fruitDefinitions.js";
import { FruitLevel } from "../src/fruits/fruitTypes.js";

describe("NextFruitSystem", () => {
  it("only ever generates spawnable levels (Cherry..Apple), never Pear..Banana", () => {
    const spawnable = new Set(getSpawnableLevels());
    // Deterministic sweep across the whole [0,1) range the RNG can produce.
    let call = 0;
    const totalCalls = 200;
    const system = new NextFruitSystem(() => {
      const value = call / totalCalls;
      call += 1;
      return value;
    });

    for (let i = 0; i < totalCalls; i++) {
      const level = system.generate();
      expect(spawnable.has(level)).toBe(true);
      expect(level).toBeLessThanOrEqual(FruitLevel.Apple);
    }
  });

  it("is deterministic for a fixed random source", () => {
    const fixed = () => 0;
    const a = new NextFruitSystem(fixed).generate();
    const b = new NextFruitSystem(fixed).generate();
    expect(a).toBe(b);
    expect(a).toBe(FruitLevel.Cherry);
  });
});
