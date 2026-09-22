import { FruitLevel } from "./fruits/fruitTypes.js";
import { getFruitDefinition } from "./fruits/fruitDefinitions.js";
import { DEFAULT_GAME_CONFIG, GameConfig } from "./config/gameConfig.js";
import { PhysicsWorld } from "./physics/PhysicsWorld.js";
import { ScoreSystem } from "./systems/ScoreSystem.js";
import { NextFruitSystem, RandomSource } from "./systems/NextFruitSystem.js";
import { MergeSystem, MergeResult } from "./systems/MergeSystem.js";
import { GameOverSystem } from "./systems/GameOverSystem.js";
import { PowerUpSystem } from "./systems/PowerUpSystem.js";
import { PersistenceAdapter, createDefaultPersistenceAdapter } from "./persistence/PersistenceAdapter.js";
import { CurrentFruitState, FruitInstance, GameSnapshot, GameStatus, ScoreState } from "./state/types.js";

export interface GameEngineOptions {
  readonly config?: GameConfig;
  readonly persistence?: PersistenceAdapter;
  readonly random?: RandomSource;
  /** How long (ms) the stack must stay calm before the next fruit is handed to the player. */
  readonly settleDelayMs?: number;
}

export type GameEngineListener = () => void;

/**
 * Public facade for the whole engine. This is the ONLY class a future
 * interface should import. It exposes plain data (levels, ids, coordinates,
 * enums) and functions — never a Matter.js type, a DOM node, or anything
 * about how a fruit looks.
 */
export class GameEngine {
  private readonly config: GameConfig;
  private readonly physics: PhysicsWorld;
  private readonly score: ScoreSystem;
  private readonly nextFruitSystem: NextFruitSystem;
  private readonly mergeSystem: MergeSystem;
  private readonly gameOverSystem: GameOverSystem;
  private readonly powerUps: PowerUpSystem;
  private readonly settleDelayMs: number;

  private status: GameStatus = GameStatus.READY;
  private currentFruit: CurrentFruitState | null = null;
  private nextFruitLevel: FruitLevel | null = null;
  private settleTimerMs = 0;
  private listeners: GameEngineListener[] = [];

  constructor(options: GameEngineOptions = {}) {
    this.config = options.config ?? DEFAULT_GAME_CONFIG;
    this.settleDelayMs = options.settleDelayMs ?? 150;

    this.physics = new PhysicsWorld(this.config.container, this.config.physics);
    this.score = new ScoreSystem(options.persistence ?? createDefaultPersistenceAdapter());
    this.nextFruitSystem = new NextFruitSystem(options.random);
    this.mergeSystem = new MergeSystem(this.physics, this.score);
    this.gameOverSystem = new GameOverSystem(this.config.container.dangerY, this.config.gameOver);
    this.powerUps = new PowerUpSystem(this.physics, options.random);

    this.restartGame();
  }

  // ---------------------------------------------------------------------
  // Read-only API
  // ---------------------------------------------------------------------

  getCurrentFruit(): CurrentFruitState | null {
    return this.currentFruit;
  }

  getNextFruit(): FruitLevel | null {
    return this.nextFruitLevel;
  }

  getFruits(): FruitInstance[] {
    return this.physics.getFruitBodies().map((body) => ({
      id: body.plugin.fruit.id,
      level: body.plugin.fruit.level,
      x: body.position.x,
      y: body.position.y,
      angle: body.angle,
      radius: getFruitDefinition(body.plugin.fruit.level).radius,
    }));
  }

  getScore(): number {
    return this.score.getCurrentScore();
  }

  getBestScore(): number {
    return this.score.getBestScore();
  }

  getScoreState(): ScoreState {
    return { currentScore: this.score.getCurrentScore(), bestScore: this.score.getBestScore() };
  }

  getGameState(): GameStatus {
    return this.status;
  }

  isGameOver(): boolean {
    return this.status === GameStatus.GAME_OVER;
  }

  getConfig(): GameConfig {
    return this.config;
  }

  /** Full, immutable snapshot for a future UI to render from in one read. */
  getSnapshot(): GameSnapshot {
    return {
      status: this.status,
      currentFruit: this.currentFruit,
      nextFruitLevel: this.nextFruitLevel,
      fruits: this.getFruits(),
      score: this.getScoreState(),
    };
  }

