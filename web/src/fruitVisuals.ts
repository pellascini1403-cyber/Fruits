import { FruitLevel } from "../../src/index.js";

/**
 * Each fruit PNG is a 1024x1024 square with transparent padding around the
 * fruit itself. These are the measured bounds of the visible fruit inside
 * that square (fractions of the square), so the drawing can be sized and
 * centred on the physics body by the fruit itself rather than its padding.
 * The PNGs are drawn unmodified; this only decides where/how big.
 */
interface ContentBox {
  w: number;
  h: number;
  cx: number;
  cy: number;
}

const CONTENT: Record<FruitLevel, ContentBox> = {
  [FruitLevel.Cherry]: { w: 0.69, h: 0.76, cx: 0.491, cy: 0.504 },
  [FruitLevel.Strawberry]: { w: 0.8, h: 0.8, cx: 0.5, cy: 0.499 },
  [FruitLevel.Grape]: { w: 0.65, h: 0.79, cx: 0.551, cy: 0.501 },
  [FruitLevel.Mango]: { w: 0.66, h: 0.77, cx: 0.501, cy: 0.498 },
  [FruitLevel.Apple]: { w: 0.7, h: 0.79, cx: 0.5, cy: 0.496 },
  [FruitLevel.Pear]: { w: 0.63, h: 0.79, cx: 0.498, cy: 0.498 },
  [FruitLevel.Peach]: { w: 0.68, h: 0.75, cx: 0.501, cy: 0.497 },
  [FruitLevel.Pineapple]: { w: 0.5, h: 0.83, cx: 0.492, cy: 0.501 },
  [FruitLevel.Melon]: { w: 0.67, h: 0.8, cx: 0.494, cy: 0.488 },
  [FruitLevel.Watermelon]: { w: 0.71, h: 0.75, cx: 0.508, cy: 0.506 },
  [FruitLevel.Banana]: { w: 0.82, h: 0.81, cx: 0.506, cy: 0.5 },
};

export interface SpriteBox {
  /** Side of the square <img>. */
  size: number;
  /** Top-left of the square so the visible fruit is centred on (x, y). */
  left: number;
  top: number;
  /** Width of the visible fruit itself, for effects sized to it. */
  visibleWidth: number;
}

/** Sizes a fruit so its visible extent spans `diameter`, centred on (x, y). */
export function fruitSpriteBox(level: FruitLevel, x: number, y: number, diameter: number): SpriteBox {
  const c = CONTENT[level];
  const size = diameter / Math.max(c.w, c.h);
  return { size, left: x - c.cx * size, top: y - c.cy * size, visibleWidth: c.w * size };
}

/** Sizes a fruit so its visible height is `height`, centred on (x, y) — used for the NEXT slot. */
export function fruitSpriteBoxByHeight(level: FruitLevel, x: number, y: number, height: number): SpriteBox {
  const c = CONTENT[level];
  const size = height / c.h;
  return { size, left: x - c.cx * size, top: y - c.cy * size, visibleWidth: c.w * size };
}
