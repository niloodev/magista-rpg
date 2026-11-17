import { randomUUID } from "node:crypto";

import {
  applyLevelUp,
  buildLevelUpSpec,
  buildPingSpec,
  buildRollSpec,
  characterIdSchema,
  levelUpInputSchema,
  pingRequestSchema,
  rollRequestSchema,
  rollSpecRows,
  type ICharacter,
  type IRollResult,
  type IRollSpec,
  type RollResultKind,
  characterPortrait,
} from "@magista/shared";

import { characterModels } from "@/core/models/character";
import { serverRandomInt } from "@/core/services/dice";

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
    const rolled = rollSpecRows(spec, deps.randomInt);
    if (!rolled) return null;
    return {
      id: deps.createId(),
      kind,
      characterId: character.id,
      characterName: character.name,
      portraitUrl: characterPortrait(character),
      rolledByGm: viewer.role === "GM",
      title: spec.title,
      subtitle: spec.subtitle,
      rows: rolled.rows,
      notes: rolled.notes,
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
      const spec = buildRollSpec(character.sheet, parsed.data.roll, {
        features: character.features,
      });
      if (!spec) return { error: rollErrors.notFound };
      const result = rollSpec(spec, parsed.data.roll.kind, character, viewer);
      if (!result) return { error: rollErrors.invalidExpression };
      const { tokenId } = parsed.data;
      return { message: "Rolagem feita", payload: tokenId ? { ...result, tokenId } : result };
    } catch (error) {
      console.error("roll failed:", error);
      return { error: rollErrors.unexpected };
    }
  };

  const rollInitiatives: IRollController["rollInitiatives"] = async (
    viewer,
    characterId,
    tokenIds,
  ) => {
    try {
      const character = await deps.characters.findById(characterId);
      if (!character) return [];
      if (!(await canAccessCharacter(viewer, character.id, deps.characters))) return [];
      const spec = buildRollSpec(
        character.sheet,
        { kind: "initiative" },
        { features: character.features },
      );
      if (!spec) return [];
      return tokenIds.flatMap((tokenId) => {
        const result = rollSpec(spec, "initiative", character, viewer);
        return result ? [{ ...result, tokenId }] : [];
      });
    } catch (error) {
      console.error("rollInitiatives failed:", error);
      return [];
    }
  };

  const ping: IRollController["ping"] = async (viewer, input) => {
    const parsed = pingRequestSchema.safeParse(input);
    if (!parsed.success) return { error: rollErrors.invalidPing };
    try {
      const character = await deps.characters.findById(parsed.data.characterId);
      if (!character)
        return {
          error: viewer.role === "GM" ? rollErrors.entryNotFound : rollErrors.pingForbidden,
        };
      if (!(await canAccessCharacter(viewer, character.id, deps.characters)))
        return { error: rollErrors.pingForbidden };
      const spec = buildPingSpec(character.sheet, parsed.data.entry);
      if (!spec) return { error: rollErrors.entryNotFound };
      const result = rollSpec(spec, parsed.data.entry.kind, character, viewer);
      if (!result) return { error: rollErrors.unexpectedPing };
      return { message: "Mostrado na mesa", payload: result };
    } catch (error) {
      console.error("ping failed:", error);
      return { error: rollErrors.unexpectedPing };
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

  return { roll, rollInitiatives, ping, levelUp };
}

export const rollController = createRollController({
  characters: characterModels,
  randomInt: serverRandomInt,
  createId: randomUUID,
  now: () => new Date(),
});
