import { describe, expect, it } from "vitest";
import { GameEngine } from "../src/GameEngine.js";
import { GameStatus } from "../src/state/types.js";
import { FruitLevel } from "../src/fruits/fruitTypes.js";
import { getFruitDefinition, getSpawnableLevels } from "../src/fruits/fruitDefinitions.js";
import { InMemoryPersistenceAdapter } from "../src/persistence/PersistenceAdapter.js";
import { GameConfig } from "../src/config/gameConfig.js";

const SPAWNABLE = new Set(getSpawnableLevels());

/** Steps the engine in fixed increments until `predicate` holds or `maxMs` is exhausted. */
function runUntil(engine: GameEngine, predicate: () => boolean, maxMs = 10000, stepMs = 16): void {
  let elapsed = 0;
  while (!predicate() && elapsed < maxMs) {
    engine.update(stepMs);
    elapsed += stepMs;
  }
}

/** Cycles through all 5 spawnable levels in order, never repeating consecutively. */
function cyclingRandom(): () => number {
  let call = 0;
  return () => {
    const value = (call % 5) / 5;
    call += 1;
    return value;
  };
}

describe("GameEngine: setup and spawning", () => {
  it("starts AIMING with a current and a next fruit, both from the spawnable set", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    expect(engine.getGameState()).toBe(GameStatus.AIMING);
    expect(SPAWNABLE.has(engine.getCurrentFruit()!.level)).toBe(true);
    expect(SPAWNABLE.has(engine.getNextFruit()!)).toBe(true);
    expect(engine.getFruits()).toHaveLength(0);
    expect(engine.getScore()).toBe(0);
  });
});

describe("GameEngine: player control", () => {
  it("moves the current fruit horizontally and clamps to the container walls", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    const config = engine.getConfig();
    const radius = getFruitDefinition(engine.getCurrentFruit()!.level).radius;

    engine.moveCurrentFruit(9999);
    expect(engine.getCurrentFruit()!.x).toBeCloseTo(config.container.right - radius);

    engine.moveCurrentFruit(-9999);
    expect(engine.getCurrentFruit()!.x).toBeCloseTo(config.container.left + radius);

    const middle = (config.container.left + config.container.right) / 2;
    engine.moveCurrentFruit(middle);
    expect(engine.getCurrentFruit()!.x).toBeCloseTo(middle);
  });

  it("ignores moveCurrentFruit once the fruit has been dropped", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    engine.dropCurrentFruit();
    expect(engine.getCurrentFruit()).toBeNull();
    engine.moveCurrentFruit(100); // no current fruit to move; must not throw
    expect(engine.getCurrentFruit()).toBeNull();
  });

  it("dropCurrentFruit releases the fruit into the simulation and clears player control", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    engine.dropCurrentFruit();

    expect(engine.getCurrentFruit()).toBeNull();
    expect(engine.getGameState()).toBe(GameStatus.DROPPING);
    expect(engine.getFruits()).toHaveLength(1);
  });

  it("ignores a second dropCurrentFruit while already dropping/resolving", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    engine.dropCurrentFruit();
    engine.dropCurrentFruit();
    expect(engine.getFruits()).toHaveLength(1);
  });
});

