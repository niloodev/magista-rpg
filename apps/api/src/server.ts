import { createServer } from "node:http";

import { createApp } from "@/app";
import { disconnectDatabase } from "@/core/services/database";
import { getEnv } from "@/core/services/env";
import { ensureBucket } from "@/core/services/media";
import { createRealtime } from "@/realtime";

const env = getEnv();
const httpServer = createServer(createApp());
const io = createRealtime(httpServer);

void ensureBucket()
  .catch((error: unknown) => {
    console.error("Storage de imagens indisponível (rode npm run db:up):", error);
  })
  .finally(() => {
    httpServer.listen(env.PORT, () => {
      console.log(`Magista API ouvindo em http://localhost:${env.PORT}`);
    });
  });

async function shutdown(): Promise<void> {
  await io.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
