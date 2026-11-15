import type { ConnectionStatus } from "./table.types";

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

export const MAXIMIZED_LABEL = "Máximo";

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

export const TABLE_OFFLINE_ERROR = "Sem conexão com a mesa. Aguarde reconectar.";

export const TABLE_ACK_TIMEOUT_MS = 8000;

export const SERVER_DISCONNECT_REASON = "io server disconnect";

export const SESSION_RECHECK_DELAY_MS = 1500;

export const CONNECTION_LABELS: Record<ConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: "Conectando à mesa", dot: "bg-ruby-400 animate-pulse" },
  connected: { label: "Mesa conectada", dot: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" },
  disconnected: { label: "Mesa desconectada", dot: "bg-destructive" },
};
