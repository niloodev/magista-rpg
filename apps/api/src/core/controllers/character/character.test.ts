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
  tokenUrl: null,
  sheet: createEmptySheet(),
  sheetVersion: 1,
  updatedAt: new Date(0).toISOString(),
};

const summary: ICharacterSummary = {
  id: CHARACTER_ID,
  name: "Kael",
  avatarUrl: null,
  tokenUrl: null,
  classKey: "sem-classe",
  level: 1,
  folderId: null,
  position: 0,
  accountIds: ["owner"],
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
    setAccess: vi.fn().mockImplementation(async (_id, accountIds) => ({
      character: { ...summary, accountIds },
      previousAccountIds: ["owner"],
    })),
    updateSheet: vi.fn().mockImplementation(async (_id, sheet) => ({ ...character, sheet })),
    updateMedia: vi.fn(),
    upsertCharacter: vi.fn(),
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
  return {
    controller: createCharacterController({ characters, folders, accounts }),
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
});
