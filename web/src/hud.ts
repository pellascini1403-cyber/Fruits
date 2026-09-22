import { GameEngine } from "../../src/index.js";
import { webFruitSpritePath } from "./assetPath.js";
import { createRemoveAdsPanel, createSettingsPanel, getAdsRemoved } from "./panels.js";

export interface HudRefs {
  root: HTMLElement;
  menuButton: HTMLElement;
  noAdsButton: HTMLElement;
  nextFruitImg: HTMLImageElement;
}

export function setupHud(engine: GameEngine, hud: HudRefs): void {
  const settingsPanel = createSettingsPanel(engine);
  const removeAdsPanel = createRemoveAdsPanel(() => refreshAdsButton());

  hud.menuButton.addEventListener("click", () => settingsPanel.open(hud.root));

  function refreshAdsButton(): void {
    hud.noAdsButton.classList.toggle("depleted", getAdsRemoved());
  }
  refreshAdsButton();

  hud.noAdsButton.addEventListener("click", () => {
    if (getAdsRemoved()) {
      return;
    }
    removeAdsPanel.open(hud.root);
  });

  let lastNextLevel: number | null = null;
  function renderNextPreview(): void {
    const next = engine.getNextFruit();
    if (next !== null && next !== lastNextLevel) {
      hud.nextFruitImg.src = webFruitSpritePath(next);
      lastNextLevel = next;
    }
  }
  renderNextPreview();
  engine.subscribe(renderNextPreview);
}
