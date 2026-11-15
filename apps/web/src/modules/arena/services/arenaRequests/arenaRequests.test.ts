import { describe, expect, it, vi } from "vitest";

import type { TableSocket } from "@/core/services/socket";
import { TABLE_OFFLINE_ERROR } from "@/modules/table/table.constants";

import { moveArenaTokens } from "./arenaRequests";

const MOVE = { moves: [{ tokenId: "t", x: 1, y: 2 }] };

function socketWith(ack: unknown, connected = true) {
  const emitWithAck = vi.fn(async () => ack);
  return {
    socket: {
      connected,
      timeout: () => ({ emitWithAck }),
    } as unknown as TableSocket,
    emitWithAck,
  };
}

describe("arena requests", () => {
  it("refuses to move while offline", async () => {
    expect(await moveArenaTokens(null, MOVE)).toEqual({ ok: false, error: TABLE_OFFLINE_ERROR });
    const { socket, emitWithAck } = socketWith({}, false);
    expect(await moveArenaTokens(socket, MOVE)).toEqual({ ok: false, error: TABLE_OFFLINE_ERROR });
    expect(emitWithAck).not.toHaveBeenCalled();
  });

  it("returns the stored tokens, the refused ones or the server error", async () => {
    const token = { id: "t", name: "Ana" };
    const payload = { tokens: [token], refused: ["x"] };
    expect(await moveArenaTokens(socketWith({ message: "ok", payload }).socket, MOVE)).toEqual({
      ok: true,
      tokens: [token],
      refused: ["x"],
    });
    expect(
      await moveArenaTokens(socketWith({ error: "Você não controla este token." }).socket, MOVE),
    ).toEqual({
      ok: false,
      error: "Você não controla este token.",
    });
  });
});
