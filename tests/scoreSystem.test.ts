import { describe, expect, it } from "vitest";
import { ScoreSystem } from "../src/systems/ScoreSystem.js";
import { InMemoryPersistenceAdapter } from "../src/persistence/PersistenceAdapter.js";

describe("ScoreSystem", () => {
  it("starts at zero score and zero best score", () => {
    const score = new ScoreSystem(new InMemoryPersistenceAdapter());
    expect(score.getCurrentScore()).toBe(0);
    expect(score.getBestScore()).toBe(0);
  });

  it("accumulates points and raises bestScore only when beaten", () => {
    const score = new ScoreSystem(new InMemoryPersistenceAdapter());
    score.addPoints(10);
    expect(score.getCurrentScore()).toBe(10);
    expect(score.getBestScore()).toBe(10);

    score.addPoints(5);
    expect(score.getCurrentScore()).toBe(15);
    expect(score.getBestScore()).toBe(15);
  });

  it("keeps bestScore across a currentScore reset (restart)", () => {
    const score = new ScoreSystem(new InMemoryPersistenceAdapter());
    score.addPoints(42);
    score.resetCurrentScore();
    expect(score.getCurrentScore()).toBe(0);
    expect(score.getBestScore()).toBe(42);
  });

  it("persists bestScore across ScoreSystem instances via the shared adapter", () => {
    const adapter = new InMemoryPersistenceAdapter();
    const first = new ScoreSystem(adapter);
    first.addPoints(77);

    const second = new ScoreSystem(adapter);
    expect(second.getBestScore()).toBe(77);
  });

  it("never lowers bestScore on a worse run", () => {
    const adapter = new InMemoryPersistenceAdapter();
    const first = new ScoreSystem(adapter);
    first.addPoints(100);
    first.resetCurrentScore();

    const second = new ScoreSystem(adapter);
    second.addPoints(10);
    expect(second.getCurrentScore()).toBe(10);
    expect(second.getBestScore()).toBe(100);
  });
});
