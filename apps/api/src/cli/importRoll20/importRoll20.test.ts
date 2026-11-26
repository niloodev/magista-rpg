import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { findImage, isWantedFolder, parseImportArgs, readImage } from "./importRoll20.utils";

let folder: string;

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), "magista-import-"));
});

afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});

describe("Roll20 images", () => {
  it("finds an image by base name, ignoring other extensions", async () => {
    await writeFile(join(folder, "token.PNG"), "png");
    await writeFile(join(folder, "avatar.txt"), "nope");
    expect(await findImage(folder, "token")).toBe(join(folder, "token.PNG"));
    expect(await findImage(folder, "avatar")).toBeNull();
  });

  it("reads the bytes, returns null when missing and refuses symbolic links", async () => {
    await writeFile(join(folder, "real.png"), "bytes");
    await symlink(join(folder, "real.png"), join(folder, "token.png"));
    await writeFile(join(folder, "avatar.webp"), "art");
    expect((await readImage(folder, "avatar"))?.toString()).toBe("art");
    expect(await readImage(folder, "missing")).toBeNull();
    await expect(readImage(folder, "token")).rejects.toThrow("Links simbólicos");
  });
});

describe("Roll20 import arguments", () => {
  it("reads the folder, force, the names to import and the account", () => {
    expect(
      parseImportArgs([
        "pasta",
        "--only",
        "Heylel, de Lux",
        "--account",
        "Izábi Ferros",
        "--force",
      ]),
    ).toEqual({ folder: "pasta", force: true, only: ["Heylel, de Lux"], account: "Izábi Ferros" });
    expect(parseImportArgs(["pasta"])).toEqual({
      folder: "pasta",
      force: false,
      only: [],
      account: null,
    });
  });

  it("refuses a missing folder or flag value", () => {
    expect(parseImportArgs([])).toBeNull();
    expect(parseImportArgs(["pasta", "--only"])).toBeNull();
    expect(parseImportArgs(["pasta", "--account", "--force"])).toBeNull();
    expect(parseImportArgs(["pasta", "--outra"])).toBeNull();
    expect(parseImportArgs(["a", "b"])).toBeNull();
  });

  it("matches only the folders named exactly, without the number", () => {
    expect(isWantedFolder("056 - Heylel, de Lux", ["heylel, de lux"])).toBe(true);
    expect(isWantedFolder("121 - Seguidora de Heylel (A)", ["Heylel, de Lux"])).toBe(false);
    expect(isWantedFolder("056 - Heylel, de Lux", ["056 - Heylel, de Lux"])).toBe(true);
    expect(isWantedFolder("000 - Dante Lasost", [])).toBe(true);
  });
});
