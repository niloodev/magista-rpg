import type {
  ClientToServerEvents,
  IArenaToken,
  IArenaTokenRemovedEvent,
  ServerToClientEvents,
  SocketData,
} from "@magista/shared";
import type { Server, Socket } from "socket.io";

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

export type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

/** Token changes split by who receives them: the players, the GM (everything), and what left the players' view. */
export interface IArenaTokenBatches {
  players: IArenaToken[];
  gm: IArenaToken[];
  hiddenFromTable: IArenaTokenRemovedEvent[];
}
