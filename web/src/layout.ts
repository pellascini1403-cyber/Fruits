import { BOX_LANDMARKS, BOX_WALL_INSET, SIM_WIDTH } from "./config.js";

/**
 * Maps the fixed SIM_WIDTH x SIM_HEIGHT physics coordinate space onto the
 * live, resizable interior of the box image. Only this transform changes on
 * resize/orientation — the physics engine itself is never rebuilt.
 */
export class SimSpaceLayout {
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(
    private readonly gameRoot: HTMLElement,
    private readonly boxImage: HTMLImageElement,
    private readonly simSpace: HTMLElement,
  ) {}

  /** Recomputes the transform from the box image's current rendered size/position. */
  recalculate(): void {
    const rootRect = this.gameRoot.getBoundingClientRect();
    const boxRect = this.boxImage.getBoundingClientRect();

    const interiorLeft = boxRect.left + boxRect.width * BOX_WALL_INSET;
    const interiorRight = boxRect.left + boxRect.width * (1 - BOX_WALL_INSET);
    const interiorTop = boxRect.top + boxRect.height * BOX_LANDMARKS.interiorTop;

    this.scale = (interiorRight - interiorLeft) / SIM_WIDTH;
    this.offsetX = interiorLeft - rootRect.left;
    this.offsetY = interiorTop - rootRect.top;

    this.simSpace.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
  }

  /** Converts a viewport clientX (e.g. from a pointer event) into sim-space X. */
  clientXToSimX(clientX: number): number {
    const rootRect = this.gameRoot.getBoundingClientRect();
    return (clientX - rootRect.left - this.offsetX) / this.scale;
  }
}
