import { describe, expect, it } from "vitest";
import { PhysicsWorld } from "../src/physics/PhysicsWorld.js";
import { MergeSystem } from "../src/systems/MergeSystem.js";
import { ScoreSystem } from "../src/systems/ScoreSystem.js";
import { InMemoryPersistenceAdapter } from "../src/persistence/PersistenceAdapter.js";
import { getFruitDefinition } from "../src/fruits/fruitDefinitions.js";
import { FruitLevel } from "../src/fruits/fruitTypes.js";
import { DEFAULT_GAME_CONFIG } from "../src/config/gameConfig.js";

function setup() {
  const physics = new PhysicsWorld(DEFAULT_GAME_CONFIG.container, {
    ...DEFAULT_GAME_CONFIG.physics,
    gravityY: 0, // isolate collision/merge behavior from gravity for these tests
  });
  const score = new ScoreSystem(new InMemoryPersistenceAdapter());
  const merge = new MergeSystem(physics, score);
  return { physics, score, merge };
}

/** Places two same-level bodies barely overlapping so they collide on the very next step. */
function placeTouchingPair(physics: PhysicsWorld, level: FruitLevel, x = 300, y = 300) {
  const def = getFruitDefinition(level);
  const overlap = 1; // force contact
  const a = physics.createFruitBody(def, x - def.radius + overlap / 2, y);
  const b = physics.createFruitBody(def, x + def.radius - overlap / 2, y);
  return { a, b };
}

describe("MergeSystem", () => {
  it("merges two touching same-level fruits into the next level and awards score", () => {
    const { physics, score, merge } = setup();
    placeTouchingPair(physics, FruitLevel.Cherry);

    physics.step(20);
    const results = merge.processPendingMerges();

    expect(results).toHaveLength(1);
    expect(results[0].fromLevel).toBe(FruitLevel.Cherry);
    expect(results[0].toLevel).toBe(FruitLevel.Strawberry);

    const fruits = physics.getFruitBodies();
    expect(fruits).toHaveLength(1);
    expect(fruits[0].plugin.fruit.level).toBe(FruitLevel.Strawberry);
    expect(score.getCurrentScore()).toBe(getFruitDefinition(FruitLevel.Cherry).score);
  });

  it("does not merge two touching fruits of different levels", () => {
    const { physics, merge } = setup();
    const cherry = getFruitDefinition(FruitLevel.Cherry);
    const strawberry = getFruitDefinition(FruitLevel.Strawberry);
    physics.createFruitBody(cherry, 300 - cherry.radius + 1, 300);
    physics.createFruitBody(strawberry, 300 + strawberry.radius - 1, 300);

    physics.step(20);
    const results = merge.processPendingMerges();

    expect(results).toHaveLength(0);
    expect(physics.getFruitBodies()).toHaveLength(2);
  });

  it("does not merge two touching max-level (Banana) fruits", () => {
    const { physics, merge } = setup();
    placeTouchingPair(physics, FruitLevel.Banana);

    physics.step(20);
    const results = merge.processPendingMerges();

    expect(results).toHaveLength(0);
    expect(physics.getFruitBodies()).toHaveLength(2);
  });

  it("never merges a fruit that is already committed to another merge (no duplicate merges)", () => {
    const { physics, merge } = setup();
    const { a } = placeTouchingPair(physics, FruitLevel.Cherry);
    // Simulate `a` already being claimed by a different pending merge this tick.
    a.plugin.fruit.merging = true;

    physics.step(20);
    const results = merge.processPendingMerges();

    expect(results).toHaveLength(0);
    // Both original bodies must still be present, untouched.
    expect(physics.getFruitBodies()).toHaveLength(2);
  });

  it("supports merge chains: Cherry+Cherry -> Strawberry, then Strawberry+Strawberry -> Grape", () => {
    const { physics, merge } = setup();
    placeTouchingPair(physics, FruitLevel.Cherry, 300, 300);

    physics.step(20);
    let results = merge.processPendingMerges();
    expect(results[0].toLevel).toBe(FruitLevel.Strawberry);

    const [merged] = physics.getFruitBodies();
    expect(merged.plugin.fruit.level).toBe(FruitLevel.Strawberry);

    // Bring a second, freshly-created Strawberry into contact with the merged one.
    const strawberryDef = getFruitDefinition(FruitLevel.Strawberry);
    physics.createFruitBody(
      strawberryDef,
      merged.position.x + strawberryDef.radius * 2 - 1,
      merged.position.y,
    );

    physics.step(20);
    results = merge.processPendingMerges();

    expect(results).toHaveLength(1);
    expect(results[0].fromLevel).toBe(FruitLevel.Strawberry);
    expect(results[0].toLevel).toBe(FruitLevel.Grape);
    expect(physics.getFruitBodies()).toHaveLength(1);
    expect(physics.getFruitBodies()[0].plugin.fruit.level).toBe(FruitLevel.Grape);
  });

  it("assigns every created fruit body a unique id, even across merges", () => {
    const { physics, merge } = setup();
    placeTouchingPair(physics, FruitLevel.Cherry);
    physics.step(20);
    merge.processPendingMerges();

    placeTouchingPair(physics, FruitLevel.Cherry, 500, 300);
    physics.step(20);
    merge.processPendingMerges();

    const ids = physics.getFruitBodies().map((b) => b.plugin.fruit.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
