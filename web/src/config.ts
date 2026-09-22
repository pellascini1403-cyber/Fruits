/**
 * Visual layout constants, measured directly from the provided reference
 * assets (see the box asset analysis). Nothing here is guessed — each
 * fraction corresponds to a landmark pixel-measured in the source PNG.
 */

/** assets/box/game-box-purple.png intrinsic size, width/height. */
export const BOX_ASPECT_RATIO = 1340 / 2173;

/** Fractions of the box image's own rendered height, from its top edge. */
export const BOX_LANDMARKS = {
  /** Below the rim flare, where the straight glass walls begin. */
  interiorTop: 0.02,
  /** Console top / floor line. */
  interiorBottom: 0.612,
};

/** Fraction of the box image's width inset on each side (the glass side walls). */
export const BOX_WALL_INSET = 0.0216;

/**
 * Fixed virtual coordinate space the physics engine simulates in. It never
 * changes at runtime — only the on-screen viewport mapped onto it does
 * (see layout.ts). Height is derived from the measured landmarks above, so
 * the simulation's own aspect ratio always matches the visual interior of
 * the box, regardless of what SIM_WIDTH is chosen.
 */
export const SIM_WIDTH = 640;

const interiorWidthFraction = 1 - 2 * BOX_WALL_INSET;
const interiorHeightFractionOfBoxWidth =
  (BOX_LANDMARKS.interiorBottom - BOX_LANDMARKS.interiorTop) / BOX_ASPECT_RATIO;
export const SIM_HEIGHT = SIM_WIDTH * (interiorHeightFractionOfBoxWidth / interiorWidthFraction);

/** Where a fresh current fruit spawns, and how close to the top counts as danger. */
export const SIM_SPAWN_Y = SIM_HEIGHT * 0.06;
export const SIM_DANGER_Y = SIM_HEIGHT * 0.1;
