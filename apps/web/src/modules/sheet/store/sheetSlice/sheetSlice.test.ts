import { createEmptySheet, type ICharacter } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

const character: ICharacter = {
  id: "c1",
  name: "Zarkov",
  avatarUrl: null,
  tokenUrl: null,
  sheet: createEmptySheet(),
  sheetVersion: 1,
  updatedAt: "v1",
};

function loaded() {
  const store = createAppStore();
  store.getState().finishSheetLoad(character);
  return store;
}

describe("sheet slice", () => {
  it("tracks local edits as pending revisions until saved, keeping the new server version", () => {
    const store = loaded();
    store.getState().editSheet((sheet) => void (sheet.identity.alignmentNote = "x"));
    expect(store.getState().sheet).toMatchObject({
      revision: 1,
      savedRevision: 0,
      saveStatus: "pending",
    });
    expect(character.sheet.identity.alignmentNote).toBe("");
    store.getState().markSheetSaved("c1", 1, "v2");
    expect(store.getState().sheet).toMatchObject({
      saveStatus: "saved",
      character: { updatedAt: "v2" },
    });
  });

  it("keeps pending when a newer edit happened during the save", () => {
    const store = loaded();
    store.getState().editSheet((sheet) => void (sheet.identity.alignmentNote = "a"));
    store.getState().editSheet((sheet) => void (sheet.identity.alignmentNote = "b"));
    store.getState().markSheetSaved("c1", 1, "v2");
    expect(store.getState().sheet.saveStatus).toBe("pending");
  });

  it("ignores save results that belong to another character", () => {
    const store = loaded();
    store.getState().editSheet((sheet) => void (sheet.identity.alignmentNote = "a"));
    store.getState().markSheetSaved("outro", 1, "v9");
    store.getState().markSheetSaveFailed("outro", "erro");
    expect(store.getState().sheet).toMatchObject({
      saveStatus: "pending",
      character: { updatedAt: "v1" },
    });
  });

  it("replaces the sheet with remote updates when nothing is pending", () => {
    const store = loaded();
    store.getState().applyRemoteCharacter({ ...character, name: "Remoto", updatedAt: "v2" });
    expect(store.getState().sheet.character).toMatchObject({ name: "Remoto", updatedAt: "v2" });
    store.getState().applyRemoteCharacter({ ...character, id: "outro" });
    expect(store.getState().sheet.character?.id).toBe("c1");
  });

  it("merges GM-only fields into pending local edits instead of dropping the remote update", () => {
    const store = loaded();
    store.getState().editSheet((sheet) => {
      sheet.identity.alignmentNote = "local";
      sheet.resources.health = { current: 30, max: 30 };
    });
    const remoteSheet = createEmptySheet();
    remoteSheet.identity.level = 4;
    remoteSheet.identity.class = "executor";
    remoteSheet.resources.health = { current: 12, max: 24 };
    store.getState().applyRemoteCharacter({ ...character, sheet: remoteSheet, updatedAt: "v2" });
    const { sheet: state } = store.getState();
    expect(state.character?.updatedAt).toBe("v2");
    expect(state.character?.sheet.identity).toMatchObject({
      class: "executor",
      level: 4,
      alignmentNote: "local",
    });
    expect(state.character?.sheet.resources.health).toEqual({ current: 24, max: 24 });
    expect(state.saveStatus).toBe("pending");
  });

  it("keeps the whole pending draft when the GM is the one viewing", () => {
    const store = loaded();
    store.getState().setSession({
      account: { id: "gm", login: "mestre", role: "GM" },
    });
    store.getState().editSheet((sheet) => {
      sheet.identity.level = 7;
      sheet.resources.health = { current: 40, max: 40 };
    });
    const remoteSheet = createEmptySheet();
    remoteSheet.identity.level = 3;
    store.getState().applyRemoteCharacter({ ...character, sheet: remoteSheet, updatedAt: "v2" });
    const { sheet: state } = store.getState();
    expect(state.character?.updatedAt).toBe("v2");
    expect(state.character?.sheet.identity.level).toBe(7);
    expect(state.character?.sheet.resources.health).toEqual({ current: 40, max: 40 });
    expect(state.saveStatus).toBe("pending");
  });

  it("replaces the character after a level up and marks it saved", () => {
    const store = loaded();
    store.getState().editSheet((sheet) => void (sheet.identity.alignmentNote = "x"));
    store.getState().replaceCharacter({ ...character, name: "Novo" });
    expect(store.getState().sheet).toMatchObject({ savedRevision: 1, saveStatus: "saved" });
  });

  it("ignora a resposta de uma ficha que não é mais a pedida (navegação rápida)", () => {
    const store = createAppStore();
    store.getState().startSheetLoad("outra");
    store.getState().finishSheetLoad(character);
    expect(store.getState().sheet).toMatchObject({ status: "loading", character: null });
    store.getState().failSheetLoad(character.id, "erro velho");
    expect(store.getState().sheet.error).toBeNull();
    store.getState().failSheetLoad("outra", "Ficha não encontrada.");
    expect(store.getState().sheet).toMatchObject({ status: "error", requestedId: "outra" });
  });
});
