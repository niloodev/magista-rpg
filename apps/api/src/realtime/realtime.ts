import type { Server as HttpServer } from "node:http";

import {
  GM_ROOM,
  isErrorResult,
  ROLL_HISTORY_LIMIT,
  ROLL_REVEAL_DELAY_MS,
  TABLE_ROOM,
  type ICharacter,
  type IRollResult,
} from "@magista/shared";
import { Server } from "socket.io";

import { characterController } from "@/core/controllers/character";
import { getEnv } from "@/core/services/env";

import { registerPresenceHandlers, registerRollHandlers } from "./handlers";
import { authenticateSocket } from "./realtime.auth";
import type { RealtimeServer, RealtimeSocket } from "./realtime.types";
import { accountRoom, characterRoom } from "./realtime.utils";

let io: RealtimeServer | null = null;

let recentRolls: IRollResult[] = [];

/**
 * Attaches the Socket.IO server to the HTTP server and registers every handler.
 */
export function createRealtime(httpServer: HttpServer): RealtimeServer {
  const server: RealtimeServer = new Server(httpServer, {
    cors: { origin: getEnv().WEB_ORIGIN, credentials: true },
    allowRequest: (req, callback) => callback(null, req.headers.origin === getEnv().WEB_ORIGIN),
  });
  server.use((socket, next) => {
    void authenticateSocket(socket, next);
  });
  server.on("connection", (socket) => {
    const { member } = socket.data;
    void socket.join(accountRoom(member.accountId));
    if (member.role === "GM") void socket.join(GM_ROOM);
    else void joinCharacterRooms(socket);
    socket.emit("roll:history", recentRolls);
    registerPresenceHandlers(server, socket);
    registerRollHandlers(socket, broadcastRollResult);
  });
  io = server;
  return server;
}

/**
 * Puts a player's socket in the room of every character the GM granted to their account. Access is
 * read again after joining, so a grant revoked in between does not leave the socket in that room.
 */
async function joinCharacterRooms(socket: RealtimeSocket): Promise<void> {
  const { accountId, role } = socket.data.member;
  const first = await characterController.listAccessibleIds({ accountId, role });
  if (isErrorResult(first)) return;
  await socket.join(first.payload.map(characterRoom));
  const current = await characterController.listAccessibleIds({ accountId, role });
  const allowed = isErrorResult(current) ? [] : current.payload;
  for (const id of first.payload.filter((characterId) => !allowed.includes(characterId)))
    await socket.leave(characterRoom(id));
}

/**
 * Follows an access change on live sockets: accounts that lost the character leave its room, new ones join.
 */
export function syncCharacterAccess(
  characterId: string,
  previousAccountIds: string[],
  accountIds: string[],
): void {
  const room = characterRoom(characterId);
  const removed = previousAccountIds.filter((id) => !accountIds.includes(id));
  const added = accountIds.filter((id) => !previousAccountIds.includes(id));
  if (removed.length > 0) io?.in(removed.map(accountRoom)).socketsLeave(room);
  if (added.length > 0) io?.in(added.map(accountRoom)).socketsJoin(room);
}

/**
 * Tells the GM (and the given player accounts) that the character library changed, so they refetch it.
 */
export function broadcastLibraryChanged(accountIds: string[] = []): void {
  io?.to([GM_ROOM, ...accountIds.map(accountRoom)]).emit("library:changed");
}

/**
 * Drops every live socket that belongs to the account.
 */
export function disconnectAccount(accountId: string): void {
  io?.in(accountRoom(accountId)).disconnectSockets(true);
}

/**
 * Pushes a saved sheet to the tabs of every account with access to it and to the GM.
 */
export function broadcastCharacterUpdate(character: ICharacter, origin: string | null): void {
  io?.to([characterRoom(character.id), GM_ROOM]).emit("character:updated", { character, origin });
}

/**
 * Shares a roll with the whole table once the roller's animation has revealed it, and keeps it in the recent
 * history sent to every socket that connects (in memory; persisted history comes with the chat).
 */
export function broadcastRollResult(roll: IRollResult): void {
  setTimeout(() => {
    recentRolls = [roll, ...recentRolls].slice(0, ROLL_HISTORY_LIMIT);
    io?.to(TABLE_ROOM).emit("roll:result", roll);
  }, ROLL_REVEAL_DELAY_MS);
}
