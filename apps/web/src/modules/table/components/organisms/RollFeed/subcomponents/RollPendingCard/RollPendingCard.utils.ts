/**
 * A random d20 face for the rolling animation.
 */
export function randomFace(): number {
  return 1 + Math.floor(Math.random() * 20);
}
