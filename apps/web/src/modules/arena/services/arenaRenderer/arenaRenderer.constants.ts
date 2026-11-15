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

export const ARENA_TOKEN_TEXTURE_SIZE = 256;

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
