import type { ConnectionStatus } from "@/modules/table/table.types";

export const CONNECTION_LABELS: Record<ConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: "Conectando à mesa", dot: "bg-ruby-400 animate-pulse" },
  connected: { label: "Mesa conectada", dot: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" },
  disconnected: { label: "Mesa desconectada", dot: "bg-destructive" },
};
