import { createEmptySheet } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import { createImporterController } from "./importer";
import { importerErrors } from "./importer.errors";
import type { IImporterControllerDeps } from "./importer.types";

const raw = { name: "Talis", attributes: [{ name: "class", current: "Liturgista" }] };

const savedCharacter = {
  id: "char-1",
  name: "Talis",
  avatarUrl: null,
  artUrl: null,
  sheet: createEmptySheet(),
  sheetVersion: 1,
  updatedAt: "",
};

function buildDeps(existing: unknown = null, current: unknown = null): IImporterControllerDeps {
  return {
    accounts: {
      findCredentialsByLogin: vi.fn().mockResolvedValue(existing),
      upsertAccount: vi.fn().mockResolvedValue({ id: "acc-1", login: "Talis", role: "PLAYER" }),
    },
    characters: {
      upsertCharacter: vi.fn().mockResolvedValue(savedCharacter),
      setImageKey: vi.fn().mockResolvedValue({
        images: { id: "char-1", avatarUrl: null, artUrl: null },
        previousKey: "old-art",
      }),
      findByAccountAndName: vi.fn().mockResolvedValue(current),
    },
    hashPassword: vi.fn().mockResolvedValue("hash"),
    generatePassword: () => "senha-gerada",
    assets: {
      ingest: vi.fn().mockResolvedValue({ key: "media/new/full.webp", width: 10, height: 10 }),
      release: vi.fn().mockResolvedValue(undefined),
    },
  };
}

const input = { raw, avatar: null, art: Buffer.from("png"), force: false };

describe("importer controller", () => {
  it("creates account, character and avatar for a new player", async () => {
    const deps = buildDeps();
    const result = await createImporterController(deps).importCharacter(input);
    expect(result).toMatchObject({ payload: { status: "created", password: "senha-gerada" } });
    expect(deps.characters.upsertCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Talis",
        legacy: raw,
        sheet: expect.objectContaining({
          identity: expect.objectContaining({ class: "liturgista" }),
        }),
      }),
    );
    expect(deps.assets.ingest).toHaveBeenCalledWith(input.art);
    expect(deps.characters.setImageKey).toHaveBeenCalledWith(
      "char-1",
      "art",
      "media/new/full.webp",
    );
    expect(deps.assets.release).toHaveBeenCalledWith("old-art");
  });

  it("skips existing characters unless forced, never resetting passwords", async () => {
    const existing = {
      account: { id: "acc-1", login: "Talis", role: "PLAYER" },
      sessionVersion: 0,
      passwordHash: "old",
    };
    const deps = buildDeps(existing, savedCharacter);
    const skipped = await createImporterController(deps).importCharacter(input);
    expect(skipped).toMatchObject({ payload: { status: "skipped", password: null } });
    expect(deps.characters.upsertCharacter).not.toHaveBeenCalled();

    const forced = await createImporterController(deps).importCharacter({ ...input, force: true });
    expect(forced).toMatchObject({ payload: { status: "updated", password: null } });
    expect(deps.accounts.upsertAccount).not.toHaveBeenCalled();
    expect(deps.characters.upsertCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ id: "char-1", accountIds: ["acc-1"] }),
    );
  });

  it("refuses to attach a character to the GM account", async () => {
    const deps = buildDeps({
      account: { id: "gm", login: "Talis", role: "GM" },
      passwordHash: "x",
    });
    expect(await createImporterController(deps).importCharacter(input)).toEqual({
      error: importerErrors.loginTaken,
    });
  });

  it("warns when an exported image is not a supported format", async () => {
    const deps = buildDeps();
    deps.assets.ingest = vi.fn().mockResolvedValue(null);
    const result = await createImporterController(deps).importCharacter(input);
    expect(result).toMatchObject({ payload: { mediaWarning: importerErrors.mediaFailed } });
    expect(deps.characters.setImageKey).not.toHaveBeenCalled();
  });

  it("keeps the account and generated password when copying media fails", async () => {
    const deps = buildDeps();
    deps.assets.ingest = vi.fn().mockRejectedValue(new Error("disk full"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await createImporterController(deps).importCharacter(input);
    expect(result).toMatchObject({
      payload: {
        status: "created",
        password: "senha-gerada",
        mediaWarning: importerErrors.mediaFailed,
      },
    });
  });

  it("refuses names too long to be a login", async () => {
    const result = await createImporterController(buildDeps()).importCharacter({
      ...input,
      raw: { ...raw, name: "x".repeat(80) },
    });
    expect(result).toEqual({ error: importerErrors.nameTooLong });
  });

  it("rejects invalid exports", async () => {
    const result = await createImporterController(buildDeps()).importCharacter({
      ...input,
      raw: {},
    });
    expect(result).toEqual({ error: importerErrors.invalidExport });
  });
});
