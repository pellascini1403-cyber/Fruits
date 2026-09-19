import { FruitLevel } from "../fruits/fruitTypes.js";
import { getSpawnableLevels } from "../fruits/fruitDefinitions.js";

export type RandomSource = () => number;

/**
 * Generates random fruit levels for NEXT/current-fruit spawning. Only ever
 * produces levels the fruit table marks `spawnable` (Cherry..Apple) — levels
 * 6-11 can only ever come from a merge.
 */
export class NextFruitSystem {
  private readonly spawnableLevels: readonly FruitLevel[];

  constructor(private readonly random: RandomSource = Math.random) {
    this.spawnableLevels = getSpawnableLevels();
    if (this.spawnableLevels.length === 0) {
      throw new Error("Fruit table has no spawnable levels configured");
    }
  }

  generate(): FruitLevel {
    const index = Math.floor(this.random() * this.spawnableLevels.length);
    const clampedIndex = Math.min(index, this.spawnableLevels.length - 1);
    return this.spawnableLevels[clampedIndex];
  }
}
