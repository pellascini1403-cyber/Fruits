/**
 * Storage boundary. The engine never touches `localStorage` (or any browser
 * API) directly — it depends only on this interface, so it runs unchanged in
 * a browser, in Node, in tests, or under a future interface with its own
 * storage (cloud save, native app, etc).
 */
export interface PersistenceAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Minimal shape of the Web Storage API, so this file doesn't need the DOM lib. */
interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Default adapter for browser environments. */
export class LocalStoragePersistenceAdapter implements PersistenceAdapter {
  getItem(key: string): string | null {
    try {
      const storage = (globalThis as { localStorage?: WebStorageLike }).localStorage;
      return storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      const storage = (globalThis as { localStorage?: WebStorageLike }).localStorage;
      storage?.setItem(key, value);
    } catch {
      // Storage unavailable (private browsing, quota, SSR) — fail silently,
      // persistence is a nice-to-have, never a gameplay requirement.
    }
  }
}

/** In-memory fallback used in Node/tests, or when localStorage is unavailable. */
export class InMemoryPersistenceAdapter implements PersistenceAdapter {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

export function createDefaultPersistenceAdapter(): PersistenceAdapter {
  const hasLocalStorage = typeof globalThis !== "undefined" && "localStorage" in globalThis;
  return hasLocalStorage ? new LocalStoragePersistenceAdapter() : new InMemoryPersistenceAdapter();
}
