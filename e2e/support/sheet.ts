import { apiAs, payloadOf } from "./api";
import { GM } from "./env";
import { e2eState } from "./fixtures";

type StoredEntry = { id: string; name: string } & Record<string, unknown>;

export interface StoredSheet {
  sheet: Record<string, unknown> & {
    traits: StoredEntry[];
    abilities: StoredEntry[];
    innerRealm: StoredEntry[];
    inventory: { maxWeightGrams: number | null; items: StoredEntry[] };
  };
  updatedAt: string;
}

/**
 * Ability (or inner realm entry) with only an id and a name.
 */
export const ability = (id: string, name: string) => ({
  id,
  name,
  attackAttribute: null,
  damageDice: "",
  damageFlat: 0,
  damageAttribute: null,
  addBaseDamage: false,
  addProficiency: false,
  description: "",
});

/**
 * Reads the stored sheet of the seed test character.
 */
export async function readSheet(): Promise<StoredSheet> {
  const gm = await apiAs(GM);
  const result = await payloadOf<StoredSheet>(
    await gm.get(`/characters/${e2eState().playerCharacterId}`),
  );
  await gm.dispose();
  return result;
}

/**
 * Replaces parts of the seed test character sheet through the API (as the GM).
 */
export async function writeLists(lists: Partial<StoredSheet["sheet"]>) {
  const gm = await apiAs(GM);
  const current = await payloadOf<StoredSheet>(
    await gm.get(`/characters/${e2eState().playerCharacterId}`),
  );
  const response = await gm.put(`/characters/${e2eState().playerCharacterId}/sheet`, {
    data: { sheet: { ...current.sheet, ...lists }, baseUpdatedAt: current.updatedAt },
  });
  if (!response.ok()) throw new Error(`Falha ao preparar a ficha: ${await response.text()}`);
  await gm.dispose();
}
