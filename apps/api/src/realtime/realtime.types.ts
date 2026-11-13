import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@magista/shared";
import type { Server, Socket } from "socket.io";

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

export type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;
