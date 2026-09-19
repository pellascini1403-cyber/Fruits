import { FruitLevel } from "../src/fruits/fruitTypes.js";

/**
 * Maps each fruit level to its PNG asset. This file is intentionally OUTSIDE
 * `src/` and is never imported by the engine (`GameEngine`, `PhysicsWorld`,
 * etc.) — the engine only ever deals in `FruitLevel` numbers. A future
 * interface imports this map to know which image to draw for a given level;
 * swapping these paths (or replacing this file entirely with your own
 * mapping) never requires touching engine code.
 */
export const FRUIT_SPRITE_PATHS: Readonly<Record<FruitLevel, string>> = {
  [FruitLevel.Cherry]: "assets/fruits/01-cherry.png",
  [FruitLevel.Strawberry]: "assets/fruits/02-strawberry.png",
  [FruitLevel.Grape]: "assets/fruits/03-grape.png",
  [FruitLevel.Mango]: "assets/fruits/04-mango.png",
  [FruitLevel.Apple]: "assets/fruits/05-apple.png",
  [FruitLevel.Pear]: "assets/fruits/06-pear.png",
  [FruitLevel.Peach]: "assets/fruits/07-peach.png",
  [FruitLevel.Pineapple]: "assets/fruits/08-pineapple.png",
  [FruitLevel.Melon]: "assets/fruits/09-melon.png",
  [FruitLevel.Watermelon]: "assets/fruits/10-watermelon.png",
  [FruitLevel.Banana]: "assets/fruits/11-banana.png",
};

export function getFruitSpritePath(level: FruitLevel): string {
  const path = FRUIT_SPRITE_PATHS[level];
  if (!path) {
    throw new Error(`No sprite registered for fruit level: ${level}`);
  }
  return path;
}
