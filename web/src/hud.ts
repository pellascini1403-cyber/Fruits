import { GameEngine } from "../../src/index.js";
import { webFruitSpritePath } from "./assetPath.js";
import { fruitSpriteBoxByHeight } from "./fruitVisuals.js";
import { createRemoveAdsPanel, createSettingsPanel } from "./panels.js";
import { PowerUpButtonRefs } from "./powerups.js";
import { getAdsRemoved, isPowerUpAvailableToday, PowerUpKey } from "./storage.js";
import { HUD_LAYOUT, NEXT_FRUIT_SLOT, Rect } from "./uiLayout.js";
import { placeRef } from "./refPx.js";

function imageButton(parent: HTMLElement, rect: Rect, src: string, label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hud-button";
  button.setAttribute("aria-label", label);
  placeRef(button, rect);
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.draggable = false;
  button.appendChild(img);
  parent.appendChild(button);
  return button;
}

const POWER_UPS: { key: PowerUpKey; rect: Rect; base: string; label: string }[] = [
  { key: "shake", rect: HUD_LAYOUT.shake, base: "powerup-shake", label: "Shake the phone to mix them" },
  { key: "upgrade", rect: HUD_LAYOUT.upgrade, base: "powerup-upgrade", label: "Upgrade a fruit" },
  { key: "bomb", rect: HUD_LAYOUT.bomb, base: "powerup-bomb", label: "Explode a fruit" },
  { key: "shrink", rect: HUD_LAYOUT.shrink, base: "powerup-shrink", label: "Remove small fruits" },
];

/**
 * Builds the HUD from the original PNGs at their measured positions, wires
 * the settings / remove-ads / next-fruit behaviour, and returns the power-up
 * buttons for the PowerUpController.
 */
export function setupHud(engine: GameEngine, root: HTMLElement): PowerUpButtonRefs[] {
  const hud = document.createElement("div");
  hud.className = "hud";
  root.appendChild(hud);

  const settingsPanel = createSettingsPanel(engine);
  const removeAdsPanel = createRemoveAdsPanel(() => undefined);

  imageButton(hud, HUD_LAYOUT.menu, "../assets/hud/menu.png", "Settings").addEventListener("click", () =>
    settingsPanel.open(root),
  );
  imageButton(hud, HUD_LAYOUT.noAds, "../assets/hud/no-ads.png", "Remove ads").addEventListener("click", () => {
    if (!getAdsRemoved()) {
      removeAdsPanel.open(root);
    }
  });

  // NEXT: the original badge (its sample apple removed), with the real next
  // fruit drawn in the same spot and at the same size the apple had.
  const next = document.createElement("div");
  next.className = "next-badge";
  placeRef(next, HUD_LAYOUT.next);
  const badge = document.createElement("img");
  badge.className = "next-badge-image";
  badge.src = "../assets/hud/next-badge.png";
  badge.alt = "";
  badge.draggable = false;
  const nextFruit = document.createElement("img");
  nextFruit.className = "next-fruit";
  nextFruit.alt = "Next fruit";
  nextFruit.draggable = false;
  next.appendChild(badge);
  next.appendChild(nextFruit);
  hud.appendChild(next);

  let shownLevel: number | null = null;
  const renderNext = (): void => {
    const level = engine.getNextFruit();
    if (level === null || level === shownLevel) {
      return;
    }
    shownLevel = level;
    const s = NEXT_FRUIT_SLOT;
    const box = fruitSpriteBoxByHeight(level, s.centerX, s.centerY, s.contentHeight);
    nextFruit.src = webFruitSpritePath(level);
    nextFruit.style.left = `${(box.left / s.imageWidth) * 100}%`;
    nextFruit.style.top = `${(box.top / s.imageHeight) * 100}%`;
    nextFruit.style.width = `${(box.size / s.imageWidth) * 100}%`;
    nextFruit.style.height = `${(box.size / s.imageHeight) * 100}%`;
  };
  renderNext();
  engine.subscribe(renderNext);

  return POWER_UPS.map(({ key, rect, base, label }) => {
    const state = isPowerUpAvailableToday(key) ? "available" : "used";
    const el = imageButton(hud, rect, `../assets/hud/${base}-${state}.png`, label);
    el.classList.add("powerup-button");
    return {
      key,
      el,
      img: el.querySelector("img") as HTMLImageElement,
      availableSrc: `../assets/hud/${base}-available.png`,
      usedSrc: `../assets/hud/${base}-used.png`,
    };
  });
}
