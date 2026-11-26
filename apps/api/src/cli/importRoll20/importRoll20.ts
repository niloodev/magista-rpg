import { readdir, readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { isErrorResult } from "@magista/shared";

import { importerController } from "@/core/controllers/importer";
import { disconnectDatabase } from "@/core/services/database";
import { ensureBucket } from "@/core/services/media";

import { IMPORT_USAGE } from "./importRoll20.constants";
import { isWantedFolder, parseImportArgs, readImage } from "./importRoll20.utils";

async function run(): Promise<void> {
  const args = parseImportArgs(process.argv.slice(2));
  if (!args) throw new Error(IMPORT_USAGE);
  const { force, only, account } = args;
  const root = resolve(process.env.INIT_CWD ?? ".", args.folder);
  await ensureBucket();
  const entries = await readdir(root, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory() && isWantedFolder(entry.name, only))
    .map((entry) => join(root, entry.name));
  if (folders.length === 0) console.warn("Nenhuma pasta de personagem encontrada com esses nomes.");
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
    let images: { avatar: Buffer | null; art: Buffer | null };
    try {
      images = { avatar: await readImage(folder, "token"), art: await readImage(folder, "avatar") };
    } catch (error) {
      failures += 1;
      console.error(`x ${folder}: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    const result = await importerController.importCharacter({
      raw,
      ...images,
      force,
      login: account ?? undefined,
    });
    if (isErrorResult(result)) {
      failures += 1;
      console.error(`x ${folder}: ${result.error}`);
      continue;
    }
    const { name, status, password, mediaWarning } = result.payload;
    console.log(
      `${status === "skipped" ? "=" : "+"} ${name}: ${status}${account ? ` (conta ${account})` : ""} [${basename(folder)}]`,
    );
    if (mediaWarning) console.warn(`  ! ${mediaWarning}`);
    if (password) created.push({ name: account ?? name, password });
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
