import { io } from "socket.io-client";

import { API_URL } from "@/core/services/http";

import type { TableSocket } from "./socket.types";

/**
 * Creates a disconnected, cookie-authenticated socket to the Magista API.
 */
export function createTableSocket(): TableSocket {
  return io(API_URL, { withCredentials: true, autoConnect: false, transports: ["websocket"] });
}
