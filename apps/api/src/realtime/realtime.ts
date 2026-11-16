import type { Server as HttpServer } from "node:http";

import {
  GM_ROOM,
  isErrorResult,
  ROLL_HISTORY_LIMIT,
  ROLL_REVEAL_DELAY_MS,
  TABLE_ROOM,
  type ICharacter,
  type ICharacterFeaturesEvent,
  type ICharacterImages,
  type IMarkedShare,
  type IRollResult,
} from "@magista/shared";
import { Server } from "socket.io";

import {
  arenaController,
  type ArenaAudience,
  type IArenaEffectDelivery,
  type IArenaStatusDelivery,
  type IArenaTokenChange,
  type IArenaTokenRemoval,
} from "@/core/controllers/arena";
import { characterController } from "@/core/controllers/character";
import {
  buildMarkedController,
  type IMarkedAudience,
  type IMarkedProposalPayload,
  type IMarkedResolutionPayload,
} from "@/core/controllers/marked";
import { getEnv } from "@/core/services/env";

import {
  registerArenaHandlers,
  registerMarkedHandlers,
  registerPresenceHandlers,
  registerRollHandlers,
} from "./handlers";
import { authenticateSocket } from "./realtime.auth";
import type { RealtimeServer, RealtimeSocket } from "./realtime.types";
import {
  accountRoom,
  characterRoom,
  effectEmits,
  groupTokenChanges,
  statusEmits,
  groupTokenRemovals,
  pendingOf,
} from "./realtime.utils";

let io: RealtimeServer | null = null;

let recentRolls: IRollResult[] = [];

/**
 * Someone can answer for the character right now: a player with access (in its room) or the GM.
 */
async function isCharacterAttended(characterId: string): Promise<boolean> {
  if (!io) return false;
  const sockets = await io.in([characterRoom(characterId), GM_ROOM]).fetchSockets();
  return sockets.length > 0;
}

const markedController = buildMarkedController(isCharacterAttended);

function markedRooms({ characterIds }: IMarkedAudience): string[] {
  return [...new Set(characterIds)].map(characterRoom).concat(GM_ROOM);
}

function broadcastMarkedProposal({ proposal, characterIds }: IMarkedProposalPayload): void {
  io?.to(markedRooms({ characterIds })).emit("marked:proposal", proposal);
}

function broadcastMarkedResolved({ resolution, characterIds }: IMarkedResolutionPayload): void {
  io?.to(markedRooms({ characterIds })).emit("marked:resolved", resolution);
}

function broadcastMarkedShare(share: IMarkedShare | null, audience: IMarkedAudience): void {
  io?.to(markedRooms(audience)).emit("marked:share", share);
}

/**
 * Sends the active Marca share and the pending proposal to a socket that just connected (only what it may see),
 * so a tab that reconnects mid-proposal is not left with a stale one.
 */
async function sendCurrentShare(socket: RealtimeSocket): Promise<void> {
  const { accountId, role } = socket.data.member;
  const result = await markedController.current({ accountId, role });
  if (!isErrorResult(result)) socket.emit("marked:share", result.payload);
  const proposal = await markedController.pendingFor({ accountId, role });
  if (proposal) socket.emit("marked:proposal", proposal);
}

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
    void sendCurrentShare(socket);
    registerPresenceHandlers(server, socket);
    registerRollHandlers(socket, { onRolled: broadcastRollResult, onPinged: publishToTable });
    registerMarkedHandlers(socket, {
      controller: markedController,
      onProposal: broadcastMarkedProposal,
      onResolved: broadcastMarkedResolved,
      onShare: broadcastMarkedShare,
    });
    registerArenaHandlers(socket, {
      onMoved: broadcastArenaTokens,
      onChanged: ({ effects, statuses, characters }) => {
        broadcastArenaEffects(effects);
        broadcastArenaStatuses(statuses);
        for (const character of characters) emitCharacterUpdated(character, null);
        void broadcastCharacterStatuses(characters);
      },
    });
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
  emitCharacterUpdated(character, origin);
  void broadcastCharacterStatuses([character]);
}

