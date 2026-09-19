import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FRUIT_SPRITE_PATHS, getFruitSpritePath } from "../assets/fruitSprites.js";
import { FruitLevel, MAX_FRUIT_LEVEL, MIN_FRUIT_LEVEL } from "../src/fruits/fruitTypes.js";
import { getAllFruitDefinitions } from "../src/fruits/fruitDefinitions.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("fruit sprite registry (assets/, outside the engine)", () => {
  it("has exactly one sprite per fruit level, matching the fruit table's names and order", () => {
    const definitions = getAllFruitDefinitions();
    expect(Object.keys(FRUIT_SPRITE_PATHS)).toHaveLength(definitions.length);

    for (const def of definitions) {
      const path = getFruitSpritePath(def.level);
      expect(path).toBeTruthy();
      // File name should reference the same fruit name the engine's table uses,
      // so a level and its sprite can never silently drift apart.
      expect(path.toLowerCase()).toContain(def.name.toLowerCase());
    }
  });

  it("covers every level from MIN_FRUIT_LEVEL to MAX_FRUIT_LEVEL with no gaps", () => {
    for (let level = MIN_FRUIT_LEVEL; level <= MAX_FRUIT_LEVEL; level++) {
      expect(() => getFruitSpritePath(level as FruitLevel)).not.toThrow();
    }
  });

  it("every registered PNG file actually exists on disk", () => {
    for (const path of Object.values(FRUIT_SPRITE_PATHS)) {
      expect(existsSync(resolve(REPO_ROOT, path))).toBe(true);
    }
  });

  it("every file in assets/fruits/ is accounted for in the registry (no orphan/unmapped PNGs)", () => {
    const files = readdirSync(resolve(REPO_ROOT, "assets/fruits")).filter((f) => f.endsWith(".png"));
    const registeredBasenames = new Set(
      Object.values(FRUIT_SPRITE_PATHS).map((p) => p.split("/").pop()),
    );
    expect(files).toHaveLength(11);
    for (const file of files) {
      expect(registeredBasenames.has(file)).toBe(true);
    }
  });

  it("throws for an unregistered level instead of silently returning undefined", () => {
    expect(() => getFruitSpritePath(999 as FruitLevel)).toThrow();
  });

  it("is never imported by the engine (src/), keeping physics/game logic asset-agnostic", () => {
    const srcDir = resolve(REPO_ROOT, "src");

    function collectFiles(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = resolve(dir, entry.name);
        return entry.isDirectory() ? collectFiles(full) : [full];
      });
    }

    const srcFiles = collectFiles(srcDir).filter((f) => f.endsWith(".ts"));
    for (const file of srcFiles) {
      const contents = readFileSync(file, "utf-8");
      expect(contents).not.toMatch(/fruitSprites/);
      expect(contents).not.toMatch(/assets\/fruits/);
    }
  });
});
