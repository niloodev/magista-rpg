import { isErrorResult } from "@magista/shared";

import { accountController } from "@/core/controllers/account";
import { disconnectDatabase } from "@/core/services/database";

const USAGE = 'Uso: npm run account:create-gm -- "<login>" [senha]';

async function run(): Promise<void> {
  const [login, password] = process.argv.slice(2);
  if (!login) throw new Error(USAGE);
  const result = await accountController.createGm({ login, password });
  if (isErrorResult(result)) throw new Error(result.error);
  console.log(`${result.payload.account.login} (Mestre)  ->  ${result.payload.password}`);
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
