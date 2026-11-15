import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { listFiles } from "./storage.utils";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "magista-storage-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("listFiles", () => {
  it("lists nested files with forward slashes and skips symbolic links", async () => {
    await mkdir(join(root, "legacy", "tokens"), { recursive: true });
    await writeFile(join(root, "legacy", "tokens", "a.png"), "x");
    await writeFile(join(root, "top.png"), "x");
    await symlink(join(root, "top.png"), join(root, "link.png"));
    expect((await listFiles(root)).sort()).toEqual(["legacy/tokens/a.png", "top.png"]);
  });
});
