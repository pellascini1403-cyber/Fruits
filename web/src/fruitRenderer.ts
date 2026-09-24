import type { FruitInstance } from "../../src/index.js";
import { webFruitSpritePath } from "./assetPath.js";
import { fruitPhysicsSpriteBox } from "./fruitVisuals.js";

/**
 * Keeps one <img> of the original fruit PNG per fruit instance in sync with
 * `GameEngine.getFruits()`: created when a fruit appears (drop or merge
 * result), removed when it's gone (merged away or removed by a power-up).
 */
export class FruitRenderer {
  private readonly elements = new Map<number, HTMLImageElement>();

  constructor(private readonly simSpace: HTMLElement) {}

  sync(fruits: readonly FruitInstance[]): void {
    const seen = new Set<number>();

    for (const fruit of fruits) {
      seen.add(fruit.id);
      const box = fruitPhysicsSpriteBox(fruit.level, fruit.x, fruit.y, fruit.radius * 2);
      let el = this.elements.get(fruit.id);
      if (!el) {
        el = document.createElement("img");
        el.className = "fruit";
        el.src = webFruitSpritePath(fruit.level);
        el.draggable = false;
        el.alt = "";
        el.dataset.fruitId = String(fruit.id);
        // Rotate around the visible fruit's centre (= the physics body), not the padded square's.
        el.style.transformOrigin = `${((fruit.x - box.left) / box.size) * 100}% ${((fruit.y - box.top) / box.size) * 100}%`;
        this.simSpace.appendChild(el);
        this.elements.set(fruit.id, el);
      }

      el.style.width = `${box.size}px`;
      el.style.height = `${box.size}px`;
      const angleDeg = (fruit.angle * 180) / Math.PI;
      el.style.transform = `translate(${box.left}px, ${box.top}px) rotate(${angleDeg}deg)`;
    }

    for (const [id, el] of this.elements) {
      if (!seen.has(id)) {
        el.remove();
        this.elements.delete(id);
      }
    }
  }
}
