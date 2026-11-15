import { createEmptySheet, type ICharacter } from "@magista/shared";
import { describe, expect, it } from "vitest";

import { createAppStore } from "@/modules/shell/store/appSlice/appSlice";

const character: ICharacter = {
  id: "c1",
  name: "Zarkov",
  avatarUrl: null,
  artUrl: null,
  sheet: createEmptySheet(),
  sheetVersion: 1,
  features: [],
  updatedAt: "v1",
};

function loaded() {
  const store = createAppStore();
  store.getState().startSheetLoad(character.id);
  store.getState().finishSheetLoad(character);
  return store;
}

const entry = (store: ReturnType<typeof createAppStore>, id = "c1") => store.getState().sheets[id];

describe("sheet slice", () => {
  it("tracks local edits as pending revisions until saved, keeping the new server version", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "x"));
    expect(entry(store)).toMatchObject({
      revision: 1,
      savedRevision: 0,
      saveStatus: "pending",
    });
    expect(character.sheet.identity.alignmentNote).toBe("");
    store.getState().markSheetSaved("c1", 1, "v2");
    expect(entry(store)).toMatchObject({
      saveStatus: "saved",
      character: { updatedAt: "v2" },
    });
  });

  it("applies feature tags without touching the draft or the save state", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "x"));
    store.getState().applySheetFeatures({ id: "c1", features: ["marked"] });
    store.getState().applySheetFeatures({ id: "other", features: [] });
    expect(entry(store)).toMatchObject({
      revision: 1,
      saveStatus: "pending",
      character: { features: ["marked"] },
    });
  });

  it("applies image changes without touching the draft or the save state", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "x"));
    store.getState().applySheetImages({ id: "c1", avatarUrl: null, artUrl: "/media/art.png" });
    store.getState().applySheetImages({ id: "other", avatarUrl: "/media/no.png", artUrl: null });
    expect(entry(store)).toMatchObject({
      revision: 1,
      saveStatus: "pending",
      character: { artUrl: "/media/art.png", avatarUrl: null, updatedAt: "v1" },
    });
    expect(entry(store)?.character?.sheet.identity.alignmentNote).toBe("x");
  });

  it("keeps pending when a newer edit happened during the save", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "a"));
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "b"));
    store.getState().markSheetSaved("c1", 1, "v2");
    expect(entry(store)?.saveStatus).toBe("pending");
  });

  it("ignores save results that belong to another character", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "a"));
    store.getState().markSheetSaved("outro", 1, "v9");
    store.getState().markSheetSaveFailed("outro", "erro");
    expect(entry(store)).toMatchObject({
      saveStatus: "pending",
      character: { updatedAt: "v1" },
    });
  });

  it("replaces the sheet with remote updates when nothing is pending", () => {
    const store = loaded();
    store.getState().applyRemoteCharacter({ ...character, name: "Remoto", updatedAt: "v2" });
    expect(entry(store)?.character).toMatchObject({ name: "Remoto", updatedAt: "v2" });
    store.getState().applyRemoteCharacter({ ...character, id: "outro" });
    expect(entry(store)?.character?.id).toBe("c1");
  });

  it("merges GM-only fields into pending local edits instead of dropping the remote update", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => {
      sheet.identity.alignmentNote = "local";
      sheet.resources.health = { current: 30, max: 30 };
    });
    const remoteSheet = createEmptySheet();
    remoteSheet.identity.level = 4;
    remoteSheet.identity.class = "executor";
    remoteSheet.resources.health = { current: 12, max: 24 };
    store.getState().applyRemoteCharacter({ ...character, sheet: remoteSheet, updatedAt: "v2" });
    const state = entry(store)!;
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
    store.getState().editSheet("c1", (sheet) => {
      sheet.identity.level = 7;
      sheet.resources.health = { current: 40, max: 40 };
    });
    const remoteSheet = createEmptySheet();
    remoteSheet.identity.level = 3;
    store.getState().applyRemoteCharacter({ ...character, sheet: remoteSheet, updatedAt: "v2" });
    const state = entry(store)!;
    expect(state.character?.updatedAt).toBe("v2");
    expect(state.character?.sheet.identity.level).toBe(7);
    expect(state.character?.sheet.resources.health).toEqual({ current: 40, max: 40 });
    expect(state.saveStatus).toBe("pending");
  });

  it("replaces the character after a level up and marks it saved", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "x"));
    store.getState().replaceCharacter({ ...character, name: "Novo" });
    expect(entry(store)).toMatchObject({ savedRevision: 1, saveStatus: "saved" });
  });

  it("keeps each open sheet apart and ignores answers for sheets that were never opened", () => {
    const store = loaded();
    const other = { ...character, id: "c2", name: "Helena" };
    store.getState().finishSheetLoad(other);
    expect(entry(store, "c2")).toBeUndefined();
    store.getState().startSheetLoad("c2");
    store.getState().finishSheetLoad(other);
    store.getState().editSheet("c2", (sheet) => void (sheet.identity.alignmentNote = "b"));
    expect(entry(store, "c1")).toMatchObject({ revision: 0, saveStatus: "idle" });
    expect(entry(store, "c2")).toMatchObject({ revision: 1, saveStatus: "pending" });
    store.getState().failSheetLoad("c3", "Ficha não encontrada.");
    expect(entry(store, "c3")).toBeUndefined();
    store.getState().startSheetLoad("c3");
    store.getState().failSheetLoad("c3", "Ficha não encontrada.");
    expect(entry(store, "c3")).toMatchObject({ status: "error", error: "Ficha não encontrada." });
  });

  it("keeps the pending draft when the same sheet is opened again (docked, undocked)", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "rascunho"));
    store.getState().startSheetLoad("c1");
    expect(entry(store)).toMatchObject({ status: "ready", revision: 1, saveStatus: "pending" });
    store.getState().finishSheetLoad({ ...character, updatedAt: "v2" });
    expect(entry(store)?.character).toMatchObject({ updatedAt: "v2" });
    expect(entry(store)?.character?.sheet.identity.alignmentNote).toBe("rascunho");
    expect(entry(store)?.saveStatus).toBe("pending");
  });

  it("starts over when a sheet without pending edits is opened again", () => {
    const store = loaded();
    store.getState().startSheetLoad("c1");
    expect(entry(store)).toMatchObject({ status: "loading", character: null });
  });

  it("ignores a late server answer older than the sheet already shown", () => {
    const store = loaded();
    store.getState().markSheetSaved("c1", 0, "v3");
    store.getState().applyRemoteCharacter({ ...character, name: "Velho", updatedAt: "v2" });
    expect(entry(store)?.character).toMatchObject({ name: "Zarkov", updatedAt: "v3" });
  });

  it("keeps the pending draft when reloading it fails", () => {
    const store = loaded();
    store.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "rascunho"));
    store.getState().startSheetLoad("c1");
    store.getState().failSheetLoad("c1", "Erro interno do servidor.");
    expect(entry(store)).toMatchObject({
      status: "ready",
      saveStatus: "pending",
      error: "Erro interno do servidor.",
    });
    expect(entry(store)?.character?.sheet.identity.alignmentNote).toBe("rascunho");
    store.getState().finishSheetLoad({ ...character, updatedAt: "v2" });
    expect(entry(store)).toMatchObject({ error: null, saveStatus: "pending" });
  });

  it("drops the draft when another account opens the sheet in the same tab", () => {
    const other = loaded();
    other.getState().editSheet("c1", (sheet) => void (sheet.identity.alignmentNote = "rascunho"));
    other.getState().setSession({ account: { id: "outra", login: "outra", role: "PLAYER" } });
    other.getState().startSheetLoad("c1");
    expect(entry(other)).toMatchObject({ status: "loading", character: null, accountId: "outra" });
  });
});
