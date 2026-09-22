import { DEFAULT_GAME_CONFIG, GameEngine } from "../../src/index.js";
import { SimSpaceLayout } from "./layout.js";
import { FruitRenderer } from "./fruitRenderer.js";
import { Launcher } from "./launcher.js";
import { PowerUpController, PowerUpButtonRefs } from "./powerups.js";
import { setupHud } from "./hud.js";
import { SIM_DANGER_Y, SIM_HEIGHT, SIM_SPAWN_Y, SIM_WIDTH } from "./config.js";

function required<T extends Element>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing required element #${id}`);
  }
  return el as unknown as T;
}

function powerUpButton(id: string, key: PowerUpButtonRefs["key"], base: string): PowerUpButtonRefs {
  const el = required<HTMLElement>(id);
  const img = el.querySelector("img") as HTMLImageElement;
  return {
    key,
    el,
    img,
    availableSrc: `../assets/hud/${base}-available.png`,
    usedSrc: `../assets/hud/${base}-used.png`,
  };
}

function bootstrap(): void {
  const gameRoot = required<HTMLElement>("game-root");
  const uiRoot = required<HTMLElement>("ui-root");
  const boxImage = required<HTMLImageElement>("game-box");
  const simSpace = required<HTMLElement>("sim-space");

  // The physics container must match the fixed virtual coordinate space
  // that #sim-space is transformed onto (see layout.ts) — otherwise the
  // floor/danger-line/spawn point the engine simulates land at different
  // pixels than where the box's glass interior actually is on screen.
  const engine = new GameEngine({
    config: {
      ...DEFAULT_GAME_CONFIG,
      container: {
        ...DEFAULT_GAME_CONFIG.container,
        left: 0,
        right: SIM_WIDTH,
        floorY: SIM_HEIGHT,
        dangerY: SIM_DANGER_Y,
      },
      spawn: { spawnY: SIM_SPAWN_Y },
    },
  });

  const layout = new SimSpaceLayout(gameRoot, boxImage, simSpace);
  const fruitRenderer = new FruitRenderer(simSpace);

  const powerUpButtons: PowerUpButtonRefs[] = [
    powerUpButton("powerup-shake", "shake", "powerup-shake"),
    powerUpButton("powerup-upgrade", "upgrade", "powerup-upgrade"),
    powerUpButton("powerup-bomb", "bomb", "powerup-bomb"),
    powerUpButton("powerup-shrink", "shrink", "powerup-shrink"),
  ];
  const powerUps = new PowerUpController(engine, powerUpButtons, simSpace);

  const launcher = new Launcher(engine, layout, simSpace, simSpace, () => powerUps.isArmed());

  setupHud(engine, {
    root: uiRoot,
    menuButton: required("menu-button"),
    noAdsButton: required("no-ads-button"),
    nextFruitImg: required("next-fruit-img"),
  });

  function resize(): void {
    layout.recalculate();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  boxImage.addEventListener("load", resize);
  if (boxImage.complete) {
    resize();
  }

  let lastTime = performance.now();
  function frame(now: number): void {
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;

    engine.update(dt);
    fruitRenderer.sync(engine.getFruits());
    launcher.render();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
