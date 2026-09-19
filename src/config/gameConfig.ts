/**
 * Every tunable, non-fruit-specific constant lives here so balancing never
 * requires hunting through the systems for a hardcoded number.
 */
export interface ContainerConfig {
  readonly left: number;
  readonly right: number;
  readonly floorY: number;
  /** Y coordinate of the top danger line. A fruit resting with its top above this is at risk. */
  readonly dangerY: number;
  readonly wallThickness: number;
}

export interface GameOverConfig {
  /** How long (ms) a fruit may sit above the danger line before it's Game Over. */
  readonly graceMs: number;
  /** Speed below which a fruit counts as "settled" rather than still falling/bouncing. */
  readonly restSpeedThreshold: number;
}

export interface SpawnConfig {
  /** Y coordinate where a new current fruit appears, under player control. */
  readonly spawnY: number;
}

export interface PhysicsConfig {
  readonly gravityY: number;
  /** Fixed timestep (ms) the simulation is stepped with. */
  readonly fixedTimestepMs: number;
  /** Max sub-steps per update() call, to avoid a spiral of death on a slow tick. */
  readonly maxSubSteps: number;
  readonly wallFriction: number;
  readonly wallRestitution: number;
}

export interface GameConfig {
  readonly container: ContainerConfig;
  readonly gameOver: GameOverConfig;
  readonly spawn: SpawnConfig;
  readonly physics: PhysicsConfig;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  container: {
    left: 0,
    right: 640,
    floorY: 800,
    dangerY: 100,
    wallThickness: 20,
  },
  gameOver: {
    graceMs: 1000,
    restSpeedThreshold: 0.5,
  },
  spawn: {
    spawnY: 60,
  },
  physics: {
    gravityY: 1,
    fixedTimestepMs: 1000 / 60,
    maxSubSteps: 5,
    wallFriction: 0.1,
    wallRestitution: 0.1,
  },
};
