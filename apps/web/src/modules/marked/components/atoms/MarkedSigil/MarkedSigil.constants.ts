import { MARKED_RUNE_PATHS } from "@/modules/marked/marked.constants";

const RING_RUNES = 28;

/** Othala (ᛟ), the rune of the Marca: a diamond whose lower sides cross into two legs. */
export const OTHALA_PATH = "M200 107L262 169L138 293M200 107L138 169L262 293";

/** Runes placed around the ring, each turned to face the center. */
export const SIGIL_RING_RUNES = Array.from({ length: RING_RUNES }, (_, index) => ({
  key: index,
  path: MARKED_RUNE_PATHS[index % MARKED_RUNE_PATHS.length] ?? "",
  transform: `rotate(${(360 / RING_RUNES) * index} 200 200) translate(200 32)`,
}));

const ORIGIN = "origin-center [transform-box:fill-box]";

export const SIGIL_SPIN_CLASSES = {
  outer: `${ORIGIN} animate-marked-spin`,
  runes: `${ORIGIN} animate-marked-spin-reverse`,
  core: `${ORIGIN} animate-marked-breathe`,
} as const;
