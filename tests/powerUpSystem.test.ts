import { describe, expect, it } from "vitest";
import { PhysicsWorld } from "../src/physics/PhysicsWorld.js";
import { PowerUpSystem } from "../src/systems/PowerUpSystem.js";
import { getFruitDefinition } from "../src/fruits/fruitDefinitions.js";
import { FruitLevel } from "../src/fruits/fruitTypes.js";
import { DEFAULT_GAME_CONFIG } from "../src/config/gameConfig.js";

function setup() {
  const physics = new PhysicsWorld(DEFAULT_GAME_CONFIG.container, {
    ...DEFAULT_GAME_CONFIG.physics,
    gravityY: 0,
  });
  const powerUps = new PowerUpSystem(physics, () => 0.5);
  return { physics, powerUps };
}

describe("PowerUpSystem", () => {
  it("removeFruit removes exactly the targeted fruit by id", () => {
    const { physics, powerUps } = setup();
    const a = physics.createFruitBody(getFruitDefinition(FruitLevel.Cherry), 100, 100);
    const b = physics.createFruitBody(getFruitDefinition(FruitLevel.Grape), 200, 100);

    const removed = powerUps.removeFruit(a.plugin.fruit.id);

    expect(removed).toBe(true);
    const remaining = physics.getFruitBodies();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].plugin.fruit.id).toBe(b.plugin.fruit.id);
  });

  it("removeFruit returns false for an unknown id and changes nothing", () => {
    const { physics, powerUps } = setup();
    physics.createFruitBody(getFruitDefinition(FruitLevel.Cherry), 100, 100);
    expect(powerUps.removeFruit(999999)).toBe(false);
    expect(physics.getFruitBodies()).toHaveLength(1);
  });

  it("removeSmallFruits removes every spawnable-level fruit and keeps every large (merge-only) one", () => {
    const { physics, powerUps } = setup();
    physics.createFruitBody(getFruitDefinition(FruitLevel.Banana), 50, 100);
    physics.createFruitBody(getFruitDefinition(FruitLevel.Cherry), 150, 100);
    physics.createFruitBody(getFruitDefinition(FruitLevel.Pear), 250, 100);
    physics.createFruitBody(getFruitDefinition(FruitLevel.Strawberry), 350, 100);

    const removedIds = powerUps.removeSmallFruits();

    expect(removedIds).toHaveLength(2);
    const remainingLevels = physics.getFruitBodies().map((b) => b.plugin.fruit.level).sort();
    expect(remainingLevels).toEqual([FruitLevel.Pear, FruitLevel.Banana].sort());
  });

  it("upgradeFruit promotes a fruit exactly one level and preserves its id-less identity/position", () => {
    const { physics, powerUps } = setup();
    const grape = physics.createFruitBody(getFruitDefinition(FruitLevel.Grape), 300, 300);

    const upgraded = powerUps.upgradeFruit(grape.plugin.fruit.id);

    expect(upgraded).toBe(true);
    const fruits = physics.getFruitBodies();
    expect(fruits).toHaveLength(1);
    expect(fruits[0].plugin.fruit.level).toBe(FruitLevel.Mango);
    expect(fruits[0].position.x).toBeCloseTo(300);
    expect(fruits[0].position.y).toBeCloseTo(300);
  });

  it("upgradeFruit is a no-op on the max level fruit (Banana)", () => {
    const { physics, powerUps } = setup();
    const banana = physics.createFruitBody(getFruitDefinition(FruitLevel.Banana), 300, 300);

    const upgraded = powerUps.upgradeFruit(banana.plugin.fruit.id);

    expect(upgraded).toBe(false);
    expect(physics.getFruitBodies()).toHaveLength(1);
    expect(physics.getFruitBodies()[0].plugin.fruit.level).toBe(FruitLevel.Banana);
  });

  it("shakeBox applies an impulse without changing the number of fruits in play", () => {
    const { physics, powerUps } = setup();
    physics.createFruitBody(getFruitDefinition(FruitLevel.Cherry), 100, 100);
    physics.createFruitBody(getFruitDefinition(FruitLevel.Apple), 200, 100);

    expect(() => powerUps.shakeBox()).not.toThrow();
    expect(physics.getFruitBodies()).toHaveLength(2);
  });
});
