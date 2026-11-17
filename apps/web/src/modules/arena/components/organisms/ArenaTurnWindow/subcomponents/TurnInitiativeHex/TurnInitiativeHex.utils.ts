/**
 * A random d20 face for the rolling animation.
 */
export function randomInitiativeFace(): number {
  return 1 + Math.floor(Math.random() * 20);
}
