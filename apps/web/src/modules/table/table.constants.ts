export const ROLL_FEED_LIMIT = 50;

export const HEXAGON = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export const TABLE_TITLES = { gm: "Mestre da mesa", player: "Mesa Magista" } as const;

export const PRESENCE_HINT_KEY = "p";

export const FEED_HINT_KEY = "f";

export const FEED_HINT_CARDS = 6;

export const FEED_HINT_MAX_ROWS = 6;

export const FEED_HINT_MAX_NOTES = 6;

export const FEED_HINT_MAX_NOTE = 600;

export const SHORT_NOTE_MAX_LENGTH = 160;

export const PRESENCE_HINT_MAX = 12;

export const FEED_HINT_MAX_CHIPS = 40;

export const NATURAL_LABELS = { critical: "20 natural", fumble: "1 natural" } as const;

export const ROLLED_BY_GM_LABEL = "rolado pelo Mestre";

export const FEED_FLAG_BY_GM = 1;

export const FEED_FLAG_CRITICAL = 2;

export const CRITICAL_BADGE_LABEL = "Crítico";

export const ROLL_CARD_STYLES = {
  critical:
    "border-gold-400/80 bg-[linear-gradient(160deg,rgba(120,72,6,0.35),rgba(0,0,0,0.6)_55%)]",
  levelUp:
    "border-teal-400/70 bg-[linear-gradient(160deg,rgba(13,148,136,0.25),rgba(0,0,0,0.6)_55%)]",
  normal: "border-white/10 bg-black/50 hover:border-primary/40",
} as const;

export const FEED_FLAG_LEVEL_UP = 4;
