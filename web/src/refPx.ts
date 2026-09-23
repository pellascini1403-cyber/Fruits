import type { Rect } from "./uiLayout.js";

/** A length in reference pixels (856px-wide mockup), scaled to the real screen via `--u`. */
export function ref(n: number): string {
  return `calc(var(--u) * ${n})`;
}

export function placeRef(el: HTMLElement, r: Rect): void {
  el.style.left = ref(r.x);
  el.style.top = ref(r.y);
  el.style.width = ref(r.w);
  el.style.height = ref(r.h);
}

/** Places `el` inside a parent that shows an image of `natural` size, using that image's own pixel coords. */
export function placeInImage(el: HTMLElement, r: Rect, natural: { w: number; h: number }): void {
  el.style.left = `${(r.x / natural.w) * 100}%`;
  el.style.top = `${(r.y / natural.h) * 100}%`;
  el.style.width = `${(r.w / natural.w) * 100}%`;
  el.style.height = `${(r.h / natural.h) * 100}%`;
}
