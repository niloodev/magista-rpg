import { io, type ManagerOptions, type SocketOptions } from "socket.io-client";

import { API_URL } from "@/core/services/http";

import type { TableSocket } from "./socket.types";
import { socketTarget } from "./socket.utils";

/**
 * Creates a disconnected, cookie-authenticated socket to the Magista API (directly in development, through the
 * `/api` prefix of the proxy in production).
 */
export function createTableSocket(): TableSocket {
  const { url, path } = socketTarget(API_URL);
  const options: Partial<ManagerOptions & SocketOptions> = {
    path,
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket"],
  };
  return url ? io(url, options) : io(options);
}
