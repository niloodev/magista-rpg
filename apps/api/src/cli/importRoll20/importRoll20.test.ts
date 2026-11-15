import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { findImage, readImage } from "./importRoll20.utils";

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
