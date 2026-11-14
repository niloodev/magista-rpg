export const SPIN_INTERVAL_MS = 50;

export const FADE_OUT_MS = 300;

export const FUMBLE_LABEL = "1 natural";

export const HEX_THEMES = {
  ruby: {
    ring: "rgba(228,42,99,0.18)",
    glow: "bg-primary/40",
    flash: "bg-primary/25",
    total: "text-white drop-shadow-[0_0_20px_rgba(228,42,99,0.9)]",
    caption: "text-accent-text",
  },
  gold: {
    ring: "linear-gradient(135deg, #b45309, #fde68a 45%, #f59e0b 70%, #fef3c7)",
    total: "text-gold-300",
    caption: "text-gold-300",
  },
} as const;
