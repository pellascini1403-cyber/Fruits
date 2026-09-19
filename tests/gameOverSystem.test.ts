import { describe, expect, it } from "vitest";
import { GameOverSystem } from "../src/systems/GameOverSystem.js";

const DANGER_Y = 100;
const CONFIG = { graceMs: 1000, restSpeedThreshold: 0.5 };

describe("GameOverSystem", () => {
  it("does not trigger while under the grace period", () => {
    const system = new GameOverSystem(DANGER_Y, CONFIG);
    expect(system.update(500, [{ topY: 50, speed: 0 }])).toBe(false);
    expect(system.isGameOver()).toBe(false);
  });

  it("triggers once a settled fruit has stayed above the danger line past the grace period", () => {
    const system = new GameOverSystem(DANGER_Y, CONFIG);
    system.update(999, [{ topY: 50, speed: 0 }]);
    expect(system.isGameOver()).toBe(false);
    const gameOver = system.update(2, [{ topY: 50, speed: 0 }]);
    expect(gameOver).toBe(true);
    expect(system.isGameOver()).toBe(true);
  });

  it("resets tolerance if the fruit drops back below the danger line", () => {
    const system = new GameOverSystem(DANGER_Y, CONFIG);
    system.update(900, [{ topY: 50, speed: 0 }]);
    system.update(100, [{ topY: 150, speed: 0 }]); // below the line: resets
    expect(system.update(999, [{ topY: 50, speed: 0 }])).toBe(false);
  });

  it("does not count a fruit still moving fast (bounce/fall-through) as dangerous", () => {
    const system = new GameOverSystem(DANGER_Y, CONFIG);
    // Above the line but moving fast (still bouncing) for way longer than the grace period.
    expect(system.update(5000, [{ topY: 50, speed: 5 }])).toBe(false);
  });

  it("is a one-way trigger: it will not un-trigger once fired, until reset()", () => {
    const system = new GameOverSystem(DANGER_Y, CONFIG);
    system.update(1000, [{ topY: 50, speed: 0 }]);
    expect(system.isGameOver()).toBe(true);
    expect(system.update(0, [{ topY: 150, speed: 0 }])).toBe(true);

    system.reset();
    expect(system.isGameOver()).toBe(false);
  });
});
