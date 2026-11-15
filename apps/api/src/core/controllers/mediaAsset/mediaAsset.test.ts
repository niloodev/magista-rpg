import { describe, expect, it, vi } from "vitest";

import type { IMediaAsset } from "@/core/models/mediaAsset";

import { createImageAssets } from "./mediaAsset";

const ID = "6f1c0b2e-8a43-4c4e-9b8d-2f3a1c5d7e90";
const KEY = `media/${ID}/full.webp`;

function build(
  options: {
    stored?: IMediaAsset[];
    refs?: number;
    raceLost?: boolean;
    legacy?: string[];
    unused?: IMediaAsset[];
    recent?: boolean;
    createFails?: boolean;
  } = {},
) {
  const rows = [...(options.stored ?? [])];
  const assets = {
    linkByHash: vi.fn(async (hash: string) => rows.find((row) => row.hash === hash) ?? null),
    findByKey: vi.fn(async () => null),
    create: vi.fn(async (asset: IMediaAsset) => {
      if (options.createFails) throw new Error("db down");
      if (options.raceLost) {
        rows.push({ ...asset, id: "winner", key: "media/winner/full.webp" });
        return null;
      }
      rows.push(asset);
      return asset;
    }),
    countReferences: vi.fn(async () => options.refs ?? 0),
    removeIfUnused: vi.fn(async () => (options.refs ?? 0) === 0 && !options.recent),
    listUnreferenced: vi.fn(async () => options.unused ?? []),
    listLegacyKeys: vi.fn(async () => options.legacy ?? []),
    replaceKey: vi.fn(async () => undefined),
  };
  const files = {
    put: vi.fn(async (assetId: string) => ({
      key: `media/${assetId}/full.webp`,
      thumbKey: `media/${assetId}/thumb.webp`,
      bytes: 10,
      contentType: "image/webp",
    })),
    readOriginal: vi.fn(async (key: string) => (key.includes("gone") ? null : Buffer.from(key))),
    remove: vi.fn(async () => undefined),
    removeKey: vi.fn(async () => undefined),
  };
  const service = createImageAssets({
    assets,
    files,
    readSize: (body) => (body.toString() === "nope" ? null : { width: 40, height: 20 }),
    hash: (body) => `hash-${body.toString()}`,
    newId: () => ID,
  });
  return { service, assets, files };
}

describe("image assets", () => {
  it("stores new bytes once, optimized with a thumbnail", async () => {
    const { service, files, assets } = build();
    expect(await service.ingest(Buffer.from("a"))).toEqual({ key: KEY, width: 40, height: 20 });
    expect(files.put).toHaveBeenCalledWith(ID, Buffer.from("a"));
    expect(assets.create).toHaveBeenCalledWith(
      expect.objectContaining({ hash: "hash-a", key: KEY }),
    );
    expect(await service.ingest(Buffer.from("nope"))).toBeNull();
  });

  it("reuses the asset of the same bytes instead of writing a duplicate", async () => {
    const existing = {
      id: "old",
      hash: "hash-a",
      key: "media/old/full.webp",
      thumbKey: null,
      width: 4,
      height: 2,
      bytes: 1,
      contentType: "image/webp",
    };
    const { service, files } = build({ stored: [existing] });
    expect(await service.ingest(Buffer.from("a"))).toEqual({
      key: "media/old/full.webp",
      width: 4,
      height: 2,
    });
    expect(files.put).not.toHaveBeenCalled();
  });

  it("drops its own files when another upload of the same bytes won", async () => {
    const { service, files } = build({ raceLost: true });
    expect(await service.ingest(Buffer.from("a"))).toMatchObject({ key: "media/winner/full.webp" });
    expect(files.remove).toHaveBeenCalledWith(ID);
  });

  it("keeps an asset an upload linked moments ago, even with no links yet", async () => {
    const { service, files } = build({ recent: true });
    await service.release(KEY);
    expect(files.remove).not.toHaveBeenCalled();
  });

  it("drops its files and fails when saving the new asset breaks", async () => {
    const { service, files } = build({ createFails: true });
    await expect(service.ingest(Buffer.from("a"))).rejects.toThrow("db down");
    expect(files.remove).toHaveBeenCalledWith(ID);
  });

  it("deletes an older image only when nothing else uses it", async () => {
    const shared = build({ refs: 1 });
    await shared.service.release(`legacy/avatars/${ID}.png`);
    expect(shared.files.removeKey).not.toHaveBeenCalled();
  });

  it("deletes an asset only when nothing links to it, and older images right away", async () => {
    const linked = build({ refs: 1 });
    await linked.service.release(KEY);
    expect(linked.files.remove).not.toHaveBeenCalled();
    const free = build({ refs: 0 });
    await free.service.release(KEY);
    expect(free.assets.removeIfUnused).toHaveBeenCalledWith(ID, KEY);
    expect(free.files.remove).toHaveBeenCalledWith(ID);
    await free.service.release(`characters/${ID}/avatar-${ID}.png`);
    expect(free.files.removeKey).toHaveBeenCalledWith(`characters/${ID}/avatar-${ID}.png`);
    await free.service.release(null);
  });
});

describe("moving older images into assets", () => {
  it("re-links each older image to its asset and deletes the old file", async () => {
    const legacy = ["characters/a/avatar-1.png", "arena/maps/b/map-gone.png"];
    const { service, assets, files } = build({ legacy });
    const lines: string[] = [];
    expect(await service.adoptLegacy((line) => lines.push(line))).toEqual({ moved: 1, failed: 1 });
    expect(assets.replaceKey).toHaveBeenCalledWith("characters/a/avatar-1.png", KEY);
    expect(files.removeKey).toHaveBeenCalledWith("characters/a/avatar-1.png");
    expect(files.removeKey).not.toHaveBeenCalledWith("arena/maps/b/map-gone.png");
    expect(lines).toHaveLength(2);
  });

  it("sweeps the assets nothing links to", async () => {
    const unused = [
      {
        id: "u1",
        hash: "h",
        key: "media/u1/full.webp",
        thumbKey: null,
        width: 1,
        height: 1,
        bytes: 1,
        contentType: "image/webp",
      },
    ];
    const { service, assets, files } = build({ unused });
    expect(await service.sweep()).toBe(1);
    expect(assets.removeIfUnused).toHaveBeenCalledWith("u1", "media/u1/full.webp");
    expect(files.remove).toHaveBeenCalledWith("u1");
  });
});
