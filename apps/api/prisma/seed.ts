import { upsertAccount } from "../src/core/models/account";
import { characterModels } from "../src/core/models/character";
import { hashPassword } from "../src/core/services/auth";
import { disconnectDatabase } from "../src/core/services/database";

function readSeedVar(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Defina ${name} no .env para rodar o seed.`);
  return value;
}

async function seed(): Promise<void> {
  const gmLogin = readSeedVar("SEED_GM_LOGIN");
  await upsertAccount({
    login: gmLogin,
    passwordHash: await hashPassword(readSeedVar("SEED_GM_PASSWORD")),
    role: "GM",
  });
  console.log(`Mestre pronto: ${gmLogin}`);

  const playerLogin = readSeedVar("SEED_PLAYER_LOGIN");
  const player = await upsertAccount({
    login: playerLogin,
    passwordHash: await hashPassword(readSeedVar("SEED_PLAYER_PASSWORD")),
    role: "PLAYER",
  });
  const current = await characterModels.findByAccountAndName(player.id, playerLogin);
  await characterModels.upsertCharacter({
    id: current?.id,
    accountIds: [player.id],
    name: playerLogin,
  });
  console.log(`Jogador pronto: ${playerLogin}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
