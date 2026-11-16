import { createEmptySheet, type ICharacter, type ICharacterSummary } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import type { ICharacterModels } from "@/core/models/character";

import { createCharacterController } from "./character";
import { characterErrors } from "./character.errors";

const CHARACTER_ID = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";
const FOLDER_ID = "0b6d3f6e-2b1a-4c1e-9f0a-7d1e2c3b4a50";
const PLAYER_ID = "3c2b1a00-1111-4c4e-9b8d-2f3a1c5d7e90";

const character: ICharacter = {
  id: CHARACTER_ID,
  name: "Kael",
  avatarUrl: null,
  artUrl: null,
  avatarThumbUrl: null,
  artThumbUrl: null,
  figureUrl: null,
  figureThumbUrl: null,
  tokenStyle: "portrait" as const,
  showTokenName: true,
  sheet: createEmptySheet(),
  sheetVersion: 1,
  features: [],
  updatedAt: new Date(0).toISOString(),
};

const summary: ICharacterSummary = {
  id: CHARACTER_ID,
  name: "Kael",
  avatarUrl: null,
  artUrl: null,
  avatarThumbUrl: null,
  artThumbUrl: null,
  figureUrl: null,
  figureThumbUrl: null,
  tokenStyle: "portrait" as const,
  showTokenName: true,
  classKey: "sem-classe",
  level: 1,
  folderId: null,
  position: 0,
  accountIds: ["owner"],
  features: [],
};

