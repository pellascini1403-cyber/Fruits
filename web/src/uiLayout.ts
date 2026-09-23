/**
 * Where every provided PNG goes on screen, in "reference pixels" of the
 * 856px-wide positioning mockup you supplied. CSS turns a reference pixel
 * into real pixels via `--u` (= screen width / 856), so the layout scales
 * uniformly and never distorts an asset.
 *
 * Every number here was measured from the mockups (template-matching the
 * original PNGs against them), not estimated.
 */

export const REF_WIDTH = 856;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The HUD reference sheet is the HUD layer itself at a larger scale: every
 * icon's sheet position maps onto the mockup by one scale + offset
 * (menu and no-ads land within ~4 levels of mean colour error).
 */
const SHEET_SCALE = 0.3147;
const SHEET_OFFSET_X = 29.7;
const SHEET_OFFSET_Y = 19.5;

function fromSheet(sx: number, sy: number, w: number, h: number): Rect {
  return {
    x: SHEET_OFFSET_X + SHEET_SCALE * sx,
    y: SHEET_OFFSET_Y + SHEET_SCALE * sy,
    w: w * SHEET_SCALE,
    h: h * SHEET_SCALE,
  };
}

/** Crop origin + size of each HUD PNG within the reference sheet. */
export const HUD_LAYOUT = {
  menu: fromSheet(20, 313, 290, 290),
  noAds: fromSheet(385, 313, 290, 290),
  next: fromSheet(1882, 320, 603, 274),
  shake: fromSheet(20, 761, 314, 326),
  upgrade: fromSheet(385, 759, 299, 328),
  bomb: fromSheet(1843, 730, 303, 357),
  shrink: fromSheet(2208, 761, 305, 326),
};

/**
 * Inside next-badge.png (603x274): the box the sample apple occupied in the
 * original — the live next fruit is drawn in exactly that box.
 */
export const NEXT_FRUIT_SLOT = { centerX: 445.5, centerY: 138, contentHeight: 213, imageWidth: 603, imageHeight: 274 };

/** Panel PNGs: natural size, and where they sit in the positioning mockups. */
export const SETTINGS_PANEL = {
  src: "../assets/panels/settings.png",
  natural: { w: 1320, h: 1395 },
  placement: { x: 57, y: 378, scale: 0.592 },
  hotspots: {
    close: { x: 1170, y: 90, w: 150, h: 150 },
    sound: { x: 62, y: 403, w: 514, h: 249 },
    music: { x: 678, y: 404, w: 514, h: 248 },
    reset: { x: 196, y: 887, w: 248, h: 247 },
    language: { x: 811, y: 887, w: 248, h: 248 },
  },
  /** Knob centres, in panel pixels, for the ON (as drawn) and OFF positions. */
  toggles: {
    sound: { on: { x: 450, y: 526 }, off: { x: 187, y: 526 }, cover: { x: 346, y: 422 } },
    music: { on: { x: 1066, y: 527 }, off: { x: 803, y: 527 }, cover: { x: 962, y: 423 } },
  },
  knobSize: 202,
  coverSize: 209,
};

export const REMOVE_ADS_PANEL = {
  src: "../assets/panels/remove-ads.png",
  natural: { w: 1356, h: 1992 },
  placement: { x: 58, y: 339, scale: 0.575 },
  hotspots: {
    close: { x: 1205, y: 162, w: 151, h: 150 },
    buy: { x: 380, y: 1690, w: 530, h: 255 },
  },
};

/**
 * Aim line: one period of the original dashed line (aim-dash.png, 19x154),
 * drawn at the scale the positioning mockup shows it (98px period).
 */
export const AIM_DASH = { tileWidth: 19, tileHeight: 154, refScale: 98 / 154 };

/** Black at 65% — measured by comparing the dimmed and undimmed mockups. */
export const MODAL_DIM = "rgba(0, 0, 0, 0.65)";
