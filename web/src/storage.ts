/**
 * Browser-side preferences: sound/music toggle, ads-removed flag, chosen
 * language, and the daily free-use counters for the 4 power-ups. Kept
 * separate from the engine's own PersistenceAdapter (bestScore) since this
 * is purely presentation-layer state the engine has no reason to know about.
 */

const KEYS = {
  sound: "fruvo.sound",
  music: "fruvo.music",
  adsRemoved: "fruvo.adsRemoved",
  language: "fruvo.language",
  dailyPowerUps: "fruvo.dailyPowerUps",
} as const;

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "true";
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // storage unavailable — preference just won't persist, not fatal.
  }
}

export function getSoundEnabled(): boolean {
  return readBool(KEYS.sound, true);
}
export function setSoundEnabled(value: boolean): void {
  writeBool(KEYS.sound, value);
}

export function getMusicEnabled(): boolean {
  return readBool(KEYS.music, true);
}
export function setMusicEnabled(value: boolean): void {
  writeBool(KEYS.music, value);
}

export function getAdsRemoved(): boolean {
  return readBool(KEYS.adsRemoved, false);
}
export function setAdsRemoved(value: boolean): void {
  writeBool(KEYS.adsRemoved, value);
}

export const SUPPORTED_LANGUAGES = ["es", "en", "fr", "pt", "zh", "ja", "ko", "ru"] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export function getLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(KEYS.language);
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(raw ?? "")
      ? (raw as LanguageCode)
      : "es";
  } catch {
    return "es";
  }
}
export function setLanguage(value: LanguageCode): void {
  try {
    localStorage.setItem(KEYS.language, value);
  } catch {
    // ignore
  }
}

export type PowerUpKey = "shake" | "upgrade" | "bomb" | "shrink";

interface DailyPowerUpRecord {
  date: string; // YYYY-MM-DD
  used: Partial<Record<PowerUpKey, boolean>>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readDailyRecord(): DailyPowerUpRecord {
  try {
    const raw = localStorage.getItem(KEYS.dailyPowerUps);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyPowerUpRecord;
      if (parsed.date === todayKey()) {
        return parsed;
      }
    }
  } catch {
    // fall through to a fresh record
  }
  return { date: todayKey(), used: {} };
}

function writeDailyRecord(record: DailyPowerUpRecord): void {
  try {
    localStorage.setItem(KEYS.dailyPowerUps, JSON.stringify(record));
  } catch {
    // ignore
  }
}

/** True while this power-up still has its one free use available today. */
export function isPowerUpAvailableToday(key: PowerUpKey): boolean {
  return !readDailyRecord().used[key];
}

/** Marks today's free use of this power-up as spent. */
export function consumePowerUpForToday(key: PowerUpKey): void {
  const record = readDailyRecord();
  record.used[key] = true;
  writeDailyRecord(record);
}
