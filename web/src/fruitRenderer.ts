import type { FruitInstance } from "../../src/index.js";
import { webFruitSpritePath } from "./assetPath.js";

/**
 * Keeps a pool of <img> elements inside #sim-space in sync with
 * `GameEngine.getFruits()`. One element per fruit instance id; created when
 * a fruit first appears (drop or merge result), removed when it's gone
 * (merged away or popped by a power-up).
 */
export class FruitRenderer {
  private readonly elements = new Map<number, HTMLImageElement>();

  constructor(private readonly simSpace: HTMLElement) {}

  sync(fruits: readonly FruitInstance[]): void {
    const seen = new Set<number>();

    for (const fruit of fruits) {
      seen.add(fruit.id);
      let el = this.elements.get(fruit.id);
      if (!el) {
        el = document.createElement("img");
        el.className = "fruit";
        el.src = webFruitSpritePath(fruit.level);
        el.draggable = false;
        el.alt = "";
        el.dataset.fruitId = String(fruit.id);
        this.simSpace.appendChild(el);
        this.elements.set(fruit.id, el);
      }

      const diameter = fruit.radius * 2;
      el.style.width = `${diameter}px`;
      el.style.height = `${diameter}px`;
      const angleDeg = (fruit.angle * 180) / Math.PI;
      el.style.transform =
        `translate(${fruit.x - fruit.radius}px, ${fruit.y - fruit.radius}px) rotate(${angleDeg}deg)`;
    }

    for (const [id, el] of this.elements) {
      if (!seen.has(id)) {
        el.remove();
        this.elements.delete(id);
      }
    }
  }

  clear(): void {
    for (const el of this.elements.values()) {
      el.remove();
    }
    this.elements.clear();
  }
}
