import type { IArenaTurnRolls } from "@/core/controllers/arenaTurn";

/**
 * The rolls of a token menu command without the character tokens the roll limit refused: they neither spin in
 * the turn order window nor roll.
 */
export function withoutRefused(
  rolls: IArenaTurnRolls,
  accepted: IArenaTurnRolls["characters"],
  refused: ReadonlySet<string>,
): IArenaTurnRolls {
  if (refused.size === 0) return rolls;
  const keep = (tokenId: string) => !refused.has(tokenId);
  return {
    ...rolls,
    characters: accepted,
    pending: {
      ...rolls.pending,
      gm: rolls.pending.gm.filter(keep),
      table: rolls.pending.table?.filter(keep) ?? null,
    },
  };
}
