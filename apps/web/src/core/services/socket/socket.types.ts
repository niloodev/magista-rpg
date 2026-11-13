import type { ClientToServerEvents, ServerToClientEvents } from "@magista/shared";
import type { Socket } from "socket.io-client";

export type TableSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
