import type { ConnectionStatus } from "@/modules/table/table.types";

export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Conectando...",
  connected: "Conectado",
  disconnected: "Desconectado",
};

export const STATUS_DOT: Record<ConnectionStatus, string> = {
  connecting: "bg-ruby-400 animate-pulse",
  connected: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]",
  disconnected: "bg-destructive",
};

export const PRESENCE_TITLE = "Jogadores online";

export const CONNECTION_STATUSES: ConnectionStatus[] = ["connecting", "connected", "disconnected"];

export const PRESENCE_LOADING_LABEL = "Carregando quem está online...";
