import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { apiAs, payloadOf, type CharacterSummary } from "./support/api";
import { GM, PLAYER } from "./support/env";
import { STATE_FILE } from "./support/state";

const EMPTY_ATTRIBUTE = { value: null, proficient: false };

/**
 * Resets the seed test character (never the real players) to a known sheet and records the ids the specs need.
 */
export default async function globalSetup(): Promise<void> {
  const gm = await apiAs(GM);
  const characters = await payloadOf<CharacterSummary[]>(await gm.get("/characters"));
  const player = characters.find(
    (character) => character.name.toLowerCase() === PLAYER.login.toLowerCase(),
  );
  const other = characters.find((character) => character.id !== player?.id);
  if (!player || !other)
    throw new Error("Rode o seed (npm run db:seed) e importe ao menos um outro personagem.");
  const current = await payloadOf<{ sheet: Record<string, unknown>; updatedAt: string }>(
    await gm.get(`/characters/${player.id}`),
  );
  const sheet = {
    ...current.sheet,
    identity: { class: "vanguardista", level: 3, alignment: null, alignmentNote: "" },
    attributes: Object.fromEntries(
      ["for", "con", "des", "int", "sab", "car"].map((key) => [key, EMPTY_ATTRIBUTE]),
    ),
    resources: { health: { current: 20, max: 20 }, sanity: { current: 30, max: 30 } },
    combat: { openings: 0, movementBonus: false },
    abilities: [],
    innerRealm: [],
    inventory: { maxWeightGrams: 5000, items: [] },
    traits: [],
  };
  const saved = await gm.put(`/characters/${player.id}/sheet`, {
    data: { sheet, baseUpdatedAt: current.updatedAt },
  });
  if (!saved.ok()) throw new Error(`Não foi possível resetar a ficha de teste: ${saved.status()}`);
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(
    STATE_FILE,
    JSON.stringify({ playerCharacterId: player.id, otherCharacterId: other.id }),
  );
  await gm.dispose();
}
