import { imageAssets } from "@/core/controllers/mediaAsset";
import { disconnectDatabase } from "@/core/services/database";
import { ensureBucket } from "@/core/services/media";

async function run(): Promise<void> {
  await ensureBucket();
  const { moved, failed } = await imageAssets.adoptLegacy((line) => console.log(line));
  const swept = await imageAssets.sweep();
  console.log(
    `\n${moved} imagens movidas para a biblioteca, ${failed} com falha, ${swept} sem uso apagadas.`,
  );
  if (failed > 0) process.exitCode = 1;
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