function buildController(
  overrides: Partial<ICharacterModels> = {},
  extra: { folderExists?: boolean; players?: number } = {},
) {
  const characters: ICharacterModels = {
    findById: vi.fn().mockResolvedValue(character),
    exists: vi.fn().mockResolvedValue(true),
    hasAccess: vi.fn().mockImplementation(async (_id, accountId) => accountId === "owner"),
    listAccessibleIds: vi.fn().mockResolvedValue([CHARACTER_ID]),
    listAccountIds: vi.fn().mockResolvedValue(["owner"]),
    findByAccountAndName: vi.fn().mockResolvedValue(null),
    listSummaries: vi.fn().mockResolvedValue([summary]),
    listSummariesForAccount: vi.fn().mockResolvedValue([summary]),
    findSummary: vi.fn().mockResolvedValue(summary),
    create: vi
      .fn()
      .mockImplementation(async ({ name, folderId }) => ({ ...summary, name, folderId })),
    rename: vi.fn().mockImplementation(async (_id, name) => ({ ...summary, name })),
    remove: vi.fn().mockResolvedValue(undefined),
    changeResource: vi.fn().mockResolvedValue([]),
    setAccess: vi.fn().mockImplementation(async (_id, accountIds) => ({
      character: { ...summary, accountIds },
      previousAccountIds: ["owner"],
    })),
    updateSheet: vi.fn().mockImplementation(async (_id, sheet) => ({ ...character, sheet })),
    findImageKeys: vi
      .fn()
      .mockResolvedValue({ avatarKey: "old-avatar", artKey: null, figureKey: null }),
    setTokenSettings: vi.fn().mockImplementation(async (id, { style, showName }) => ({
      id,
      avatarUrl: null,
      artUrl: null,
      avatarThumbUrl: null,
      artThumbUrl: null,
      figureUrl: null,
      figureThumbUrl: null,
      tokenStyle: style ?? "portrait",
      showTokenName: showName ?? true,
    })),
    setImageKey: vi.fn().mockImplementation(async (id, kind, key) => ({
      images: {
        id,
        avatarUrl: kind === "avatar" && key ? `/media/${key}` : null,
        artUrl: kind === "art" && key ? `/media/${key}` : null,
      },
      previousKey: kind === "avatar" ? "old-avatar" : null,
    })),
    upsertCharacter: vi.fn(),
    setFeatures: vi.fn().mockImplementation(async (_id, features) => ({
      features,
      previous: ["marked"],
      accountIds: ["owner"],
    })),
    listByFeature: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  const folders = {
    findById: vi
      .fn()
      .mockResolvedValue(
        extra.folderExists === false
          ? null
          : { id: FOLDER_ID, name: "NPCs", parentId: null, position: 0 },
      ),
  };
  const accounts = { countPlayersByIds: vi.fn().mockResolvedValue(extra.players ?? 1) };
  const images = {
    sizeOf: vi.fn((body: Buffer) =>
      body.toString() === "huge" ? { width: 9000, height: 10 } : { width: 100, height: 100 },
    ),
    remove: vi.fn().mockResolvedValue(undefined),
    removeAll: vi.fn().mockResolvedValue(undefined),
  };
  const assets = {
    ingest: vi
      .fn()
      .mockImplementation(async (body: Buffer) =>
        body.toString() === "not-an-image"
          ? null
          : { key: "media/new/full.webp", width: 10, height: 10 },
      ),
    release: vi.fn().mockResolvedValue(undefined),
  };
  return {
    images,
    assets,
    controller: createCharacterController({ characters, folders, accounts, images, assets }),
    characters,
    folders,
    accounts,
  };
}

const owner = { accountId: "owner", role: "PLAYER" as const };
const stranger = { accountId: "other", role: "PLAYER" as const };
const gm = { accountId: "gm", role: "GM" as const };

describe("character controller", () => {
  it("lets the owner and the GM read a sheet", async () => {
    const { controller } = buildController();
    expect(await controller.getCharacter(owner, CHARACTER_ID)).toMatchObject({
      payload: character,
    });
    expect(await controller.getCharacter(gm, CHARACTER_ID)).toMatchObject({ payload: character });
  });

  it("forbids other players", async () => {
    const { controller } = buildController();
    expect(await controller.getCharacter(stranger, CHARACTER_ID)).toEqual({
      error: characterErrors.forbidden,
    });
  });

  it("returns notFound for unknown ids", async () => {
    const { controller } = buildController({ findById: vi.fn().mockResolvedValue(null) });
    expect(await controller.getCharacter(gm, "x")).toEqual({ error: characterErrors.notFound });
  });

  it("validates sheets before saving", async () => {
    const { controller, characters } = buildController();
    expect(
      await controller.updateSheet(owner, CHARACTER_ID, {
        sheet: { identity: {} },
        baseUpdatedAt: character.updatedAt,
      }),
    ).toEqual({
      error: characterErrors.invalidSheet,
    });
    expect(characters.updateSheet).not.toHaveBeenCalled();
  });

  it("saves a valid sheet for the owner", async () => {
    const { controller, characters } = buildController();
    const sheet = createEmptySheet();
    sheet.identity.alignmentNote = "Arcana do Aço";
    const result = await controller.updateSheet(owner, CHARACTER_ID, {
      sheet,
      baseUpdatedAt: character.updatedAt,
    });
    expect(result).toMatchObject({
      payload: { sheet: { identity: { alignmentNote: "Arcana do Aço" } } },
    });
    expect(characters.updateSheet).toHaveBeenCalledWith(CHARACTER_ID, sheet, character.updatedAt);
  });

  it("blocks players from changing level and maximums, but not the GM", async () => {
    const { controller } = buildController();
    const sheet = createEmptySheet();
    sheet.resources.health.max = 999;
    expect(
      await controller.updateSheet(owner, CHARACTER_ID, {
        sheet,
        baseUpdatedAt: character.updatedAt,
      }),
    ).toEqual({
      error: characterErrors.gmOnlyFields,
    });
    expect(
      await controller.updateSheet(gm, CHARACTER_ID, {
        sheet,
        baseUpdatedAt: character.updatedAt,
      }),
    ).toMatchObject({
      payload: { sheet },
    });
  });

  it("rejects non-UUID ids before touching the database", async () => {
    const { controller, characters } = buildController();
    expect(await controller.getCharacter(gm, "abc")).toEqual({ error: characterErrors.notFound });
    expect(characters.findById).not.toHaveBeenCalled();
  });

  it("blocks players from changing the class", async () => {
    const { controller } = buildController();
    const sheet = createEmptySheet();
    sheet.identity.class = "executor";
    const input = { sheet, baseUpdatedAt: character.updatedAt };
    expect(await controller.updateSheet(owner, CHARACTER_ID, input)).toEqual({
      error: characterErrors.gmOnlyFields,
    });
    expect(await controller.updateSheet(gm, CHARACTER_ID, input)).toMatchObject({
      payload: { sheet: { identity: { class: "executor" } } },
    });
  });

  it("stops players from raising current Vida above the maximum, but not the GM", async () => {
    const stored = createEmptySheet();
    stored.resources.health = { current: 10, max: 20 };
    const { controller } = buildController({
      findById: vi.fn().mockResolvedValue({ ...character, sheet: stored }),
    });
    const raised = structuredClone(stored);
    raised.resources.health.current = 21;
    const input = { sheet: raised, baseUpdatedAt: character.updatedAt };
    expect(await controller.updateSheet(owner, CHARACTER_ID, input)).toEqual({
      error: characterErrors.aboveMaximum,
    });
    expect(await controller.updateSheet(gm, CHARACTER_ID, input)).toMatchObject({
      payload: { sheet: raised },
    });
  });

  it("answers conflict (not forbidden) when the player's base is stale, before checking GM fields", async () => {
    const { controller, characters } = buildController();
    const sheet = createEmptySheet();
    sheet.identity.level = 9;
    const result = await controller.updateSheet(owner, CHARACTER_ID, {
      sheet,
      baseUpdatedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(result).toEqual({ error: characterErrors.conflict });
    expect(characters.updateSheet).not.toHaveBeenCalled();
  });

  it("writes against the version read from the database", async () => {
    const { controller, characters } = buildController();
    const sheet = createEmptySheet();
    await controller.updateSheet(owner, CHARACTER_ID, {
      sheet,
      baseUpdatedAt: character.updatedAt,
    });
    expect(characters.updateSheet).toHaveBeenCalledWith(CHARACTER_ID, sheet, character.updatedAt);
  });

  it("reports a conflict when someone saved in between", async () => {
    const { controller } = buildController({ updateSheet: vi.fn().mockResolvedValue(null) });
    const result = await controller.updateSheet(owner, CHARACTER_ID, {
      sheet: createEmptySheet(),
      baseUpdatedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(result).toEqual({ error: characterErrors.conflict });
  });

  it("lists every character for the GM and only the granted ones for players", async () => {
    const { controller, characters } = buildController({
      listSummariesForAccount: vi
        .fn()
        .mockResolvedValue([summary, { ...summary, id: "second", name: "Lyra" }]),
    });
    await controller.listCharacters(gm);
    expect(characters.listSummaries).toHaveBeenCalled();
    const result = await controller.listCharacters(owner);
    expect(characters.listSummariesForAccount).toHaveBeenCalledWith("owner");
    expect(result).toMatchObject({ payload: [{ id: CHARACTER_ID }, { id: "second" }] });
  });

  it("lets only the GM create characters, inside an existing folder", async () => {
    const { controller, characters } = buildController();
    expect(await controller.createCharacter(owner, { name: "Novo" })).toEqual({
      error: characterErrors.gmOnly,
    });
    expect(await controller.createCharacter(gm, { name: "  " })).toEqual({
      error: characterErrors.invalidName,
    });
    expect(
      await controller.createCharacter(gm, { name: "Novo", folderId: FOLDER_ID }),
    ).toMatchObject({ payload: { name: "Novo", folderId: FOLDER_ID } });
    expect(characters.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Novo", folderId: FOLDER_ID }),
    );
    const missing = buildController({}, { folderExists: false });
    expect(
      await missing.controller.createCharacter(gm, { name: "Novo", folderId: FOLDER_ID }),
    ).toEqual({ error: characterErrors.folderNotFound });
  });

  it("renames and deletes only for the GM", async () => {
    const { controller, characters } = buildController();
    expect(await controller.renameCharacter(owner, CHARACTER_ID, { name: "X" })).toEqual({
      error: characterErrors.gmOnly,
    });
    expect(await controller.renameCharacter(gm, CHARACTER_ID, { name: "Kael II" })).toMatchObject({
      payload: { name: "Kael II" },
    });
    expect(await controller.deleteCharacter(owner, CHARACTER_ID)).toEqual({
      error: characterErrors.gmOnly,
    });
    expect(await controller.deleteCharacter(gm, CHARACTER_ID)).toMatchObject({
      payload: { id: CHARACTER_ID, previousAccountIds: ["owner"] },
    });
    expect(characters.remove).toHaveBeenCalledWith(CHARACTER_ID);
  });

  it("removes the stored images (including legacy keys) together with the character", async () => {
    const { controller, images, assets } = buildController();
    await controller.deleteCharacter(gm, CHARACTER_ID);
    expect(images.removeAll).toHaveBeenCalledWith(CHARACTER_ID);
    expect(assets.release).toHaveBeenCalledWith("old-avatar");
  });

  it("lets only the GM upload images and replaces the previous object", async () => {
    const { controller, characters, assets } = buildController();
    const file = Buffer.from("png-bytes");
    expect(await controller.setImage(owner, CHARACTER_ID, { kind: "avatar", file })).toEqual({
      error: characterErrors.gmOnly,
    });
    const result = await controller.setImage(gm, CHARACTER_ID, { kind: "avatar", file });
    expect(result).toMatchObject({
      payload: {
        images: { avatarUrl: "/media/media/new/full.webp", artUrl: null },
      },
    });
    expect(characters.setImageKey).toHaveBeenCalledWith(
      CHARACTER_ID,
      "avatar",
      "media/new/full.webp",
    );
    expect(assets.release).toHaveBeenCalledWith("old-avatar");
  });

  it("validates kind, presence, size and real image type before storing", async () => {
    const { controller, assets } = buildController();
    expect(
      await controller.setImage(gm, CHARACTER_ID, { kind: "token", file: Buffer.from("x") }),
    ).toEqual({ error: characterErrors.invalidImageKind });
    expect(await controller.setImage(gm, CHARACTER_ID, { kind: "art", file: undefined })).toEqual({
      error: characterErrors.imageMissing,
    });
    expect(
      await controller.setImage(gm, CHARACTER_ID, {
        kind: "art",
        file: Buffer.alloc(8 * 1024 * 1024 + 1),
      }),
    ).toEqual({ error: characterErrors.imageTooLarge });
    expect(
      await controller.setImage(gm, CHARACTER_ID, {
        kind: "art",
        file: Buffer.from("not-an-image"),
      }),
    ).toEqual({ error: characterErrors.imageInvalid });
    expect(
      await controller.setImage(gm, CHARACTER_ID, { kind: "art", file: Buffer.from("huge") }),
    ).toEqual({ error: characterErrors.imageTooBig });
    expect(assets.ingest).toHaveBeenCalledTimes(1);
  });

  it("drops the new object when saving its key fails", async () => {
    const { controller, assets } = buildController({
      setImageKey: vi.fn().mockRejectedValue(new Error("db down")),
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      await controller.setImage(gm, CHARACTER_ID, { kind: "art", file: Buffer.from("png") }),
    ).toEqual({ error: characterErrors.unexpected });
    expect(assets.release).toHaveBeenCalledWith("media/new/full.webp");
  });

  it("removes an image only for the GM", async () => {
    const { controller, characters, assets } = buildController();
    expect(await controller.removeImage(owner, CHARACTER_ID, "avatar")).toEqual({
      error: characterErrors.gmOnly,
    });
    expect(await controller.removeImage(gm, CHARACTER_ID, "avatar")).toMatchObject({
      payload: { images: { avatarUrl: null } },
    });
    expect(characters.setImageKey).toHaveBeenCalledWith(CHARACTER_ID, "avatar", null);
    expect(assets.release).toHaveBeenCalledWith("old-avatar");
  });

  it("grants access to existing player accounts only", async () => {
    const { controller, characters } = buildController();
    expect(await controller.setAccess(owner, CHARACTER_ID, { accountIds: [PLAYER_ID] })).toEqual({
      error: characterErrors.gmOnly,
    });
    expect(await controller.setAccess(gm, CHARACTER_ID, { accountIds: ["nope"] })).toEqual({
      error: characterErrors.invalidAccess,
    });
    expect(
      await controller.setAccess(gm, CHARACTER_ID, { accountIds: [PLAYER_ID, PLAYER_ID] }),
    ).toMatchObject({
      payload: { character: { accountIds: [PLAYER_ID] }, previousAccountIds: ["owner"] },
    });
    expect(characters.setAccess).toHaveBeenCalledWith(CHARACTER_ID, [PLAYER_ID]);
    const unknown = buildController({}, { players: 0 });
    expect(
      await unknown.controller.setAccess(gm, CHARACTER_ID, { accountIds: [PLAYER_ID] }),
    ).toEqual({ error: characterErrors.accountNotFound });
  });

  describe("setFeatures", () => {
    it("only lets the GM tag a character", async () => {
      const { controller } = buildController();
      const result = await controller.setFeatures(
        { accountId: "owner", role: "PLAYER" },
        CHARACTER_ID,
        { features: ["marked"] },
      );
      expect(result).toEqual({ error: characterErrors.gmOnly });
    });

    it("rejects unknown tags", async () => {
      const { controller } = buildController();
      const result = await controller.setFeatures({ accountId: "gm", role: "GM" }, CHARACTER_ID, {
        features: ["dragon"],
      });
      expect(result).toEqual({ error: characterErrors.invalidFeatures });
    });

    it("saves the tags and reports the removed ones", async () => {
      const { controller } = buildController();
      const result = await controller.setFeatures({ accountId: "gm", role: "GM" }, CHARACTER_ID, {
        features: [],
      });
      expect(result).toMatchObject({
        payload: {
          id: CHARACTER_ID,
          features: [],
          added: [],
          removed: ["marked"],
          accountIds: ["owner"],
        },
      });
    });
  });

  describe("setTokenSettings", () => {
    it("lets only the GM choose a valid style", async () => {
      const { controller, characters } = buildController();
      expect(
        await controller.setTokenSettings({ accountId: "owner", role: "PLAYER" }, CHARACTER_ID, {
          style: "figure",
        }),
      ).toEqual({ error: characterErrors.gmOnly });
      expect(
        await controller.setTokenSettings({ accountId: "gm", role: "GM" }, CHARACTER_ID, {
          style: "cube",
        }),
      ).toEqual({ error: characterErrors.invalidTokenSettings });
      expect(
        await controller.setTokenSettings({ accountId: "gm", role: "GM" }, CHARACTER_ID, {
          style: "figure",
        }),
      ).toMatchObject({ payload: { images: { id: CHARACTER_ID, tokenStyle: "figure" } } });
      expect(characters.setTokenSettings).toHaveBeenCalledWith(CHARACTER_ID, { style: "figure" });
      expect(
        await controller.setTokenSettings({ accountId: "gm", role: "GM" }, CHARACTER_ID, {}),
      ).toEqual({ error: characterErrors.invalidTokenSettings });
      expect(
        await controller.setTokenSettings({ accountId: "gm", role: "GM" }, CHARACTER_ID, {
          showName: false,
        }),
      ).toMatchObject({ payload: { images: { showTokenName: false } } });
    });
  });
});
