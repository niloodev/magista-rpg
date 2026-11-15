import { LATENCY_PING_MIN_GAP_MS, TABLE_ROOM, type IPresenceMember } from "@magista/shared";

import type { RealtimeServer, RealtimeSocket } from "../../realtime.types";

async function broadcastPresence(io: RealtimeServer): Promise<void> {
  const sockets = await io.in(TABLE_ROOM).fetchSockets();
  const members = new Map<string, IPresenceMember>();
  for (const socket of sockets) members.set(socket.data.member.accountId, socket.data.member);
  io.to(TABLE_ROOM).emit("presence:update", [...members.values()]);
}

/**
 * Joins the socket to the main table, keeps every client's online list in sync and answers latency pings
 * (at most one per `LATENCY_PING_MIN_GAP_MS`).
 */
export function registerPresenceHandlers(io: RealtimeServer, socket: RealtimeSocket): void {
  void socket.join(TABLE_ROOM);
  let lastPing = 0;
  socket.on("presence:ping", (ack) => {
    const now = Date.now();
    if (typeof ack !== "function" || now - lastPing < LATENCY_PING_MIN_GAP_MS) return;
    lastPing = now;
    ack();
  });
  void broadcastPresence(io);
  socket.on("disconnect", () => {
    void broadcastPresence(io);
  });
}
