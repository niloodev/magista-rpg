import { randomInt, randomUUID } from "node:crypto";

import {
  applyLevelUp,
  buildLevelUpSpec,
  buildRollSpec,
  characterIdSchema,
  levelUpInputSchema,
  rollDiceExpression,
  rollRequestSchema,
  type ICharacter,
  type IRollResult,
  type IRollResultRow,
  type IRollSpec,
  type RollResultKind,
} from "@magista/shared";

import { characterModels } from "@/core/models/character";
import { getEnv } from "@/core/services/env";

import type { IViewer } from "../controllers.types";
import { canAccessCharacter } from "../controllers.utils";
import { rollErrors } from "./roll.errors";
import type { IRollController, IRollControllerDeps } from "./roll.types";

/**
 * Builds the roll controller. Dice are rolled on the server from the stored sheet, never trusted from the client.
 */
export function createRollController(deps: IRollControllerDeps): IRollController {
  const rollSpec = (
    spec: IRollSpec,
    kind: RollResultKind,
    character: ICharacter,
    viewer: IViewer,
  ): IRollResult | null => {
    const rows: IRollResultRow[] = [];
    for (const row of spec.rows) {
      const outcome = rollDiceExpression(row.expression, deps.randomInt);
      if (!outcome) return null;
      rows.push({ label: row.label, outcome });
    }
    return {
      id: deps.createId(),
      kind,
      characterId: character.id,
      characterName: character.name,
      portraitUrl: character.tokenUrl ?? character.avatarUrl,
      rolledByGm: viewer.role === "GM",
      title: spec.title,
      subtitle: spec.subtitle,
      rows,
      notes: spec.notes,
      createdAt: deps.now().toISOString(),
    };
  };

  const roll: IRollController["roll"] = async (viewer, input) => {
    const parsed = rollRequestSchema.safeParse(input);
    if (!parsed.success) return { error: rollErrors.invalidRequest };
    try {
      const character = await deps.characters.findById(parsed.data.characterId);
      if (!character) return { error: rollErrors.notFound };
      if (!(await canAccessCharacter(viewer, character.id, deps.characters)))
        return { error: rollErrors.forbidden };
      const spec = buildRollSpec(character.sheet, parsed.data.roll);
      if (!spec) return { error: rollErrors.notFound };
      const result = rollSpec(spec, parsed.data.roll.kind, character, viewer);
      if (!result) return { error: rollErrors.invalidExpression };
      return { message: "Rolagem feita", payload: result };
    } catch (error) {
      console.error("roll failed:", error);
      return { error: rollErrors.unexpected };
    }
  };

  const levelUp: IRollController["levelUp"] = async (viewer, characterId, input) => {
    if (viewer.role !== "GM") return { error: rollErrors.gmOnly };
    if (!characterIdSchema.safeParse(characterId).success) return { error: rollErrors.notFound };
    const parsed = levelUpInputSchema.safeParse(input);
    if (!parsed.success) return { error: rollErrors.invalidRequest };
    try {
      const character = await deps.characters.findById(characterId);
      if (!character) return { error: rollErrors.notFound };
      const spec = buildLevelUpSpec(character.sheet);
      if (!spec) return { error: rollErrors.maxLevel };
      const result = rollSpec(spec, "levelUp", character, viewer);
      const [health, sanity] = result?.rows ?? [];
      if (!result || !health || !sanity) return { error: rollErrors.invalidExpression };
      const sheet = applyLevelUp(
        character.sheet,
        { health: health.outcome.total, sanity: sanity.outcome.total },
        parsed.data.addToCurrent,
      );
      const saved = await deps.characters.updateSheet(character.id, sheet, character.updatedAt);
      if (!saved) return { error: rollErrors.conflict };
      return { message: "Nível aumentado", payload: { character: saved, roll: result } };
    } catch (error) {
      console.error("levelUp failed:", error);
      return { error: rollErrors.unexpected };
    }
  };

  return { roll, levelUp };
}

/**
 * Server dice source. Outside production, DEV_FORCED_D20 makes every d20 land on that face (to preview crits/fumbles).
 */
function serverRandomInt(min: number, max: number): number {
  const env = getEnv();
  const forced = env.NODE_ENV === "production" ? undefined : env.DEV_FORCED_D20;
  if (forced !== undefined && min === 1 && max === 20) return forced;
  return randomInt(min, max + 1);
}

export const rollController = createRollController({
  characters: characterModels,
  randomInt: serverRandomInt,
  createId: randomUUID,
  now: () => new Date(),
});
