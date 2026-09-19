import { GameOverConfig } from "../config/gameConfig.js";

/** Minimal, physics-library-agnostic view of a fruit needed to judge Game Over. */
export interface FruitPhysicalState {
  readonly topY: number;
  readonly speed: number;
}

/**
 * Watches for fruits resting above the danger line. A fruit merely passing
 * through the zone while falling, or bouncing momentarily, does not end the
 * game — only a fruit that stays there, settled, for longer than the grace
 * period does. This is the "tolerance" the spec asks for.
 */
export class GameOverSystem {
  private aboveDangerMs = 0;
  private triggered = false;

  constructor(
    private readonly dangerY: number,
    private readonly config: GameOverConfig,
  ) {}

  /** Call once per tick with the current settled/falling state of every fruit in play. */
  update(deltaMs: number, fruits: readonly FruitPhysicalState[]): boolean {
    if (this.triggered) {
      return true;
    }

    const anyDangerouslySettled = fruits.some(
      (fruit) => fruit.topY < this.dangerY && fruit.speed <= this.config.restSpeedThreshold,
    );

    if (anyDangerouslySettled) {
      this.aboveDangerMs += deltaMs;
      if (this.aboveDangerMs >= this.config.graceMs) {
        this.triggered = true;
      }
    } else {
      this.aboveDangerMs = 0;
    }

    return this.triggered;
  }

  isGameOver(): boolean {
    return this.triggered;
  }

  reset(): void {
    this.aboveDangerMs = 0;
    this.triggered = false;
  }
}
