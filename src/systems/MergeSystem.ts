import { FruitLevel } from "../fruits/fruitTypes.js";
import { getFruitDefinition } from "../fruits/fruitDefinitions.js";
import { FruitBody, PhysicsWorld } from "../physics/PhysicsWorld.js";
import { ScoreSystem } from "./ScoreSystem.js";

export interface MergeResult {
  readonly fromLevel: FruitLevel;
  readonly toLevel: FruitLevel;
  readonly x: number;
  readonly y: number;
}

interface PendingMerge {
  readonly bodyA: FruitBody;
  readonly bodyB: FruitBody;
  readonly level: FruitLevel;
  readonly x: number;
  readonly y: number;
}

/**
 * Turns raw same-level collisions into merges, safely.
 *
 * Safety model: the instant a collision between two same-level, not-yet-
 * merging fruits is seen, BOTH bodies are flagged `merging = true`
 * synchronously. That flag is checked before anything else, so:
 *   - the same fruit can never be queued into two merges,
 *   - a duplicate collisionStart event for the same pair is a no-op,
 *   - chains resolve naturally over successive ticks as newly created
 *     fruits collide again, each still going through this same guard.
 *
 * The actual world mutation (removing the pair, creating the result) is
 * deferred to `processPendingMerges()`, called after the physics step
 * completes, so bodies are never added/removed while Matter is mid-update.
 */
export class MergeSystem {
  private pending: PendingMerge[] = [];

  constructor(
    private readonly physics: PhysicsWorld,
    private readonly score: ScoreSystem,
  ) {
    this.physics.onFruitCollision((bodyA, bodyB) => this.handleCollision(bodyA, bodyB));
  }

  private handleCollision(bodyA: FruitBody, bodyB: FruitBody): void {
    const dataA = bodyA.plugin.fruit;
    const dataB = bodyB.plugin.fruit;

    if (dataA.merging || dataB.merging) {
      return;
    }
    if (dataA.level !== dataB.level) {
      return;
    }

    const definition = getFruitDefinition(dataA.level);
    if (definition.nextLevel === null) {
      // Max-level fruits collide but never merge further.
      return;
    }

    dataA.merging = true;
    dataB.merging = true;

    this.pending.push({
      bodyA,
      bodyB,
      level: dataA.level,
      x: (bodyA.position.x + bodyB.position.x) / 2,
      y: (bodyA.position.y + bodyB.position.y) / 2,
    });
  }

  /** Call once per tick, after `PhysicsWorld.step()`. Returns every merge resolved this tick. */
  processPendingMerges(): MergeResult[] {
    if (this.pending.length === 0) {
      return [];
    }

    const batch = this.pending;
    this.pending = [];

    const results: MergeResult[] = [];
    for (const merge of batch) {
      this.physics.removeBody(merge.bodyA);
      this.physics.removeBody(merge.bodyB);

      const nextLevel = getFruitDefinition(merge.level).nextLevel;
      if (nextLevel === null) {
        continue;
      }

      const nextDefinition = getFruitDefinition(nextLevel);
      this.physics.createFruitBody(nextDefinition, merge.x, merge.y);
      this.score.addPoints(getFruitDefinition(merge.level).score);

      results.push({ fromLevel: merge.level, toLevel: nextLevel, x: merge.x, y: merge.y });
    }
    return results;
  }

  hasPendingMerges(): boolean {
    return this.pending.length > 0;
  }
}
