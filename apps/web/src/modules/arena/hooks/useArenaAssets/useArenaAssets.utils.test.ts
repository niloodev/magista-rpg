import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IArenaStageControls } from "@/modules/arena/arena.types";

import { savesData, stageControls, withLimit } from "./useArenaAssets.utils";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("withLimit", () => {
  it("resolves with the task when it finishes in time", async () => {
    let done = false;
    void withLimit(Promise.resolve(), 1000).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
  });

  it("stops waiting at the limit when the task hangs", async () => {
    let done = false;
    void withLimit(new Promise(() => undefined), 1000).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it("resolves even when the task fails", async () => {
    await expect(withLimit(Promise.reject(new Error("x")), 1000)).resolves.toBeUndefined();
  });
});

describe("stageControls", () => {
  it("gives the controls once the board shows up", async () => {
    const ref: { current: IArenaStageControls | null } = { current: null };
    const found = stageControls(ref, 1000);
    const controls = {} as IArenaStageControls;
    await vi.advanceTimersByTimeAsync(200);
    ref.current = controls;
    await vi.advanceTimersByTimeAsync(200);
    await expect(found).resolves.toBe(controls);
  });

  it("gives null when the board never shows up", async () => {
    const found = stageControls({ current: null }, 500);
    await vi.advanceTimersByTimeAsync(600);
    await expect(found).resolves.toBeNull();
  });
});

describe("savesData", () => {
  it("follows the data saving flag of the connection", () => {
    vi.stubGlobal("navigator", { connection: { saveData: true } });
    expect(savesData()).toBe(true);
    vi.stubGlobal("navigator", { connection: { saveData: false } });
    expect(savesData()).toBe(false);
    vi.stubGlobal("navigator", {});
    expect(savesData()).toBe(false);
  });
});
