import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/core/services/env";

let client: PrismaClient | null = null;

/**
 * Returns the shared Prisma client, created lazily on first use.
 */
export function getDatabase(): PrismaClient {
  if (client) return client;
  const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL });
  client = new PrismaClient({ adapter });
  return client;
}

/**
 * Closes the shared Prisma client if it was created.
 */
export async function disconnectDatabase(): Promise<void> {
  if (!client) return;
  await client.$disconnect();
  client = null;
}
