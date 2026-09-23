import { GameEngine } from "../../src/index.js";
import {
  getLanguage,
  getMusicEnabled,
  getSoundEnabled,
  LanguageCode,
  setAdsRemoved,
  setLanguage,
  setMusicEnabled,
  setSoundEnabled,
  SUPPORTED_LANGUAGES,
} from "./storage.js";
import { MODAL_DIM, REMOVE_ADS_PANEL, SETTINGS_PANEL, Rect } from "./uiLayout.js";
import { placeInImage, ref } from "./refPx.js";

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  pt: "Português",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
};

interface PanelSpec {
  src: string;
  natural: { w: number; h: number };
  placement: { x: number; y: number; scale: number };
}

/**
 * A modal showing one original panel PNG exactly as provided, over a dimmed
 * screen. Interactive parts (X, buttons, toggles) are invisible hit areas
 * laid over the PNG's own drawing of them — nothing is redrawn.
 */
export class Panel {
  readonly overlay: HTMLDivElement;
  /** Same box as the panel PNG; children are positioned in its pixel coords. */
  readonly frame: HTMLDivElement;

  constructor(readonly spec: PanelSpec) {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal-overlay";
    this.overlay.style.background = MODAL_DIM;

    this.frame = document.createElement("div");
    this.frame.className = "panel-frame";
    const { x, y, scale } = spec.placement;
    this.frame.style.left = ref(x);
    this.frame.style.top = ref(y);
    this.frame.style.width = ref(spec.natural.w * scale);
    this.frame.style.height = ref(spec.natural.h * scale);

    const img = document.createElement("img");
    img.className = "panel-image";
    img.src = spec.src;
    img.alt = "";
    img.draggable = false;
    this.frame.appendChild(img);

    this.overlay.appendChild(this.frame);
  }

  addHotspot(rect: Rect, label: string, onTap: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hotspot";
    button.setAttribute("aria-label", label);
    placeInImage(button, rect, this.spec.natural);
    button.addEventListener("click", onTap);
    this.frame.appendChild(button);
    return button;
  }

  open(root: HTMLElement): void {
    root.appendChild(this.overlay);
    requestAnimationFrame(() => this.overlay.classList.add("visible"));
  }

  close(): void {
    this.overlay.classList.remove("visible");
    window.setTimeout(() => this.overlay.remove(), 180);
  }
}

/**
 * One of the panel's two switches. The panel PNG draws both switches ON, so
 * at rest in the ON state nothing is layered on top — the original pixels
 * show as-is. Turning it OFF lays the knob-less section of the same switch
 * over the drawn knob and slides the knob (lifted from the same PNG) left.
 */
function attachToggle(
  panel: Panel,
  cfg: (typeof SETTINGS_PANEL.toggles)["sound"],
  coverSrc: string,
  hotspot: Rect,
  label: string,
  initial: boolean,
  onChange: (value: boolean) => void,
): void {
  const natural = SETTINGS_PANEL.natural;
  const knobHalf = SETTINGS_PANEL.knobSize / 2;

  const cover = document.createElement("img");
  cover.className = "panel-layer";
  cover.src = coverSrc;
  cover.alt = "";
  placeInImage(cover, { x: cfg.cover.x, y: cfg.cover.y, w: SETTINGS_PANEL.coverSize, h: SETTINGS_PANEL.coverSize }, natural);

  const knob = document.createElement("img");
  knob.className = "panel-layer toggle-knob";
  knob.src = "../assets/panels/toggle-knob.png";
  knob.alt = "";
  const knobRect = (c: { x: number; y: number }): Rect => ({
    x: c.x - knobHalf,
    y: c.y - knobHalf,
    w: SETTINGS_PANEL.knobSize,
    h: SETTINGS_PANEL.knobSize,
  });

  panel.frame.appendChild(cover);
  panel.frame.appendChild(knob);

  let value = initial;
  const showLayers = (visible: boolean): void => {
    cover.style.display = visible ? "block" : "none";
    knob.style.display = visible ? "block" : "none";
  };

  if (value) {
    showLayers(false);
  } else {
    placeInImage(knob, knobRect(cfg.off), natural);
    showLayers(true);
  }

  panel.addHotspot(hotspot, label, () => {
    value = !value;
    onChange(value);

    knob.classList.remove("sliding");
    placeInImage(knob, knobRect(value ? cfg.off : cfg.on), natural);
    showLayers(true);
    void knob.offsetWidth; // commit the start position before animating
    knob.classList.add("sliding");
    placeInImage(knob, knobRect(value ? cfg.on : cfg.off), natural);

    if (value) {
      knob.addEventListener(
        "transitionend",
        () => {
          if (value) {
            showLayers(false);
          }
        },
        { once: true },
      );
    }
  });
}

/** SETTINGS: sound/music switches (persisted), reset (restarts the run), language. */
export function createSettingsPanel(engine: GameEngine): Panel {
  const panel = new Panel(SETTINGS_PANEL);
  const h = SETTINGS_PANEL.hotspots;

  attachToggle(
    panel,
    SETTINGS_PANEL.toggles.sound,
    "../assets/panels/toggle-cover-sound.png",
    h.sound,
    "Sound",
    getSoundEnabled(),
    setSoundEnabled,
  );
  attachToggle(
    panel,
    SETTINGS_PANEL.toggles.music,
    "../assets/panels/toggle-cover-music.png",
    h.music,
    "Music",
    getMusicEnabled(),
    setMusicEnabled,
  );

  panel.addHotspot(h.reset, "Reset", () => {
    engine.restartGame();
    panel.close();
  });

  // No language-picker artwork was provided, so the LANGUAGE button opens the
  // device's own native picker instead of a made-up one: an invisible <select>
  // sits over the button drawn in the PNG.
  const select = document.createElement("select");
  select.className = "hotspot";
  select.setAttribute("aria-label", "Language");
  placeInImage(select, h.language, SETTINGS_PANEL.natural);
  for (const code of SUPPORTED_LANGUAGES) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = LANGUAGE_LABELS[code];
    select.appendChild(option);
  }
  select.value = getLanguage();
  select.addEventListener("change", () => setLanguage(select.value as LanguageCode));
  panel.frame.appendChild(select);

  panel.addHotspot(h.close, "Close", () => panel.close());
  return panel;
}

/** REMOVE ADS: one-time purchase. Placeholder — no payment SDK is wired up yet. */
export function createRemoveAdsPanel(onPurchased: () => void): Panel {
  const panel = new Panel(REMOVE_ADS_PANEL);
  const h = REMOVE_ADS_PANEL.hotspots;

  panel.addHotspot(h.buy, "Buy: remove ads", () => {
    // Connect the store's purchase flow here, and only call setAdsRemoved(true)
    // once a valid receipt is confirmed.
    setAdsRemoved(true);
    onPurchased();
    panel.close();
  });
  panel.addHotspot(h.close, "Close", () => panel.close());
  return panel;
}
