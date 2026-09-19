import { PersistenceAdapter } from "../persistence/PersistenceAdapter.js";

const BEST_SCORE_KEY = "fruitMerge.bestScore";

/**
 * Owns currentScore/bestScore. bestScore is persisted through the injected
 * adapter so it survives across restarts and across sessions.
 */
export class ScoreSystem {
  private currentScore = 0;
  private bestScore: number;

  constructor(private readonly persistence: PersistenceAdapter) {
    this.bestScore = this.readBestScore();
  }

  private readBestScore(): number {
    const raw = this.persistence.getItem(BEST_SCORE_KEY);
    const parsed = raw !== null ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  getCurrentScore(): number {
    return this.currentScore;
  }

  getBestScore(): number {
    return this.bestScore;
  }

  addPoints(points: number): void {
    this.currentScore += points;
    if (this.currentScore > this.bestScore) {
      this.bestScore = this.currentScore;
      this.persistence.setItem(BEST_SCORE_KEY, String(this.bestScore));
    }
  }

  /** Resets currentScore for a new game. bestScore is untouched. */
  resetCurrentScore(): void {
    this.currentScore = 0;
  }
}
