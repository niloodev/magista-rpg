import { isErrorResult } from "@magista/shared";
import { parse } from "cookie";

import { authenticate } from "@/core/controllers/auth";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/core/services/auth";

import type { RealtimeSocket } from "./realtime.types";

/**
 * Socket.IO middleware that authenticates the handshake through the session cookie.
 */
export async function authenticateSocket(
  socket: RealtimeSocket,
  next: (error?: Error) => void,
): Promise<void> {
  const cookies = parse(socket.handshake.headers.cookie ?? "");
  const token = cookies[SESSION_COOKIE_NAME];
  const payload = token ? verifySessionToken(token) : null;
  if (!payload) {
    next(new Error("unauthorized"));
    return;
  }
  const result = await authenticate(payload);
  if (isErrorResult(result)) {
    next(new Error("unauthorized"));
    return;
  }
  const { account } = result.payload.session;
  socket.data.member = { accountId: account.id, login: account.login, role: account.role };
  next();
}
