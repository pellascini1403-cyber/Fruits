import { FruitLevel } from "../fruits/fruitTypes.js";

/**
 * Internal game states. These are NOT UI screens — a future interface reads
 * this value and decides how to react; the engine never renders anything.
 */
export enum GameStatus {
  /** Engine constructed/restarted but the first fruits haven't been spawned yet. */
  READY = "READY",
  /** A current fruit exists and is under player control (movable, droppable). */
  AIMING = "AIMING",
  /** The current fruit has been released and is falling, before first contact. */
  DROPPING = "DROPPING",
  /** Collisions/merge chains are being resolved; no new drop is allowed yet. */
  RESOLVING = "RESOLVING",
  /** Terminal state. No further drops or merges are processed until restart. */
  GAME_OVER = "GAME_OVER",
}

/** A fruit that is under player control, not yet part of the physics simulation. */
export interface CurrentFruitState {
  readonly level: FruitLevel;
  readonly x: number;
  readonly y: number;
}

/** A fruit that has been dropped and is (or was) part of the physics simulation. */
export interface FruitInstance {
  readonly id: number;
  readonly level: FruitLevel;
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly radius: number;
}

export interface ScoreState {
  readonly currentScore: number;
  readonly bestScore: number;
}

/** Full, read-only snapshot of everything a future UI needs to render a frame. */
export interface GameSnapshot {
  readonly status: GameStatus;
  readonly currentFruit: CurrentFruitState | null;
  readonly nextFruitLevel: FruitLevel | null;
  readonly fruits: readonly FruitInstance[];
  readonly score: ScoreState;
}
