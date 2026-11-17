import type { Graphics } from "pixi.js";

/**
 * Paints a soft darkness around (`x`, `y`): clear inside `inner`, closing in to `alpha` just past it and fading
 * out again before `outer`, in thin rings so it has no hard edge anywhere (a spell's darkness stays around its
 * target instead of covering the whole screen).
 */
export function paintFalloff(
  g: Graphics,
  x: number,
  y: number,
  inner: number,
  outer: number,
  color: number,
  alpha: number,
  rings = 18,
): Graphics {
  if (outer <= inner) return g;
  const step = (outer - inner) / rings;
  for (let ring = 0; ring < rings; ring += 1) {
    const share = ring / rings;
    const strength = Math.min(1, (share + 0.06) * 4) * (1 - Math.max(0, (share - 0.8) / 0.2));
    g.circle(x, y, inner + step * (ring + 0.5)).stroke({
      width: step * 1.06,
      color,
      alpha: alpha * strength,
    });
  }
  return g;
}

/**
 * Paints a soft round glow (for a flash) at (`x`, `y`) out to `radius`: stacked discs, brightest in the middle
 * and fading to nothing at the edge, so a flash never shows the edge of a rectangle.
 */
export function paintGlow(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  layers = 10,
): Graphics {
  for (let layer = 0; layer < layers; layer += 1)
    g.circle(x, y, radius * (1 - layer / layers)).fill({ color, alpha: 0.1 + 0.02 * layer });
  return g;
}