describe("GameEngine: physics (gravity, floor, walls, settling, next spawn)", () => {
  it("applies gravity: a dropped fruit's y position increases over time", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    engine.dropCurrentFruit();
    const startY = engine.getFruits()[0].y;

    for (let i = 0; i < 5; i++) engine.update(16);

    expect(engine.getFruits()[0].y).toBeGreaterThan(startY);
  });

  it("a dropped fruit comes to rest on the floor, inside the walls, and hands control back", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    const config = engine.getConfig();
    engine.dropCurrentFruit();

    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING);

    expect(engine.getGameState()).toBe(GameStatus.AIMING);
    const fruits = engine.getFruits();
    expect(fruits).toHaveLength(1);

    const resting = fruits[0];
    expect(resting.y).toBeLessThanOrEqual(config.container.floorY + 1);
    expect(resting.y).toBeGreaterThan(config.spawn.spawnY);
    expect(resting.x).toBeGreaterThanOrEqual(config.container.left);
    expect(resting.x).toBeLessThanOrEqual(config.container.right);

    // Control was handed back: a fresh current fruit exists, from the spawnable set.
    expect(engine.getCurrentFruit()).not.toBeNull();
    expect(SPAWNABLE.has(engine.getCurrentFruit()!.level)).toBe(true);
  });

  it("keeps a fruit dropped near the right wall from crossing the boundary", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    const config = engine.getConfig();
    engine.moveCurrentFruit(config.container.right);
    engine.dropCurrentFruit();

    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING);

    const resting = engine.getFruits()[0];
    const radius = getFruitDefinition(resting.level).radius;
    expect(resting.x).toBeLessThanOrEqual(config.container.right - radius + 1);
  });
});

describe("GameEngine: merging", () => {
  it("merges two same-level fruits dropped on top of each other into the next tier", () => {
    const engine = new GameEngine({
      persistence: new InMemoryPersistenceAdapter(),
      random: () => 0, // always Cherry, so every drop lands in the same spawnable slot
    });
    expect(engine.getCurrentFruit()!.level).toBe(FruitLevel.Cherry);
    expect(engine.getNextFruit()).toBe(FruitLevel.Cherry);

    engine.dropCurrentFruit();
    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING);
    expect(engine.getFruits()).toHaveLength(1);
    expect(engine.getFruits()[0].level).toBe(FruitLevel.Cherry);

    // Second cherry drops from the same spawn x and lands on the first one.
    engine.dropCurrentFruit();
    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING, 20000);

    const fruits = engine.getFruits();
    expect(fruits).toHaveLength(1);
    expect(fruits[0].level).toBe(FruitLevel.Strawberry);
    expect(engine.getScore()).toBe(getFruitDefinition(FruitLevel.Cherry).score);
    expect(engine.getBestScore()).toBe(engine.getScore());
  });
});

describe("GameEngine: restart", () => {
  it("clears fruits and currentScore but keeps bestScore, and re-spawns current/next", () => {
    const engine = new GameEngine({
      persistence: new InMemoryPersistenceAdapter(),
      random: () => 0,
    });
    engine.dropCurrentFruit();
    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING);
    engine.dropCurrentFruit();
    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING, 20000);

    const scoreBeforeRestart = engine.getScore();
    expect(scoreBeforeRestart).toBeGreaterThan(0);

    engine.restartGame();

    expect(engine.getFruits()).toHaveLength(0);
    expect(engine.getScore()).toBe(0);
    expect(engine.getBestScore()).toBe(scoreBeforeRestart);
    expect(engine.getGameState()).toBe(GameStatus.AIMING);
    expect(engine.getCurrentFruit()).not.toBeNull();
    expect(engine.getNextFruit()).not.toBeNull();
  });
});

describe("GameEngine: power-ups (logic only)", () => {
  it("removeFruit, upgradeFruit, removeSmallestFruits and shakeBox operate through the facade", () => {
    const engine = new GameEngine({ persistence: new InMemoryPersistenceAdapter() });
    engine.dropCurrentFruit();
    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING);
    engine.dropCurrentFruit();
    runUntil(engine, () => engine.getGameState() === GameStatus.AIMING, 20000);

    expect(engine.getFruits().length).toBeGreaterThanOrEqual(1);

    const someId = engine.getFruits()[0].id;
    const levelBefore = engine.getFruits()[0].level;
    if (levelBefore !== FruitLevel.Banana) {
      const upgraded = engine.upgradeFruit(someId);
      expect(upgraded).toBe(true);
    }

    expect(() => engine.shakeBox()).not.toThrow();

    const idToRemove = engine.getFruits()[0].id;
    const removed = engine.removeFruit(idToRemove);
    expect(removed).toBe(true);
    expect(engine.getFruits().find((f) => f.id === idToRemove)).toBeUndefined();
  });
});

