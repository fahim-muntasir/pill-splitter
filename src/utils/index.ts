import type { Pill, Radii } from "../types";

export const INITIAL_BORDER_RADIUS = 20;
export const MIN_PILL = 40;
export const MIN_PART = 20;

export const rndColor = (): string => {
  const h = Math.floor(Math.random() * 360);
  const s = 65;
  const l = 65;
  return `hsl(${h} ${s}% ${l}%)`;
};

export const uid = (() => {
  let i = 1;
  return () => `p${i++}`;
})();

export const intersectsV = (rect: Pill, x: number): boolean =>
  x > rect.x && x < rect.x + rect.w;

export const intersectsH = (rect: Pill, y: number): boolean =>
  y > rect.y && y < rect.y + rect.h;

export function computeRadii(orig: Pill, part: Pill): Radii {
  const or = orig.radii ?? {
    tl: INITIAL_BORDER_RADIUS,
    tr: INITIAL_BORDER_RADIUS,
    br: INITIAL_BORDER_RADIUS,
    bl: INITIAL_BORDER_RADIUS,
  };

  const origLeft = orig.x;
  const origRight = orig.x + orig.w;
  const origTop = orig.y;
  const origBottom = orig.y + orig.h;

  const partLeft = part.x;
  const partRight = part.x + part.w;
  const partTop = part.y;
  const partBottom = part.y + part.h;

  return {
    tl: partLeft === origLeft && partTop === origTop ? or.tl : 0,
    tr: partRight === origRight && partTop === origTop ? or.tr : 0,
    br: partRight === origRight && partBottom === origBottom ? or.br : 0,
    bl: partLeft === origLeft && partBottom === origBottom ? or.bl : 0,
  };
}
