import { afterEach, describe, expect, it, vi } from "vitest";

import type { RealtimeServer, RealtimeSocket } from "../../realtime.types";
import { registerPresenceHandlers } from "./presence";

function fakes() {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    join: vi.fn(),
    on: (event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener),
  } as unknown as RealtimeSocket;
  const io = {
    in: () => ({ fetchSockets: async () => [] }),
    to: () => ({ emit: vi.fn() }),
  } as unknown as RealtimeServer;
  registerPresenceHandlers(io, socket);
  return (...args: unknown[]) => listeners.get("presence:ping")?.(...args);
}

describe("presence:ping", () => {
  afterEach(() => vi.useRealTimers());

  it("answers at most one ping per gap and ignores a missing ack", () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const ping = fakes();
    const ack = vi.fn();
    expect(() => ping("x")).not.toThrow();
    ping(ack);
    ping(ack);
    expect(ack).toHaveBeenCalledTimes(1);
    vi.setSystemTime(11_000);
    ping(ack);
    expect(ack).toHaveBeenCalledTimes(2);
  });
});