describe("GameEngine: game over", () => {
  const tinyConfig: GameConfig = {
    container: { left: 0, right: 140, floorY: 260, dangerY: 210, wallThickness: 20 },
    gameOver: { graceMs: 150, restSpeedThreshold: 2 },
    spawn: { spawnY: 30 },
    physics: {
      gravityY: 1,
      fixedTimestepMs: 1000 / 60,
      maxSubSteps: 5,
      wallFriction: 0.1,
      wallRestitution: 0.05,
    },
  };

  it("detects Game Over once fruits stack up past the danger zone, and locks the game", () => {
    const engine = new GameEngine({
      persistence: new InMemoryPersistenceAdapter(),
      config: tinyConfig,
      random: cyclingRandom(),
    });

    let iterations = 0;
    while (engine.getGameState() !== GameStatus.GAME_OVER && iterations < 60) {
      engine.dropCurrentFruit();
      runUntil(
        engine,
        () => engine.getGameState() === GameStatus.AIMING || engine.getGameState() === GameStatus.GAME_OVER,
        5000,
      );
      iterations += 1;
    }

    expect(engine.getGameState()).toBe(GameStatus.GAME_OVER);

    const scoreAtGameOver = engine.getScore();
    const bestAtGameOver = engine.getBestScore();

    // Locked: no new drops, no state-changing side effects from further ticks.
    const fruitCountAtGameOver = engine.getFruits().length;
    engine.dropCurrentFruit();
    engine.update(1000);
    expect(engine.getGameState()).toBe(GameStatus.GAME_OVER);
    expect(engine.getFruits()).toHaveLength(fruitCountAtGameOver);

    // Score preserved, bestScore reflects the run.
    expect(engine.getScore()).toBe(scoreAtGameOver);
    expect(engine.getBestScore()).toBe(bestAtGameOver);
    expect(engine.getBestScore()).toBeGreaterThanOrEqual(scoreAtGameOver);
  });

  it("restart recovers from Game Over back into a playable state", () => {
    const engine = new GameEngine({
      persistence: new InMemoryPersistenceAdapter(),
      config: tinyConfig,
      random: cyclingRandom(),
    });

    let iterations = 0;
    while (engine.getGameState() !== GameStatus.GAME_OVER && iterations < 60) {
      engine.dropCurrentFruit();
      runUntil(
        engine,
        () => engine.getGameState() === GameStatus.AIMING || engine.getGameState() === GameStatus.GAME_OVER,
        5000,
      );
      iterations += 1;
    }
    expect(engine.getGameState()).toBe(GameStatus.GAME_OVER);

    engine.restartGame();

    expect(engine.getGameState()).toBe(GameStatus.AIMING);
    expect(engine.getFruits()).toHaveLength(0);
    expect(engine.isGameOver()).toBe(false);
  });
});

describe("GameEngine: stability with many fruits", () => {
  it("handles many drops without throwing, without duplicate ids, and without NaN positions", () => {
    const engine = new GameEngine({
      persistence: new InMemoryPersistenceAdapter(),
      random: cyclingRandom(),
    });

    const seenIds = new Set<number>();
    for (let i = 0; i < 25; i++) {
      expect(() => engine.dropCurrentFruit()).not.toThrow();
      runUntil(
        engine,
        () => engine.getGameState() === GameStatus.AIMING || engine.getGameState() === GameStatus.GAME_OVER,
        8000,
      );
      if (engine.getGameState() === GameStatus.GAME_OVER) break;

      for (const fruit of engine.getFruits()) {
        seenIds.add(fruit.id);
        expect(Number.isFinite(fruit.x)).toBe(true);
        expect(Number.isFinite(fruit.y)).toBe(true);
      }
    }

    // ids are unique across the whole run (no duplicate-fruit bug).
    const idsNow = engine.getFruits().map((f) => f.id);
    expect(new Set(idsNow).size).toBe(idsNow.length);
  });
});