function emitCharacterUpdated(character: ICharacter, origin: string | null): void {
  io?.to([characterRoom(character.id), GM_ROOM]).emit("character:updated", { character, origin });
}

const sentCharacterResources = new Map<string, string>();

/**
 * Drops what was remembered about a deleted character (the last resources sent to the Arena).
 */
export function forgetCharacterStatus(characterId: string): void {
  sentCharacterResources.delete(characterId);
}

/**
 * Sends the new health and sanity of saved characters to the accounts that see them only through a token
 * permission on the live scene (the GM and the accounts with access already got `character:updated`), with one
 * query for all of them. Saves that do not change the resources send nothing; a failed lookup is retried on the
 * next save.
 */
async function broadcastCharacterStatuses(characters: ICharacter[]): Promise<void> {
  const changed = characters.filter((character) => {
    const key = JSON.stringify(character.sheet.resources);
    if (sentCharacterResources.get(character.id) === key) return false;
    sentCharacterResources.set(character.id, key);
    return true;
  });
  if (changed.length === 0) return;
  const deliveries = await arenaController.characterStatusDeliveries(
    changed.map((character) => character.id),
  );
  for (const delivery of deliveries) {
    const rooms = delivery.public ? [TABLE_ROOM] : delivery.accountIds.map(accountRoom);
    io?.to(rooms)
      .except([GM_ROOM, characterRoom(delivery.characterId)])
      .emit("arena:character-status", {
        characterId: delivery.characterId,
        status: delivery.status,
      });
  }
}

/**
 * Pushes new image URLs of a character to the GM and to every account with access to it.
 */
export function broadcastCharacterImages(images: ICharacterImages): void {
  io?.to([characterRoom(images.id), GM_ROOM]).emit("character:images", images);
}

/**
 * Announces a roll to the whole table at once (who rolls what, without the dice) and shares the result once the
 * roller's animation has revealed it, keeping it in the recent history sent to every socket that connects
 * (in memory; persisted history comes with the chat).
 */
export function broadcastRollResult(roll: IRollResult): void {
  io?.to(TABLE_ROOM).emit("roll:pending", pendingOf(roll, ROLL_REVEAL_DELAY_MS));
  setTimeout(() => publishToTable(roll), ROLL_REVEAL_DELAY_MS);
}

/**
 * Adds an entry to the recent history and shows it to the whole table right away (pings have no animation).
 */
export function publishToTable(entry: IRollResult): void {
  recentRolls = [entry, ...recentRolls].slice(0, ROLL_HISTORY_LIMIT);
  io?.to(TABLE_ROOM).emit("roll:result", entry);
}

/**
 * Pushes new feature tags of a character to the GM and to every account with access to it.
 */
export function broadcastCharacterFeatures(event: ICharacterFeaturesEvent): void {
  io?.to([characterRoom(event.id), GM_ROOM]).emit("character:features", event);
}

/**
 * Sends each account the Marca share it may see now (after its access to characters changed).
 */
export async function refreshMarkedShare(accountIds: string[]): Promise<void> {
  for (const accountId of accountIds) {
    const result = await markedController.current({ accountId, role: "PLAYER" });
    if (!isErrorResult(result)) io?.to(accountRoom(accountId)).emit("marked:share", result.payload);
  }
}

/**
 * Follows a character that lost the Marca or was deleted: its pending proposal is cancelled, the share it
 * started ends, and every Marcado gets the share that is still active. A character that gained the Marca
 * just receives the active share.
 */
export async function syncMarkedCharacter(characterId: string): Promise<void> {
  try {
    const released = await markedController.release(characterId);
    if (released.resolution) {
      broadcastMarkedResolved({
        resolution: released.resolution,
        characterIds: released.involvedIds,
      });
    }
    broadcastMarkedShare(released.share, released);
    if (!released.stillMarked) io?.to(characterRoom(characterId)).emit("marked:share", null);
  } catch (error) {
    console.error("syncMarkedCharacter failed:", error);
  }
}

const arenaRoom = (audience: ArenaAudience) => (audience === "table" ? TABLE_ROOM : GM_ROOM);

