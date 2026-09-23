import { GameEngine, getFruitDefinition } from "../../src/index.js";
import { webFruitSpritePath } from "./assetPath.js";
import { SimSpaceLayout } from "./layout.js";
import { SIM_HEIGHT, SIM_PER_REF } from "./config.js";
import { fruitSpriteBox } from "./fruitVisuals.js";
import { AIM_DASH } from "./uiLayout.js";

// The halo in the launcher PNG: white, ~45% opaque at the fruit's edge,
// fading out ~0.36x the fruit's width away. Reproduced around whichever
// fruit is current, since the PNG only carries it around the sample mango.
const GLOW_BLUR_PER_WIDTH = 0.28;
const GLOW_COLOR = "rgba(255, 255, 255, 0.9)";

// In the positioning mockup the first dash starts 141.6 ref px below the
// fruit's centre; the pattern repeats every 98 ref px.
const DASH_PHASE_REF = 141.6 % 98;

/**
 * The current (about-to-drop) fruit — the original fruit PNG with the
 * launcher's halo — and the launcher's original dashed line straight down to
 * the floor. Dragging moves both; releasing drops the fruit. All it calls on
 * the engine is `moveCurrentFruit` / `dropCurrentFruit`.
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
    const tileW = AIM_DASH.tileWidth * AIM_DASH.refScale * SIM_PER_REF;
    const tileH = AIM_DASH.tileHeight * AIM_DASH.refScale * SIM_PER_REF;

    this.dashLineEl = document.createElement("div");
    this.dashLineEl.className = "aim-line";
    this.dashLineEl.style.width = `${tileW}px`;
    this.dashLineEl.style.marginLeft = `${-tileW / 2}px`;
    this.dashLineEl.style.backgroundSize = `${tileW}px ${tileH}px`;
    this.dashLineEl.style.backgroundPositionY = `${DASH_PHASE_REF * SIM_PER_REF}px`;
    simSpace.appendChild(this.dashLineEl);

    this.fruitEl = document.createElement("img");
    this.fruitEl.className = "current-fruit";
    this.fruitEl.draggable = false;
    this.fruitEl.alt = "";
    simSpace.appendChild(this.fruitEl);

    this.hitArea.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    if (target.closest(".hud, .modal-overlay")) {
      return;
    }
    if (this.isPowerUpArmed() || !this.engine.getCurrentFruit()) {
      return;
    }
    this.dragging = true;
    this.moveTo(event.clientX);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.dragging) {
      this.moveTo(event.clientX);
    }
  };

  private readonly onPointerUp = (): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.engine.dropCurrentFruit();
  };

  private moveTo(clientX: number): void {
    this.engine.moveCurrentFruit(this.layout.clientXToSimX(clientX));
  }

  /** Call once per frame to reflect the engine's current state. */
  render(): void {
    const current = this.engine.getCurrentFruit();
    if (!current) {
      this.fruitEl.style.display = "none";
      this.dashLineEl.style.display = "none";
      return;
    }

    if (this.fruitEl.dataset.level !== String(current.level)) {
      this.fruitEl.src = webFruitSpritePath(current.level);
      this.fruitEl.dataset.level = String(current.level);
    }

    const box = fruitSpriteBox(current.level, current.x, current.y, getFruitDefinition(current.level).radius * 2);
    this.fruitEl.style.display = "block";
    this.fruitEl.style.width = `${box.size}px`;
    this.fruitEl.style.height = `${box.size}px`;
    this.fruitEl.style.transform = `translate(${box.left}px, ${box.top}px)`;
    this.fruitEl.style.filter = `drop-shadow(0 0 ${box.visibleWidth * GLOW_BLUR_PER_WIDTH}px ${GLOW_COLOR})`;

    this.dashLineEl.style.display = "block";
    this.dashLineEl.style.left = `${current.x}px`;
    this.dashLineEl.style.top = `${current.y}px`;
    this.dashLineEl.style.height = `${Math.max(0, SIM_HEIGHT - current.y)}px`;
  }
}
