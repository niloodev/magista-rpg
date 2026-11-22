import { WORLD_FOG_COLUMNS, isFogCovered } from "@magista/shared";

import { colorChannels } from "@/modules/arena/services/arenaEnergyFlow";

import { WORLD_CLOUD_COLORS, WORLD_SUN } from "./arenaWorldClouds.constants";

/**
 * Moves each fog cell toward its goal (0 clear, 1 covered) by `amount` (the share of a full change this frame).
 * Returns whether any cell is still changing.
 */
export function stepCoverage(cells: Float32Array, goal: Float32Array, amount: number): boolean {
  let moving = false;
  for (let index = 0; index < cells.length; index += 1) {
    const current = cells[index] ?? 0;
    const target = goal[index] ?? 0;
    if (current === target) continue;
    const next =
      current < target ? Math.min(current + amount, target) : Math.max(current - amount, target);
    cells[index] = next;
    if (next !== target) moving = true;
  }
  return moving;
}

/** The goal of every cell from a fog mask (1 covered, 0 clear). */
export function coverageGoal(mask: Uint8Array, goal: Float32Array): void {
  for (let index = 0; index < goal.length; index += 1) {
    goal[index] = isFogCovered(
      mask,
      index % WORLD_FOG_COLUMNS,
      Math.floor(index / WORLD_FOG_COLUMNS),
    )
      ? 1
      : 0;
  }
}

/** Writes the cells into the RGBA bytes of the fog texture (gray = coverage, opaque). */
export function writeCoverage(cells: Float32Array, bytes: Uint8Array): void {
  for (let index = 0; index < cells.length; index += 1) {
    const value = Math.round((cells[index] ?? 0) * 255);
    const offset = index * 4;
    bytes[offset] = value;
    bytes[offset + 1] = value;
    bytes[offset + 2] = value;
    bytes[offset + 3] = 255;
  }
}

/** The uniforms of the cloud sea shared by every cloud shader (colors and the direction of the sun). */
export function cloudSeaUniforms(): Record<string, { value: Float32Array; type: string }> {
  const color = (value: number) => ({
    value: new Float32Array(colorChannels(value)),
    type: "vec3<f32>",
  });
  return {
    uSun: color(WORLD_CLOUD_COLORS.sun),
    uLight: color(WORLD_CLOUD_COLORS.light),
    uShade: color(WORLD_CLOUD_COLORS.shade),
    uDeep: color(WORLD_CLOUD_COLORS.deep),
    uSunDir: { value: new Float32Array([WORLD_SUN.x, WORLD_SUN.y]), type: "vec2<f32>" },
  };
}
