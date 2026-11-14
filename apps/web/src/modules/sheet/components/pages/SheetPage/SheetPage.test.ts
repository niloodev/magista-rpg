import { createEmptySheet, type ICharacter } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import { SAVE_CONFLICT_ERROR } from "./SheetPage.constants";
import type { SheetSaveDeps, SheetSaveSnapshot } from "./SheetPage.types";
import { saveWithReconcile } from "./SheetPage.utils";

const base: ICharacter = {
  id: "c1",
  name: "Zarkov",
  avatarUrl: null,
  tokenUrl: null,
  sheet: createEmptySheet(),
  sheetVersion: 1,
  updatedAt: "v1",
};

function buildDeps(overrides: Partial<SheetSaveDeps> = {}) {
  const snapshot: SheetSaveSnapshot = { character: base, revision: 1, savedRevision: 0 };
  const deps: SheetSaveDeps = {
    read: () => snapshot,
    save: vi.fn().mockResolvedValue({ message: "ok", payload: { ...base, updatedAt: "v2" } }),
    fetchLatest: vi.fn().mockResolvedValue({ message: "ok", payload: base }),
    markSaving: vi.fn(),
    markSaved: vi.fn(),
    markFailed: vi.fn(),
    applyRemote: vi.fn((latest: ICharacter) => {
      snapshot.character = { ...snapshot.character!, updatedAt: latest.updatedAt };
    }),
    ...overrides,
  };
  return { deps, snapshot };
}

describe("saveWithReconcile", () => {
  it("does nothing when there is no pending revision", async () => {
    const { deps, snapshot } = buildDeps();
    snapshot.savedRevision = 1;
    await saveWithReconcile(deps);
    expect(deps.save).not.toHaveBeenCalled();
  });

  it("saves against the base version and records the new one", async () => {
    const { deps } = buildDeps();
    await saveWithReconcile(deps);
    expect(deps.save).toHaveBeenCalledWith("c1", base.sheet, "v1");
    expect(deps.markSaved).toHaveBeenCalledWith("c1", 1, "v2");
  });

  it("reconciles a newer server version and retries once against it", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ error: "conflito" })
      .mockResolvedValueOnce({ message: "ok", payload: { ...base, updatedAt: "v3" } });
    const fetchLatest = vi
      .fn()
      .mockResolvedValue({ message: "ok", payload: { ...base, updatedAt: "v2" } });
    const { deps } = buildDeps({ save, fetchLatest });
    await saveWithReconcile(deps);
    expect(deps.applyRemote).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenLastCalledWith("c1", base.sheet, "v2");
    expect(deps.markSaved).toHaveBeenCalledWith("c1", 1, "v3");
    expect(deps.markFailed).not.toHaveBeenCalled();
  });

  it("gives up with a conflict error when the version keeps changing", async () => {
    let version = 1;
    const save = vi.fn().mockResolvedValue({ error: "conflito" });
    const fetchLatest = vi.fn(async () => {
      version += 1;
      return { message: "ok", payload: { ...base, updatedAt: `v${version}` } };
    });
    const { deps } = buildDeps({ save, fetchLatest });
    await saveWithReconcile(deps);
    expect(save).toHaveBeenCalledTimes(2);
    expect(deps.markFailed).toHaveBeenCalledWith("c1", SAVE_CONFLICT_ERROR);
  });

  it("shows the server error when the failure is not a version conflict", async () => {
    const save = vi.fn().mockResolvedValue({ error: "Somente o Mestre altera classe." });
    const { deps } = buildDeps({ save });
    await saveWithReconcile(deps);
    expect(deps.applyRemote).not.toHaveBeenCalled();
    expect(deps.markFailed).toHaveBeenCalledWith("c1", "Somente o Mestre altera classe.");
  });
});