  /** Subscribe to be notified after any state-changing call. Returns an unsubscribe function. */
  subscribe(listener: GameEngineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ---------------------------------------------------------------------
  // Player control
  // ---------------------------------------------------------------------

  moveCurrentFruit(x: number): void {
    if (this.status !== GameStatus.AIMING || !this.currentFruit) {
      return;
    }
    const radius = getFruitDefinition(this.currentFruit.level).radius;
    const { left, right } = this.config.container;
    const clampedX = Math.min(Math.max(x, left + radius), right - radius);
    this.currentFruit = { ...this.currentFruit, x: clampedX };
    this.notify();
  }

  dropCurrentFruit(): void {
    if (this.status !== GameStatus.AIMING || !this.currentFruit) {
      return;
    }
    const definition = getFruitDefinition(this.currentFruit.level);
    this.physics.createFruitBody(definition, this.currentFruit.x, this.currentFruit.y);

    this.currentFruit = null;
    this.status = GameStatus.DROPPING;
    this.settleTimerMs = 0;
    this.notify();
  }

  // ---------------------------------------------------------------------
  // Simulation tick — the future UI drives this from its own render loop
  // (e.g. requestAnimationFrame), but this is still pure logic: no drawing.
  // ---------------------------------------------------------------------

  update(deltaMs: number): void {
    if (this.status === GameStatus.GAME_OVER) {
      return;
    }

    this.physics.step(deltaMs);
    const merges = this.mergeSystem.processPendingMerges();

    if (merges.length > 0) {
      this.status = GameStatus.RESOLVING;
      this.settleTimerMs = 0;
    }

    const gameOver = this.gameOverSystem.update(deltaMs, this.getDangerZoneFruitStates());
    if (gameOver) {
      this.enterGameOver();
      return;
    }

    if (this.status === GameStatus.DROPPING || this.status === GameStatus.RESOLVING) {
      if (this.isStackSettled()) {
        this.settleTimerMs += deltaMs;
        if (this.settleTimerMs >= this.settleDelayMs) {
          this.spawnCurrentFruitFromNext();
        }
      } else {
        this.settleTimerMs = 0;
      }
    }

    this.notify();
  }

  private getDangerZoneFruitStates() {
    return this.physics.getFruitBodies().map((body) => ({
      topY: body.position.y - getFruitDefinition(body.plugin.fruit.level).radius,
      speed: Math.hypot(body.velocity.x, body.velocity.y),
    }));
  }

  private isStackSettled(): boolean {
    if (this.mergeSystem.hasPendingMerges()) {
      return false;
    }
    const threshold = this.config.gameOver.restSpeedThreshold;
    return this.physics
      .getFruitBodies()
      .every((body) => Math.hypot(body.velocity.x, body.velocity.y) <= threshold);
  }

  private enterGameOver(): void {
    this.status = GameStatus.GAME_OVER;
    this.currentFruit = null;
    this.notify();
  }

  // ---------------------------------------------------------------------
  // Fruit lifecycle
  // ---------------------------------------------------------------------

  private spawnCurrentFruitFromNext(): void {
    const level = this.nextFruitLevel ?? this.nextFruitSystem.generate();
    this.currentFruit = {
      level,
      x: (this.config.container.left + this.config.container.right) / 2,
      y: this.config.spawn.spawnY,
    };
    this.nextFruitLevel = this.nextFruitSystem.generate();
    this.status = GameStatus.AIMING;
    this.settleTimerMs = 0;
  }

  // ---------------------------------------------------------------------
  // Restart
  // ---------------------------------------------------------------------

  restartGame(): void {
    this.physics.clearAllFruits();
    this.score.resetCurrentScore();
    this.gameOverSystem.reset();
    this.currentFruit = null;
    this.nextFruitLevel = null;
    this.settleTimerMs = 0;
    this.status = GameStatus.READY;
    this.spawnCurrentFruitFromNext();
    this.notify();
  }

  // ---------------------------------------------------------------------
  // Power-ups (logic only — no economy, no UI)
  // ---------------------------------------------------------------------

  removeFruit(id: number): boolean {
    if (this.status === GameStatus.GAME_OVER) {
      return false;
    }
    const removed = this.powerUps.removeFruit(id);
    if (removed) {
      this.notify();
    }
    return removed;
  }

  upgradeFruit(id: number): boolean {
    if (this.status === GameStatus.GAME_OVER) {
      return false;
    }
    const upgraded = this.powerUps.upgradeFruit(id);
    if (upgraded) {
      this.notify();
    }
    return upgraded;
  }

  removeSmallFruits(): number[] {
    if (this.status === GameStatus.GAME_OVER) {
      return [];
    }
    const removed = this.powerUps.removeSmallFruits();
    if (removed.length > 0) {
      this.notify();
    }
    return removed;
  }

  shakeBox(strength?: number): void {
    if (this.status === GameStatus.GAME_OVER) {
      return;
    }
    this.powerUps.shakeBox(strength);
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export type { MergeResult };
