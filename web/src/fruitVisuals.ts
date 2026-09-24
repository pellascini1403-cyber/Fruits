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

/**
 * Sizes a fruit so its visible WIDTH is exactly `targetWidth`, centred on
 * (x, y). Width — not the padded square, and not the taller of width/height
 * — is what should match the physics circle's diameter: it's the fruit's
 * round-body dimension, the same for every sprite regardless of how much a
 * stem or leaf extends the artwork's height above it. Sizing by width keeps
 * every fruit's true diameter faithful to `radius` in fruitDefinitions.ts,
 * whatever that fruit's own aspect ratio happens to be.
 */
export function fruitSpriteBox(level: FruitLevel, x: number, y: number, targetWidth: number): SpriteBox {
  const c = CONTENT[level];
  const size = targetWidth / c.w;
  return { size, left: x - c.cx * size, top: y - c.cy * size, visibleWidth: targetWidth };
}

/** The visible width a fruit would need for its visible HEIGHT to equal `targetHeight`. */
export function widthForVisibleHeight(level: FruitLevel, targetHeight: number): number {
  const c = CONTENT[level];
  return targetHeight * (c.w / c.h);
}

/**
 * Sizes and positions a fruit exactly like `fruitSpriteBox`, except it
 * anchors the fruit's round body — not the padded content box — to (x, y).
 *
 * A fruit's content box is centred on (x, y) by `fruitSpriteBox`, which is
 * correct for the launcher/NEXT (they only need the fruit itself centred on
 * a point). But for a fruit resting in the physics simulation, (x, y) is the
 * physics circle's actual centre, and the circle's true bottom is always
 * y + radius. Whenever a fruit's artwork is taller than it is wide (a stem
 * or leaf extending above the round body — true for nearly every fruit),
 * centring the whole content box on y shifts the visible ball down by
 * (h - w) / 2 of its own size, since the box's own centre sits above the
 * ball's centre. That shift is exactly what made fruits look like they were
 * sinking below the floor: this function removes it by assuming the round
 * body occupies the bottom `w`-fraction of the `h`-fraction content box
 * (stems grow up from the ball, not down), so the ball's own centre lands on
 * (x, y) and its bottom edge lands exactly on y + radius.
 */
export function fruitPhysicsSpriteBox(level: FruitLevel, x: number, y: number, targetWidth: number): SpriteBox {
  const c = CONTENT[level];
  const size = targetWidth / c.w;
  const ballCy = c.cy + c.h / 2 - c.w / 2;
  return { size, left: x - c.cx * size, top: y - ballCy * size, visibleWidth: targetWidth };
}
