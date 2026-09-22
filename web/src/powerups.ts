import { GameEngine } from "../../src/index.js";
import { consumePowerUpForToday, isPowerUpAvailableToday, PowerUpKey } from "./storage.js";

const SHAKE_THRESHOLD = 18; // m/s^2 of acceleration change, tuned for a deliberate shake
const SHAKE_COOLDOWN_MS = 1000;

export interface PowerUpButtonRefs {
  key: PowerUpKey;
  el: HTMLElement;
  img: HTMLImageElement;
  availableSrc: string;
  usedSrc: string;
}

/**
 * Owns the "armed" selection state for the 4 power-ups and turns the
 * player's next action (tap a fruit, shake the phone) into the matching
 * engine call. Each power-up is single-use per day; availability is tracked
 * in storage.ts and reflected by swapping each button's badge sprite.
 */
export class PowerUpController {
  private armed: PowerUpKey | null = null;
  private lastShakeAt = 0;
  private lastAcceleration: { x: number; y: number; z: number } | null = null;
  private readonly motionHandler = (event: DeviceMotionEvent): void => this.onDeviceMotion(event);

  constructor(
    private readonly engine: GameEngine,
    private readonly buttons: readonly PowerUpButtonRefs[],
    private readonly fruitHitArea: HTMLElement,
  ) {
    for (const button of this.buttons) {
      button.el.addEventListener("click", () => this.onButtonTap(button.key));
    }
    this.fruitHitArea.addEventListener("pointerdown", (event) => this.onFruitAreaPointerDown(event));
    this.refreshBadges();
  }

  private onButtonTap(key: PowerUpKey): void {
    if (!isPowerUpAvailableToday(key)) {
      return;
    }

    if (this.armed === key) {
      this.disarm();
      return;
    }

    this.armed = key;
    this.updateArmedVisuals();

    if (key === "shrink") {
      // Instant effect, no target selection needed.
      this.engine.removeSmallFruits();
      this.consume(key);
      return;
    }

    if (key === "shake") {
      void this.armShakeListening();
    }
  }

  private async armShakeListening(): Promise<void> {
    const RequestPermission = (
      DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      }
    ).requestPermission;

    if (typeof RequestPermission === "function") {
      try {
        const result = await RequestPermission();
        if (result !== "granted") {
          this.disarm();
          return;
        }
      } catch {
        this.disarm();
        return;
      }
    }

    window.addEventListener("devicemotion", this.motionHandler);
  }

  private onDeviceMotion(event: DeviceMotionEvent): void {
    if (this.armed !== "shake") {
      return;
    }
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration || acceleration.x === null || acceleration.y === null || acceleration.z === null) {
      return;
    }

    const current = { x: acceleration.x, y: acceleration.y, z: acceleration.z };
    const previous = this.lastAcceleration;
    this.lastAcceleration = current;
    if (!previous) {
      return;
    }

    const delta =
      Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y) + Math.abs(current.z - previous.z);

    const now = performance.now();
    if (delta > SHAKE_THRESHOLD && now - this.lastShakeAt > SHAKE_COOLDOWN_MS) {
      this.lastShakeAt = now;
      this.engine.shakeBox();
      this.consume("shake");
    }
  }

  private onFruitAreaPointerDown(event: PointerEvent): void {
    if (this.armed !== "upgrade" && this.armed !== "bomb") {
      return;
    }
    const target = event.target as HTMLElement;
    const fruitEl = target.closest<HTMLElement>(".fruit");
    const idAttr = fruitEl?.dataset.fruitId;
    if (!idAttr) {
      return;
    }
    const id = Number(idAttr);

    if (this.armed === "upgrade") {
      this.engine.upgradeFruit(id);
      this.consume("upgrade");
    } else if (this.armed === "bomb") {
      this.engine.removeFruit(id);
      this.consume("bomb");
    }
  }

  private consume(key: PowerUpKey): void {
    consumePowerUpForToday(key);
    this.disarm();
    this.refreshBadges();
  }

  private disarm(): void {
    if (this.armed === "shake") {
      window.removeEventListener("devicemotion", this.motionHandler);
      this.lastAcceleration = null;
    }
    this.armed = null;
    this.updateArmedVisuals();
  }

  /** True while a power-up is armed and waiting for its target action. */
  isArmed(): boolean {
    return this.armed !== null;
  }

  private updateArmedVisuals(): void {
    for (const button of this.buttons) {
      button.el.classList.toggle("armed", button.key === this.armed);
    }
  }

  private refreshBadges(): void {
    for (const button of this.buttons) {
      const available = isPowerUpAvailableToday(button.key);
      button.img.src = available ? button.availableSrc : button.usedSrc;
      button.el.classList.toggle("depleted", !available);
    }
  }
}
