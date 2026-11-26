import type { ClientToServerEvents, ServerToClientEvents } from "@magista/shared";
import type { Socket } from "socket.io-client";

export type TableSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Where the socket connects: the server URL (undefined is the page origin) and the socket.io path. */
export interface ISocketTarget {
  url: string | undefined;
  path: string;
}
