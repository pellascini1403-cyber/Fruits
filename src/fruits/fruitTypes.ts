/**
 * Fruit levels, from smallest (1) to largest (11).
 * The numeric value IS the merge order: level N + level N merges into level N+1.
 */
export enum FruitLevel {
  Cherry = 1,
  Strawberry = 2,
  Grape = 3,
  Mango = 4,
  Apple = 5,
  Pear = 6,
  Peach = 7,
  Pineapple = 8,
  Melon = 9,
  Watermelon = 10,
  Banana = 11,
}

export const MIN_FRUIT_LEVEL = FruitLevel.Cherry;
export const MAX_FRUIT_LEVEL = FruitLevel.Banana;

/**
 * Static, data-only description of a fruit tier. This is the single source of
 * truth the rest of the engine (physics, merge, score, next-fruit) reads from.
 * Nothing here references how a fruit is drawn.
 */
export interface FruitDefinition {
  readonly level: FruitLevel;
  readonly name: string;
  /** Level produced when two fruits of this level merge, or null if this is the max tier. */
  readonly nextLevel: FruitLevel | null;
  /** Collider / body radius, in simulation units. Strictly increasing with level. */
  readonly radius: number;
  readonly mass: number;
  readonly density: number;
  readonly friction: number;
  readonly restitution: number;
  /** Points awarded when two fruits of this level merge into the next tier. */
  readonly score: number;
  /** Whether the NEXT-fruit generator is allowed to produce this level directly. */
  readonly spawnable: boolean;
}
