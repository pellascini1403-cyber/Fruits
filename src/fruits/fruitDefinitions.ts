import { FruitDefinition, FruitLevel, MAX_FRUIT_LEVEL, MIN_FRUIT_LEVEL } from "./fruitTypes.js";

/**
 * Central balancing table. Every physics/score/merge value the engine uses
 * comes from here — nothing should hardcode a fruit's size, mass or score
 * anywhere else. Tune gameplay by editing this file only.
 */
const FRUIT_DEFINITIONS: readonly FruitDefinition[] = [
  { level: FruitLevel.Cherry,     name: "Cherry",     nextLevel: FruitLevel.Strawberry, radius: 14, mass: 1,  density: 0.0012, friction: 0.05, restitution: 0.25, score: 1,   spawnable: true },
  { level: FruitLevel.Strawberry, name: "Strawberry", nextLevel: FruitLevel.Grape,      radius: 20, mass: 2,  density: 0.0012, friction: 0.05, restitution: 0.24, score: 3,   spawnable: true },
  { level: FruitLevel.Grape,      name: "Grape",      nextLevel: FruitLevel.Mango,      radius: 27, mass: 3,  density: 0.0012, friction: 0.06, restitution: 0.23, score: 6,   spawnable: true },
  { level: FruitLevel.Mango,      name: "Mango",      nextLevel: FruitLevel.Apple,      radius: 35, mass: 5,  density: 0.0013, friction: 0.06, restitution: 0.22, score: 10,  spawnable: true },
  { level: FruitLevel.Apple,      name: "Apple",      nextLevel: FruitLevel.Pear,       radius: 44, mass: 8,  density: 0.0013, friction: 0.07, restitution: 0.21, score: 15,  spawnable: true },
  { level: FruitLevel.Pear,       name: "Pear",       nextLevel: FruitLevel.Peach,      radius: 54, mass: 12, density: 0.0013, friction: 0.07, restitution: 0.20, score: 21,  spawnable: false },
  { level: FruitLevel.Peach,      name: "Peach",      nextLevel: FruitLevel.Pineapple,  radius: 65, mass: 17, density: 0.0014, friction: 0.08, restitution: 0.19, score: 28,  spawnable: false },
  { level: FruitLevel.Pineapple,  name: "Pineapple",  nextLevel: FruitLevel.Melon,      radius: 77, mass: 23, density: 0.0014, friction: 0.08, restitution: 0.18, score: 36,  spawnable: false },
  { level: FruitLevel.Melon,      name: "Melon",      nextLevel: FruitLevel.Watermelon, radius: 90, mass: 30, density: 0.0014, friction: 0.09, restitution: 0.17, score: 45,  spawnable: false },
  { level: FruitLevel.Watermelon, name: "Watermelon", nextLevel: FruitLevel.Banana,     radius: 104, mass: 38, density: 0.0015, friction: 0.09, restitution: 0.16, score: 55,  spawnable: false },
  { level: FruitLevel.Banana,     name: "Banana",     nextLevel: null,                  radius: 119, mass: 47, density: 0.0015, friction: 0.10, restitution: 0.15, score: 66,  spawnable: false },
];

const BY_LEVEL: ReadonlyMap<FruitLevel, FruitDefinition> = new Map(
  FRUIT_DEFINITIONS.map((def) => [def.level, def]),
);

const SPAWNABLE_LEVELS: readonly FruitLevel[] = FRUIT_DEFINITIONS.filter((d) => d.spawnable).map(
  (d) => d.level,
);

export function getFruitDefinition(level: FruitLevel): FruitDefinition {
  const def = BY_LEVEL.get(level);
  if (!def) {
    throw new Error(`Unknown fruit level: ${level}`);
  }
  return def;
}

export function getAllFruitDefinitions(): readonly FruitDefinition[] {
  return FRUIT_DEFINITIONS;
}

export function getSpawnableLevels(): readonly FruitLevel[] {
  return SPAWNABLE_LEVELS;
}

export function isMaxLevel(level: FruitLevel): boolean {
  return level === MAX_FRUIT_LEVEL;
}

export function isMinLevel(level: FruitLevel): boolean {
  return level === MIN_FRUIT_LEVEL;
}

// Sanity checks run once at module load so a bad edit to the table above
// fails fast instead of producing subtle gameplay bugs.
(function validateFruitTable() {
  let previousRadius = 0;
  for (const def of FRUIT_DEFINITIONS) {
    if (def.radius <= previousRadius) {
      throw new Error(
        `Fruit table invariant broken: radius must strictly increase with level (level ${def.level})`,
      );
    }
    previousRadius = def.radius;

    const expectedNext = def.level < MAX_FRUIT_LEVEL ? def.level + 1 : null;
    if (def.nextLevel !== expectedNext) {
      throw new Error(`Fruit table invariant broken: nextLevel wrong for level ${def.level}`);
    }
  }
  if (FRUIT_DEFINITIONS.length !== MAX_FRUIT_LEVEL) {
    throw new Error("Fruit table invariant broken: expected exactly 11 fruit tiers");
  }
})();
