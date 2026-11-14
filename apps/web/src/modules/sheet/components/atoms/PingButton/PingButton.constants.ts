export const PING_LABELS = {
  idle: "Mostrar",
  sent: "Na mesa",
  aria: (title: string) => `Mostrar ${title} na mesa`,
  sentAria: (title: string) => `${title} mostrado na mesa`,
} as const;
