export { GameEngine } from "./GameEngine.js";
export type { GameEngineOptions, GameEngineListener, MergeResult } from "./GameEngine.js";

export { FruitLevel, MIN_FRUIT_LEVEL, MAX_FRUIT_LEVEL } from "./fruits/fruitTypes.js";
export type { FruitDefinition } from "./fruits/fruitTypes.js";
export {
  getFruitDefinition,
  getAllFruitDefinitions,
  getSpawnableLevels,
  isMaxLevel,
  isMinLevel,
} from "./fruits/fruitDefinitions.js";

export { GameStatus } from "./state/types.js";
export type {
  CurrentFruitState,
  FruitInstance,
  ScoreState,
  GameSnapshot,
} from "./state/types.js";

export { DEFAULT_GAME_CONFIG } from "./config/gameConfig.js";
export type {
  GameConfig,
  ContainerConfig,
  GameOverConfig,
  SpawnConfig,
  PhysicsConfig,
} from "./config/gameConfig.js";

export type { PersistenceAdapter } from "./persistence/PersistenceAdapter.js";
export {
  LocalStoragePersistenceAdapter,
  InMemoryPersistenceAdapter,
  createDefaultPersistenceAdapter,
} from "./persistence/PersistenceAdapter.js";

export type { RandomSource } from "./systems/NextFruitSystem.js";
