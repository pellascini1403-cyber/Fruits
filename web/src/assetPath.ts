import { FruitLevel } from "../../src/index.js";
import { getFruitSpritePath } from "../../assets/fruitSprites.js";

/**
 * `assets/fruitSprites.ts` returns paths relative to the repo root (that's
 * its documented contract — it makes no assumption about who's consuming
 * it). This page lives one level down, at web/index.html, so every use of
 * it from browser code needs that one "../" prefix. Centralized here so
 * it's a single place to change if web/ ever moves.
 */
export function webFruitSpritePath(level: FruitLevel): string {
  return `../${getFruitSpritePath(level)}`;
}
