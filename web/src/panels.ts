import { GameEngine } from "../../src/index.js";
import {
  getAdsRemoved,
  getLanguage,
  getMusicEnabled,
  getSoundEnabled,
  setAdsRemoved,
  setLanguage,
  setMusicEnabled,
  setSoundEnabled,
  SUPPORTED_LANGUAGES,
  LanguageCode,
} from "./storage.js";

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

/** Generic dim-overlay + centered panel with a close X, shared by every panel. */
export class Panel {
  readonly overlay: HTMLDivElement;
  readonly card: HTMLDivElement;

  constructor(className: string, onClose: () => void) {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal-overlay";

    this.card = document.createElement("div");
    this.card.className = `panel-card ${className}`;

    const closeButton = document.createElement("button");
    closeButton.className = "panel-close";
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.textContent = "✕";
    closeButton.addEventListener("click", onClose);

    this.card.appendChild(closeButton);
    this.overlay.appendChild(this.card);

    this.overlay.addEventListener("click", (event) => {
      if (event.target === this.overlay) {
        onClose();
      }
    });
  }

  open(root: HTMLElement): void {
    root.appendChild(this.overlay);
    requestAnimationFrame(() => this.overlay.classList.add("visible"));
  }

  close(): void {
    this.overlay.classList.remove("visible");
    window.setTimeout(() => this.overlay.remove(), 200);
  }
}

function makeToggle(label: string, initial: boolean, onChange: (value: boolean) => void): HTMLElement {
  const row = document.createElement("div");
  row.className = "settings-toggle-row";

  const track = document.createElement("button");
  track.type = "button";
  track.className = "toggle-track";
  track.classList.toggle("on", initial);
  const knob = document.createElement("span");
  knob.className = "toggle-knob";
  track.appendChild(knob);

  let value = initial;
  track.addEventListener("click", () => {
    value = !value;
    track.classList.toggle("on", value);
    onChange(value);
  });

  const text = document.createElement("span");
  text.className = "settings-label";
  text.textContent = label;

  row.appendChild(track);
  row.appendChild(text);
  return row;
}

function makeIconAction(label: string, iconText: string, onClick: () => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "settings-icon-action";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-round-icon";
  button.textContent = iconText;
  button.addEventListener("click", onClick);
  const text = document.createElement("span");
  text.className = "settings-label";
  text.textContent = label;
  wrap.appendChild(button);
  wrap.appendChild(text);
  return wrap;
}

/** SETTINGS panel: sound/music toggles (persisted), reset (restarts the run), language picker shell. */
export function createSettingsPanel(engine: GameEngine): Panel {
  let panel!: Panel;
  panel = new Panel("settings-panel", () => panel.close());

  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "SETTINGS";
  panel.card.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "settings-grid";
  grid.appendChild(makeToggle("SOUND", getSoundEnabled(), setSoundEnabled));
  grid.appendChild(makeToggle("MUSIC", getMusicEnabled(), setMusicEnabled));
  grid.appendChild(
    makeIconAction("RESET", "⟲", () => {
      engine.restartGame();
      panel.close();
    }),
  );
  grid.appendChild(makeIconAction("LANGUAGE", "Aa", () => openLanguagePicker(panel)));
  panel.card.appendChild(grid);

  return panel;
}

function openLanguagePicker(parentPanel: Panel): void {
  const list = document.createElement("div");
  list.className = "language-list";
  for (const code of SUPPORTED_LANGUAGES) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "language-option";
    option.classList.toggle("selected", getLanguage() === code);
    option.textContent = LANGUAGE_LABELS[code];
    option.addEventListener("click", () => {
      setLanguage(code);
      for (const sibling of list.children) {
        sibling.classList.remove("selected");
      }
      option.classList.add("selected");
    });
    list.appendChild(option);
  }

  const existing = parentPanel.card.querySelector(".language-list");
  if (existing) {
    existing.replaceWith(list);
  } else {
    parentPanel.card.appendChild(list);
  }
}

/** REMOVE ADS panel: one-time purchase placeholder — no real payment SDK wired yet. */
export function createRemoveAdsPanel(onPurchased: () => void): Panel {
  let panel!: Panel;
  panel = new Panel("remove-ads-panel", () => panel.close());

  const banner = document.createElement("div");
  banner.className = "panel-title";
  banner.textContent = "REMOVE ADS";
  panel.card.appendChild(banner);

  const description = document.createElement("ul");
  description.className = "remove-ads-bullets";
  description.innerHTML = "<li>Keep video Ads for rewards</li><li>Remove banner and full screen Ads</li>";
  panel.card.appendChild(description);

  const priceButton = document.createElement("button");
  priceButton.type = "button";
  priceButton.className = "price-button";
  priceButton.textContent = "$US 6.99";
  priceButton.addEventListener("click", () => {
    // Placeholder: no real payment SDK is wired up yet. Connect your store's
    // purchase flow here, then only call setAdsRemoved(true) after a valid
    // receipt is confirmed.
    setAdsRemoved(true);
    onPurchased();
    panel.close();
  });
  panel.card.appendChild(priceButton);

  return panel;
}

export { getAdsRemoved };
