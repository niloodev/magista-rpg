import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { isErrorResult } from "@magista/shared";

import { importerController } from "@/core/controllers/importer";
import { disconnectDatabase } from "@/core/services/database";

import { findImage } from "./importRoll20.utils";

const USAGE = "Uso: npm run import:roll20 -- <pasta-dos-jogadores> [--force]";

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const folderArg = args.find((arg) => !arg.startsWith("--"));
  if (!folderArg) throw new Error(USAGE);
  const root = resolve(folderArg);
  const entries = await readdir(root, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, entry.name));
  const created: { name: string; password: string }[] = [];
  let failures = 0;

  for (const folder of folders.sort()) {
    const jsonPath = join(folder, "character.json");
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(jsonPath, "utf8"));
    } catch {
      console.warn(`- ${folder}: sem character.json válido, ignorado`);
      continue;
    }
    const result = await importerController.importCharacter({
      raw,
      avatarPath: await findImage(folder, "avatar"),
      tokenPath: await findImage(folder, "token"),
      force,
    });
    if (isErrorResult(result)) {
      failures += 1;
      console.error(`x ${folder}: ${result.error}`);
      continue;
    }
    const { name, status, password, mediaWarning } = result.payload;
    console.log(`${status === "skipped" ? "=" : "+"} ${name}: ${status}`);
    if (mediaWarning) console.warn(`  ! ${mediaWarning}`);
    if (password) created.push({ name, password });
  }

  if (created.length > 0) {
    console.log(
      "\nContas criadas (anote e entregue a cada jogador, as senhas não serão mostradas de novo):",
    );
    for (const { name, password } of created) console.log(`  ${name}  ->  ${password}`);
  }
  if (failures > 0) process.exitCode = 1;
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
