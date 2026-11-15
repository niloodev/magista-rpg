/**
 * Font family next/font registered for Cinzel, so canvas labels match the rest of the UI.
 */
export function readSerifFont(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--font-cinzel").trim();
  return value ? `${value}, serif` : "serif";
}
