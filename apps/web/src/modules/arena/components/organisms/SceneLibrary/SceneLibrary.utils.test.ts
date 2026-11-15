import type { IArenaFolder, IArenaScene } from "@magista/shared";
import { describe, expect, it, vi } from "vitest";

import { parseExpandedFolders, sceneFolderMenu, sceneMenu } from "./SceneLibrary.utils";

const scene: IArenaScene = { id: "s1", name: "Ruínas", folderId: null, mapUrl: null, position: 0 };
const folder: IArenaFolder = { id: "f1", name: "Campanha", parentId: null, position: 0 };

describe("SceneLibrary utils", () => {
  it("offers to go live only when the scene is not live yet", () => {
    const handlers = { open: vi.fn(), preview: vi.fn(), goLive: vi.fn() };
    const idle = sceneMenu(scene, false, handlers);
    const live = sceneMenu(scene, true, handlers);
    expect(idle).toHaveLength(live.length + 1);
    idle[1]?.onSelect();
    expect(handlers.goLive).toHaveBeenCalledWith("s1");
    idle[0]?.onSelect();
    expect(handlers.preview).toHaveBeenCalledWith("s1");
    idle.at(-1)?.onSelect();
    expect(handlers.open).toHaveBeenCalledWith({ type: "deleteScene", scene });
    expect(idle.at(-1)?.destructive).toBe(true);
  });

  it("creates scenes and folders inside the chosen folder", () => {
    const open = vi.fn();
    const [newScene, newFolder] = sceneFolderMenu(folder, open);
    newScene?.onSelect();
    newFolder?.onSelect();
    expect(open).toHaveBeenNthCalledWith(1, { type: "createScene", folderId: "f1" });
    expect(open).toHaveBeenNthCalledWith(2, { type: "createFolder", parentId: "f1" });
  });

  it("reads saved expanded folders safely", () => {
    expect(parseExpandedFolders('["a", 2, "b"]')).toEqual(["a", "b"]);
    expect(parseExpandedFolders("{}")).toEqual([]);
    expect(parseExpandedFolders("nope")).toEqual([]);
    expect(parseExpandedFolders(null)).toEqual([]);
  });
});
