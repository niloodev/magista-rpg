export const ARENA_COLORS = {
  void900: 0x060203,
  void800: 0x12040a,
  void700: 0x1a0610,
  ruby900: 0x5c0b25,
  ruby500: 0xe42a63,
  ruby400: 0xf07a9b,
  teal400: 0x2dd4bf,
  gold400: 0xfbbf24,
  label: 0xf6e7ec,
  black: 0x000000,
} as const;

export const ARENA_ZOOM_MIN = 0.08;

export const ARENA_ZOOM_MAX = 4;

export const ARENA_FIT_PADDING = 48;

export const ARENA_FIT_PADDING_COMPACT = 12;

export const ARENA_COMPACT_WIDTH = 640;

export const ARENA_WHEEL_SENSITIVITY = 0.0015;

export const ARENA_TOKEN_LERP = 0.3;

export const ARENA_SETTLE_DISTANCE = 0.5;

export const ARENA_LITE_FRAME_MS = 33;

/** Pace of the loop while only the turn aura moves (its bob is slow and small, so ~20 fps is enough). */
export const ARENA_TURN_FRAME_MS = 50;

/** How the shadow of a floating token shrinks and fades per share of its size it rises. */
export const ARENA_FLOAT_SHADOW = { shrink: 1.8, fade: 4 } as const;

export const ARENA_TOKEN_TEXTURE_SIZE = 256;

/** Isometric figures are drawn whole and larger than a round face, so they keep more detail. */
export const ARENA_FIGURE_TEXTURE_SIZE = 512;

/** Largest side of the map texture on the GPU (a 16384 px texture would take about 1 GB of video memory). */
export const ARENA_MAP_TEXTURE_MAX = 8192;

export const ARENA_CLICK_SLOP = 4;

export const ARENA_CAMERA_STORAGE_PREFIX = "magista-arena-camera:";

export const ARENA_CAMERA_SAVE_DELAY_MS = 300;

export const ARENA_LABEL_GAP = 6;

export const ARENA_LABEL_MIN_SCREEN_PX = 12;

/** Largest height of a token name on screen, so zooming into a small map does not blow the names up. */
export const ARENA_LABEL_MAX_SCREEN_PX = 18;

export const ARENA_HANDLE_SIZE = 10;

export const ARENA_FRAME_PADDING = 6;

export const RESIZE_CORNERS = [
  { x: 0, y: 0, cursor: "nwse-resize" },
  { x: 1, y: 0, cursor: "nesw-resize" },
  { x: 0, y: 1, cursor: "nesw-resize" },
  { x: 1, y: 1, cursor: "nwse-resize" },
] as const;

/** Length of the selection brackets of an isometric figure, as a fraction of its shorter half side. */
export const FIGURE_BRACKET_RATIO = 0.35;

/** Opacity of a name hidden from the players, as the GM sees it. */
export const ARENA_LABEL_FAINT_ALPHA = 0.4;

/** Pace of the loop while only ambient things move (the clouds of the world map, the party token colors). */
export const ARENA_AMBIENT_FRAME_MS = 33;

/**
 * The camera of the flight through the clouds: how far it pulls away taking off up (`rise`) or dives toward the
 * party taking off down (`dive`), and where it starts landing: close over the party on the world map (`landAbove`)
 * or high above a scene (`landBelow`), as zoom factors of its final camera.
 */
export const ARENA_PASSAGE_CAMERA = { rise: 0.3, dive: 4, landAbove: 5, landBelow: 0.3 } as const;

/** Brush outline drawn under the pointer while painting the fog. */
export const ARENA_BRUSH_CURSOR = { hide: 0xf07a9b, reveal: 0x2dd4bf, width: 1.5 } as const;

/** Smallest and largest size of the party token on screen (pixels), whatever the zoom. */
export const ARENA_PARTY_SCREEN = { min: 28, max: 44 } as const;

/** How long after the board opens the world map shaders and texture are prepared (ms), out of the first frames. */
export const ARENA_WARM_UP_DELAY_MS = 700;

/** Largest side of the world map texture in the light mode (a quarter of the memory of the full one). */
export const ARENA_WORLD_LITE_TEXTURE = 2048;

/** Points of each animation's timeline (ms) the warm-up draws, so the pieces that start late are created too. */
export const ARENA_WARM_STEPS_MS = [0, 250, 600, 1100, 1800, 2700, 3800] as const;

/** Size of the stand-in token the warm-up plays the animations on (map pixels). */
export const ARENA_WARM_TOKEN_SIZE = 140;
