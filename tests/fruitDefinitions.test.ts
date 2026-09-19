import { describe, expect, it } from "vitest";
import {
  getAllFruitDefinitions,
  getFruitDefinition,
  getSpawnableLevels,
  isMaxLevel,
} from "../src/fruits/fruitDefinitions.js";
import { FruitLevel } from "../src/fruits/fruitTypes.js";

describe("fruit definitions table", () => {
  it("has exactly the 11 required fruits, in order", () => {
    const names = getAllFruitDefinitions().map((d) => d.name);
    expect(names).toEqual([
      "Cherry",
      "Strawberry",
      "Grape",
      "Mango",
      "Apple",
      "Pear",
      "Peach",
      "Pineapple",
      "Melon",
      "Watermelon",
      "Banana",
    ]);
  });

  it("has strictly increasing collider radius by level", () => {
    const radii = getAllFruitDefinitions().map((d) => d.radius);
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
  });

  it("chains each level to the next, ending with Banana at the top", () => {
    expect(getFruitDefinition(FruitLevel.Cherry).nextLevel).toBe(FruitLevel.Strawberry);
    expect(getFruitDefinition(FruitLevel.Watermelon).nextLevel).toBe(FruitLevel.Banana);
    expect(getFruitDefinition(FruitLevel.Banana).nextLevel).toBeNull();
    expect(isMaxLevel(FruitLevel.Banana)).toBe(true);
  });

  it("only allows Cherry..Apple to be generated directly by NEXT", () => {
    const spawnable = getSpawnableLevels();
    expect(spawnable).toEqual([
      FruitLevel.Cherry,
      FruitLevel.Strawberry,
      FruitLevel.Grape,
      FruitLevel.Mango,
      FruitLevel.Apple,
    ]);
    for (const level of spawnable) {
      expect(level).toBeLessThanOrEqual(FruitLevel.Apple);
    }
  });

  it("never marks Pear..Banana as spawnable", () => {
    const nonSpawnable = [
      FruitLevel.Pear,
      FruitLevel.Peach,
      FruitLevel.Pineapple,
      FruitLevel.Melon,
      FruitLevel.Watermelon,
      FruitLevel.Banana,
    ];
    for (const level of nonSpawnable) {
      expect(getFruitDefinition(level).spawnable).toBe(false);
    }
  });
});
