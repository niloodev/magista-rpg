import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { detectImageType, ensureBucket, isMediaKey, mediaStorage } from "@/core/services/media";

import { LEGACY_FOLDERS, LEGACY_PREFIX, USAGE } from "./storage.constants";
import { listFiles } from "./storage.utils";

async function upload(key: string, path: string): Promise<boolean> {
  if (!isMediaKey(key)) {
    console.warn(`- ${key}: nome fora do padrão, ignorado`);
    return false;
  }
  const body = await readFile(path);
  const type = detectImageType(body);
  if (!type) {
    console.warn(`- ${key}: não é uma imagem suportada, ignorado`);
    return false;
  }
  await mediaStorage.putObject(key, body, type.contentType);
  return true;
}

async function dump(target: string): Promise<void> {
  const keys = await mediaStorage.listKeys();
  for (const key of keys) {
    if (!isMediaKey(key)) {
      console.warn(`- ${key}: nome fora do padrão, ignorado`);
      continue;
    }
    const object = await mediaStorage.getObject(key);
    if (!object) continue;
    const path = join(target, ...key.split("/"));
    await mkdir(dirname(path), { recursive: true });
    const chunks: Buffer[] = [];
    for await (const chunk of object.body) chunks.push(Buffer.from(chunk as Uint8Array));
    await writeFile(path, Buffer.concat(chunks));
  }
  console.log(`${keys.length} imagens copiadas para ${target}`);
}

async function restore(source: string): Promise<void> {
  let count = 0;
  for (const key of await listFiles(source)) {
    if (await upload(key, join(source, ...key.split("/")))) count += 1;
  }
  console.log(`${count} imagens enviadas para o storage`);
}

async function migrateLocal(source: string): Promise<void> {
  let count = 0;
  for (const folder of LEGACY_FOLDERS) {
    const files = await listFiles(join(source, folder)).catch(() => {
      console.warn(`- ${join(source, folder)}: pasta não encontrada`);
      return [];
    });
    for (const file of files) {
      if (await upload(`${LEGACY_PREFIX}/${folder}/${file}`, join(source, folder, file)))
        count += 1;
    }
  }
  console.log(`${count} imagens antigas enviadas para o storage`);
}

const COMMANDS = { dump, restore, "migrate-local": migrateLocal } as const;

async function run(): Promise<void> {
  const [command, folder] = process.argv.slice(2);
  if (!folder || !command || !(command in COMMANDS)) throw new Error(USAGE);
  await ensureBucket();
  await COMMANDS[command as keyof typeof COMMANDS](resolve(process.env.INIT_CWD ?? ".", folder));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
