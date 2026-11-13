import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { getEnv } from "@/core/services/env";

import { authenticateSocket } from "./realtime.auth";
import { registerPresenceHandlers } from "./handlers";
import type { RealtimeServer } from "./realtime.types";
import { accountRoom } from "./realtime.utils";

let io: RealtimeServer | null = null;

/**
 * Attaches the Socket.IO server to the HTTP server and registers every handler.
 */
export function createRealtime(httpServer: HttpServer): RealtimeServer {
  io = new Server(httpServer, {
    cors: { origin: getEnv().WEB_ORIGIN, credentials: true },
  });
  io.use((socket, next) => {
    void authenticateSocket(socket, next);
  });
  io.on("connection", (socket) => {
    void socket.join(accountRoom(socket.data.member.accountId));
    registerPresenceHandlers(io as RealtimeServer, socket);
  });
  return io;
}

/**
 * Drops every live socket that belongs to the account.
 */
export function disconnectAccount(accountId: string): void {
  io?.in(accountRoom(accountId)).disconnectSockets(true);
}