/**
 * Pushes a created or changed token to who may see it. A token that left the players' view (hidden) is removed
 * from their tabs; GM sockets are also in the table room, so they are excluded from that removal.
 */
export function broadcastArenaToken({
  token,
  audience,
  previousAudience,
  status,
}: IArenaTokenChange): void {
  io?.to(arenaRoom(audience)).emit("arena:token", token);
  if (audience === "gm" && previousAudience === "table") {
    io?.to(TABLE_ROOM)
      .except(GM_ROOM)
      .emit("arena:token-removed", { id: token.id, sceneId: token.sceneId });
  }
  if (status) broadcastArenaStatuses([status]);
}

/**
 * Delivers token statuses: the GM gets everything with the permissions, each visible token reaches only the
 * allowed rooms, and who lost the permission is told to drop it. Never sent to the whole table unless public.
 */
export function broadcastArenaStatuses(deliveries: IArenaStatusDelivery[]): void {
  if (!io || deliveries.length === 0) return;
  for (const { to, except, event } of statusEmits(deliveries)) {
    io.to(to).except(except).emit("arena:status", event);
  }
}

/**
 * Plays damage and healing animations for who sees each token (the amount applied, never the status).
 */
export function broadcastArenaEffects(effects: IArenaEffectDelivery[]): void {
  for (const { audience, event } of effectEmits(effects)) {
    io?.to(arenaRoom(audience)).emit("arena:effect", event);
  }
}

/**
 * Sends several token changes at once: one `arena:tokens` to the players (what they may see) and one to the GM
 * (everything), plus one `arena:tokens-removed` to the players for tokens that were hidden, instead of one event
 * per token. A single change keeps the single event.
 */
export function broadcastArenaTokens(changes: IArenaTokenChange[]): void {
  if (changes.length === 0) return;
  if (changes.length === 1 && changes[0]) {
    broadcastArenaToken(changes[0]);
    return;
  }
  const { players, gm, hiddenFromTable } = groupTokenChanges(changes);
  if (players.length > 0) io?.to(TABLE_ROOM).except(GM_ROOM).emit("arena:tokens", players);
  if (gm.length > 0) io?.to(GM_ROOM).emit("arena:tokens", gm);
  if (hiddenFromTable.length > 0)
    io?.to(TABLE_ROOM).except(GM_ROOM).emit("arena:tokens-removed", hiddenFromTable);
  broadcastArenaStatuses(changes.flatMap((change) => change.status ?? []));
}

/**
 * Tells who could see several tokens that they were removed, in one event per room.
 */
export function broadcastArenaTokensRemoved(removals: IArenaTokenRemoval[]): void {
  if (removals.length === 0) return;
  if (removals.length === 1 && removals[0]) {
    broadcastArenaTokenRemoved(removals[0]);
    return;
  }
  const groups = groupTokenRemovals(removals);
  if (groups.table.length > 0) io?.to(TABLE_ROOM).emit("arena:tokens-removed", groups.table);
  if (groups.gm.length > 0) io?.to(GM_ROOM).emit("arena:tokens-removed", groups.gm);
}

/**
 * Tells who could see a token that it was removed.
 */
export function broadcastArenaTokenRemoved({ event, audience }: IArenaTokenRemoval): void {
  io?.to(arenaRoom(audience)).emit("arena:token-removed", event);
}

/**
 * Asks who may see a scene to refetch it (the live scene reaches the table; others only the GM).
 */
export function broadcastArenaScene(
  sceneId: string | null,
  audience: ArenaAudience,
  libraryOnly = false,
): void {
  io?.to(arenaRoom(audience)).emit("arena:scene", { sceneId, libraryOnly });
}

/**
 * Asks tabs to refetch the Arena after a change outside it (character renamed, new images, access or deletion):
 * the given accounts and the GM, or the whole table when no account is given.
 */
export function broadcastArenaRefresh(accountIds?: string[]): void {
  const rooms = accountIds ? [GM_ROOM, ...accountIds.map(accountRoom)] : [TABLE_ROOM];
  io?.to(rooms).emit("arena:scene", { sceneId: null });
}
