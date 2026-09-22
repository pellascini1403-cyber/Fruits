import { GameEngine, getFruitDefinition } from "../../src/index.js";
import { webFruitSpritePath } from "./assetPath.js";
import { SimSpaceLayout } from "./layout.js";
import { SIM_HEIGHT } from "./config.js";

/**
 * The current (about-to-drop) fruit: a glowing sprite the player drags
 * horizontally, with a dashed guide line straight down to the floor showing
 * where it will land. Releasing the pointer drops it. This is purely a view
 * over `GameEngine` — all it calls is `moveCurrentFruit`/`dropCurrentFruit`.
 */
export class Launcher {
  private readonly fruitEl: HTMLImageElement;
  private readonly dashLineEl: HTMLElement;
  private dragging = false;

  constructor(
    private readonly engine: GameEngine,
    private readonly layout: SimSpaceLayout,
    simSpace: HTMLElement,
    private readonly hitArea: HTMLElement,
    private readonly isPowerUpArmed: () => boolean = () => false,
  ) {
    this.fruitEl = document.createElement("img");
    this.fruitEl.className = "current-fruit";
    this.fruitEl.draggable = false;
    this.fruitEl.alt = "";
    simSpace.appendChild(this.fruitEl);

    this.dashLineEl = document.createElement("div");
    this.dashLineEl.className = "aim-line";
    simSpace.appendChild(this.dashLineEl);

    this.hitArea.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    if (target.closest(".hud-row, .modal-overlay")) {
      return;
    }
    if (this.isPowerUpArmed()) {
      return;
    }
    if (!this.engine.getCurrentFruit()) {
      return;
    }
    this.dragging = true;
    this.moveTo(event.clientX);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    this.moveTo(event.clientX);
  };

  private readonly onPointerUp = (): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.engine.dropCurrentFruit();
  };

  private moveTo(clientX: number): void {
    const simX = this.layout.clientXToSimX(clientX);
    this.engine.moveCurrentFruit(simX);
  }

  /** Call once per frame to reflect the engine's current state. */
  render(): void {
    const current = this.engine.getCurrentFruit();
    if (!current) {
      this.fruitEl.style.display = "none";
      this.dashLineEl.style.display = "none";
      return;
    }

    const spritePath = webFruitSpritePath(current.level);
    if (this.fruitEl.getAttribute("data-level") !== String(current.level)) {
      this.fruitEl.src = spritePath;
      this.fruitEl.setAttribute("data-level", String(current.level));
    }

    const radius = getFruitDefinition(current.level).radius;
    const diameter = radius * 2;
    this.fruitEl.style.width = `${diameter}px`;
    this.fruitEl.style.height = `${diameter}px`;
    this.fruitEl.style.display = "block";
    this.fruitEl.style.transform = `translate(${current.x - radius}px, ${current.y - radius}px)`;

    this.dashLineEl.style.display = "block";
    this.dashLineEl.style.left = `${current.x}px`;
    this.dashLineEl.style.top = `${current.y + radius}px`;
    this.dashLineEl.style.height = `${Math.max(0, SIM_HEIGHT - (current.y + radius))}px`;
  }
}
