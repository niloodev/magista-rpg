/**
 * The Cinzel family loaded by next/font, for the amounts drawn on the canvas.
 */
export function readSerifFont(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-cinzel").trim();
  return value ? `${value}, serif` : "serif";
}
