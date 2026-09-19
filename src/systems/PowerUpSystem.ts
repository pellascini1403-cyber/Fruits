import { getFruitDefinition, isMaxLevel } from "../fruits/fruitDefinitions.js";
import { PhysicsWorld } from "../physics/PhysicsWorld.js";

export type RandomSource = () => number;

/**
 * Pure engine-side logic for the four power-ups the spec asks to be
 * *prepared* (no UI, no economy, no currency): remove one fruit, remove the
 * smallest fruits in play, upgrade one fruit a level, and shake the box.
 * A future interface wires buttons/costs to these calls; this system knows
 * nothing about that.
 */
export class PowerUpSystem {
  constructor(
    private readonly physics: PhysicsWorld,
    private readonly random: RandomSource = Math.random,
  ) {}

  /** Removes one specific fruit from play, identified by its instance id. Returns whether it existed. */
  removeFruit(id: number): boolean {
    const body = this.physics.getFruitBodies().find((b) => b.plugin.fruit.id === id);
    if (!body) {
      return false;
    }
    this.physics.removeBody(body);
    return true;
  }

  /**
   * Removes the `count` smallest-level fruits currently in play (ties broken
   * by lowest id, for determinism). Configurable via `count` so the rule can
   * be balanced without touching the implementation.
   */
  removeSmallestFruits(count = 3): number[] {
    const sorted = [...this.physics.getFruitBodies()].sort((a, b) => {
      const levelDiff = a.plugin.fruit.level - b.plugin.fruit.level;
      return levelDiff !== 0 ? levelDiff : a.plugin.fruit.id - b.plugin.fruit.id;
    });

    const toRemove = sorted.slice(0, Math.max(0, count));
    for (const body of toRemove) {
      this.physics.removeBody(body);
    }
    return toRemove.map((b) => b.plugin.fruit.id);
  }

  /** Upgrades one specific fruit a single level (e.g. Grape -> Mango). No-op on max level. Returns success. */
  upgradeFruit(id: number): boolean {
    const body = this.physics.getFruitBodies().find((b) => b.plugin.fruit.id === id);
    if (!body) {
      return false;
    }
    if (isMaxLevel(body.plugin.fruit.level)) {
      return false;
    }

    const nextLevel = getFruitDefinition(body.plugin.fruit.level).nextLevel;
    if (nextLevel === null) {
      return false;
    }

    const { x, y } = body.position;
    const velocity = { ...body.velocity };
    this.physics.removeBody(body);

    const newBody = this.physics.createFruitBody(getFruitDefinition(nextLevel), x, y, body.angle);
    this.physics.setVelocity(newBody, velocity.x, velocity.y);
    return true;
  }

  /** Gives every fruit currently in play a small random impulse, to break up stable stacks. */
  shakeBox(strength = 0.02): void {
    for (const body of this.physics.getFruitBodies()) {
      const fx = (this.random() * 2 - 1) * strength * body.mass;
      const fy = -this.random() * strength * body.mass;
      this.physics.applyImpulse(body, fx, fy);
    }
  }
}
