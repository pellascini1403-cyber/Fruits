import Matter from "matter-js";
import { FruitDefinition, FruitLevel } from "../fruits/fruitTypes.js";
import { ContainerConfig, PhysicsConfig } from "../config/gameConfig.js";

const { Engine, Bodies, Body, Composite, Events } = Matter;

export const FRUIT_COLLISION_CATEGORY = 0x0001;
export const WALL_COLLISION_CATEGORY = 0x0002;

/** Custom data every fruit body carries. Kept out of the UI entirely. */
export interface FruitBodyData {
  id: number;
  level: FruitLevel;
  /** Set true the instant a body is committed to a merge, so it can never merge twice. */
  merging: boolean;
}

export interface FruitBody extends Matter.Body {
  plugin: { fruit: FruitBodyData };
}

export function isFruitBody(body: Matter.Body): body is FruitBody {
  return Boolean((body.plugin as { fruit?: FruitBodyData } | undefined)?.fruit);
}

export type CollisionListener = (bodyA: FruitBody, bodyB: FruitBody) => void;

/**
 * Thin wrapper around Matter.js. This is the ONLY module that talks to the
 * physics library directly — everything else in the engine works with plain
 * fruit levels / ids / positions, never with Matter types.
 */
export class PhysicsWorld {
  private readonly engine: Matter.Engine;
  private readonly container: ContainerConfig;
  private readonly physicsConfig: PhysicsConfig;
  private accumulatorMs = 0;
  private nextBodyId = 1;
  private collisionListeners: CollisionListener[] = [];

  constructor(container: ContainerConfig, physicsConfig: PhysicsConfig) {
    this.container = container;
    this.physicsConfig = physicsConfig;
    this.engine = Engine.create({
      gravity: { x: 0, y: physicsConfig.gravityY },
    });
    this.buildWalls();
    this.wireCollisionEvents();
  }

  private buildWalls(): void {
    const { left, right, floorY, wallThickness } = this.container;
    const width = right - left;
    const centerX = left + width / 2;
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: this.physicsConfig.wallFriction,
      restitution: this.physicsConfig.wallRestitution,
      label: "wall",
      collisionFilter: {
        category: WALL_COLLISION_CATEGORY,
        mask: FRUIT_COLLISION_CATEGORY,
      },
    };

    const floor = Bodies.rectangle(
      centerX,
      floorY + wallThickness / 2,
      width + wallThickness * 2,
      wallThickness,
      wallOptions,
    );
    const leftWall = Bodies.rectangle(
      left - wallThickness / 2,
      floorY / 2,
      wallThickness,
      floorY + wallThickness * 2,
      wallOptions,
    );
    const rightWall = Bodies.rectangle(
      right + wallThickness / 2,
      floorY / 2,
      wallThickness,
      floorY + wallThickness * 2,
      wallOptions,
    );

    Composite.add(this.engine.world, [floor, leftWall, rightWall]);
  }

  private wireCollisionEvents(): void {
    Events.on(this.engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        if (isFruitBody(bodyA) && isFruitBody(bodyB)) {
          for (const listener of this.collisionListeners) {
            listener(bodyA, bodyB);
          }
        }
      }
    });
  }

  onFruitCollision(listener: CollisionListener): void {
    this.collisionListeners.push(listener);
  }

  createFruitBody(definition: FruitDefinition, x: number, y: number, angle = 0): FruitBody {
    const body = Bodies.circle(x, y, definition.radius, {
      mass: definition.mass,
      density: definition.density,
      friction: definition.friction,
      restitution: definition.restitution,
      angle,
      label: `fruit:${definition.name}`,
      collisionFilter: {
        category: FRUIT_COLLISION_CATEGORY,
        mask: FRUIT_COLLISION_CATEGORY | WALL_COLLISION_CATEGORY,
      },
    }) as FruitBody;

    body.plugin.fruit = {
      id: this.nextBodyId++,
      level: definition.level,
      merging: false,
    };

    Composite.add(this.engine.world, body);
    return body;
  }

  removeBody(body: Matter.Body): void {
    Composite.remove(this.engine.world, body);
  }

  getFruitBodies(): FruitBody[] {
    return Composite.allBodies(this.engine.world).filter(isFruitBody) as FruitBody[];
  }

  setVelocity(body: Matter.Body, x: number, y: number): void {
    Body.setVelocity(body, { x, y });
  }

  applyImpulse(body: Matter.Body, x: number, y: number): void {
    Body.applyForce(body, body.position, { x, y });
  }

  clearAllFruits(): void {
    for (const body of this.getFruitBodies()) {
      this.removeBody(body);
    }
  }

  /** Advances the simulation by deltaMs using a fixed timestep accumulator. */
  step(deltaMs: number): void {
    this.accumulatorMs += deltaMs;
    const step = this.physicsConfig.fixedTimestepMs;
    let steps = 0;
    while (this.accumulatorMs >= step && steps < this.physicsConfig.maxSubSteps) {
      Engine.update(this.engine, step);
      this.accumulatorMs -= step;
      steps += 1;
    }
    // Drop any excess so a single huge delta (tab backgrounded) can't cause
    // a burst of catch-up steps later.
    if (steps === this.physicsConfig.maxSubSteps) {
      this.accumulatorMs = 0;
    }
  }
}
