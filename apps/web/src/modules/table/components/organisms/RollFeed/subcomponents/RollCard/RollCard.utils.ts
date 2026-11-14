/**
 * Formats an ISO date as HH:MM in the viewer's locale.
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
