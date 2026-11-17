import {
  arenaTurnCommandSchema,
  buildRollSpec,
  canControlToken,
  placeTurnEntries,
  rollDiceExpression,
  tokenInitiativeExpression,
  visibleTurnOrder,
  type IArenaToken,
  type IArenaTurnEntry,
  type IArenaTurnOrder,
} from "@magista/shared";

import { arenaSceneModels } from "@/core/models/arenaScene";
import { arenaTokenModels } from "@/core/models/arenaToken";
import { arenaTurnModels } from "@/core/models/arenaTurn";
import { characterModels } from "@/core/models/character";
import { serverRandomInt } from "@/core/services/dice";

import { PLAYER_TURN_ACTIONS, TURN_ROLL_GUARD_MS } from "./arenaTurn.constants";
import { arenaTurnErrors } from "./arenaTurn.errors";
import type {
  IArenaTurnController,
  IArenaTurnControllerDeps,
  IArenaTurnDelivery,
  IArenaTurnPendingDelivery,
} from "./arenaTurn.types";
import { applyTurnCommand } from "./arenaTurn.utils";

/**
 * Builds the turn order controller (the Roll20 "Turn Order"): one order per scene, by token. The GM runs it; a
 * player ends the turn of a token they control and rolls the initiative of their tokens that have none yet.
 * Initiative is always rolled on the server: a character token as a normal sheet roll (it shows in the feed), an
 * NPC in secret; both only reach the order when the dice reveal.
 */
export function createArenaTurnController({
  turns,
  tokens,
  scenes,
  characters,
  randomInt,
  now,
}: IArenaTurnControllerDeps): IArenaTurnController {
  const rollingUntil = new Map<string, number>();

  const failed = (action: string, error: unknown) => {
    console.error(`${action} failed:`, error);
    return { error: arenaTurnErrors.unexpected };
  };

  const visibleIds = (sceneTokens: IArenaToken[]) =>
    new Set(sceneTokens.filter((token) => !token.hidden).map((token) => token.id));

  const deliver = (
    order: IArenaTurnOrder,
    sceneTokens: IArenaToken[],
    activeSceneId: string | null,
  ): IArenaTurnDelivery => {
    if (order.sceneId !== activeSceneId) return { gm: order, table: null };
    return { gm: order, table: visibleTurnOrder(order, visibleIds(sceneTokens)) };
  };

  const pendingOf = (
    sceneId: string,
    rolled: IArenaToken[],
    activeSceneId: string | null,
  ): IArenaTurnPendingDelivery => {
    const visible = visibleIds(rolled);
    return {
      sceneId,
      gm: rolled.map((token) => token.id),
      table:
        sceneId === activeSceneId
          ? rolled.flatMap((token) => (visible.has(token.id) ? [token.id] : []))
          : null,
    };
  };

  /** Tokens not already rolling (each roll waits for its reveal), now marked as rolling. */
  const claimRolls = (targets: IArenaToken[]) => {
    const time = now();
    const free = targets.filter((token) => (rollingUntil.get(token.id) ?? 0) <= time);
    for (const token of free) rollingUntil.set(token.id, time + TURN_ROLL_GUARD_MS);
    for (const [id, until] of rollingUntil) if (until <= time) rollingUntil.delete(id);
    return free;
  };

  /**
   * A character token rolls in the open (a sheet roll in the feed) only when the table may see it: on the live
   * scene, visible and with its name shown. Any other token rolls in secret.
   */
  const rollsInOpen = (token: IArenaToken, activeSceneId: string | null) =>
    token.characterId !== null &&
    token.sceneId === activeSceneId &&
    !token.hidden &&
    token.showName;

  /** Rolls in secret: an NPC with 1d20 + its bonus, a character token with its sheet initiative. */
  const rollSecretly = async (targets: IArenaToken[]): Promise<IArenaTurnEntry[]> => {
    const characterIds = [...new Set(targets.flatMap((token) => token.characterId ?? []))];
    const sheets = new Map(
      await Promise.all(
        characterIds.map(async (id) => [id, await characters.findById(id)] as const),
      ),
    );
    return targets.flatMap((token) => {
      const character = token.characterId ? sheets.get(token.characterId) : null;
      const expression = character
        ? buildRollSpec(character.sheet, { kind: "initiative" }, { features: character.features })
            ?.rows[0]?.expression
        : token.characterId === null
          ? tokenInitiativeExpression(token.initiativeBonus)
          : undefined;
      const outcome = expression ? rollDiceExpression(expression, randomInt) : null;
      return outcome ? [{ tokenId: token.id, initiative: outcome.total }] : [];
    });
  };

  const command: IArenaTurnController["command"] = async (viewer, input) => {
    const parsed = arenaTurnCommandSchema.safeParse(input);
    if (!parsed.success) return { error: arenaTurnErrors.invalidCommand };
    const request = parsed.data;
    const gm = viewer.role === "GM";
    if (!gm && !PLAYER_TURN_ACTIONS.has(request.action)) return { error: arenaTurnErrors.gmOnly };
    try {
      const activeSceneId = await scenes.findActiveSceneId();
      if (!gm && request.sceneId !== activeSceneId) return { error: arenaTurnErrors.notLive };
      const sceneTokens = await tokens.listByScene(request.sceneId, { includeHidden: true });
      const byId = new Map(sceneTokens.map((token) => [token.id, token]));
      const named =
        "tokenIds" in request ? request.tokenIds : "tokenId" in request ? [request.tokenId] : [];
      const targets = named.flatMap((id) => byId.get(id) ?? []);
      const missing = targets.length < named.length;
      if (missing && (request.action !== "remove" || !gm)) {
        return { error: arenaTurnErrors.tokenNotFound };
      }
      if (!gm) {
        if (targets.some((token) => token.hidden)) return { error: arenaTurnErrors.tokenNotFound };
        const accessible = await characters.listAccessibleIds(viewer.accountId);
        if (targets.some((token) => !canControlToken(viewer, token, accessible)))
          return { error: arenaTurnErrors.forbidden };
      }
      if (request.action === "roll") {
        const order = await turns.findOrder(request.sceneId);
        if (!order) return { error: arenaTurnErrors.sceneNotFound };
        const valued = new Set(
          order.entries.filter((entry) => entry.initiative !== null).map((entry) => entry.tokenId),
        );
        const rolled = claimRolls(gm ? targets : targets.filter((token) => !valued.has(token.id)));
        const open = rolled.filter((token) => rollsInOpen(token, activeSceneId));
        const secret = await rollSecretly(
          rolled.filter((token) => !rollsInOpen(token, activeSceneId)),
        );
        return {
          message: "Iniciativa rolada",
          payload: {
            delivery: deliver(order, sceneTokens, activeSceneId),
            changed: false,
            rolls:
              rolled.length === 0
                ? null
                : {
                    sceneId: request.sceneId,
                    secret,
                    characters: open.flatMap((token) =>
                      token.characterId
                        ? [{ tokenId: token.id, characterId: token.characterId }]
                        : [],
                    ),
                    pending: pendingOf(request.sceneId, rolled, activeSceneId),
                  },
          },
        };
      }
      const result = await turns.change(request.sceneId, (order) =>
        applyTurnCommand(order, request),
      );
      if (!result) return { error: arenaTurnErrors.sceneNotFound };
      return {
        message: "Ordem de turnos atualizada",
        payload: {
          delivery: deliver(result.order, sceneTokens, activeSceneId),
          changed: result.changed,
          rolls: null,
        },
      };
    } catch (error) {
      return failed("arenaTurn.command", error);
    }
  };

  /** Writes rolled values into the order of a scene (tokens that left it are skipped by the model). */
  const place = async (sceneId: string, entries: IArenaTurnEntry[]) => {
    for (const { tokenId } of entries) rollingUntil.delete(tokenId);
    if (entries.length === 0) return null;
    const result = await turns.change(sceneId, (order) => ({
      ...order,
      entries: placeTurnEntries(order.entries, entries),
    }));
    if (!result) return null;
    const [sceneTokens, activeSceneId] = await Promise.all([
      tokens.listByScene(sceneId, { includeHidden: true }),
      scenes.findActiveSceneId(),
    ]);
    return deliver(result.order, sceneTokens, activeSceneId);
  };

  const recordInitiative: IArenaTurnController["recordInitiative"] = async (characterId, total) => {
    const activeSceneId = await scenes.findActiveSceneId();
    if (!activeSceneId) return null;
    const sceneTokens = await tokens.listByScene(activeSceneId, { includeHidden: true });
    const own = sceneTokens.filter((token) => token.characterId === characterId);
    return place(
      activeSceneId,
      own.map((token) => ({ tokenId: token.id, initiative: total })),
    );
  };

  const recordRolled: IArenaTurnController["recordRolled"] = (sceneId, entries) =>
    place(sceneId, entries);

  const initiativePending: IArenaTurnController["initiativePending"] = async (characterId) => {
    const activeSceneId = await scenes.findActiveSceneId();
    if (!activeSceneId) return null;
    const sceneTokens = await tokens.listByScene(activeSceneId, { includeHidden: true });
    const own = sceneTokens.filter((token) => token.characterId === characterId);
    return own.length > 0 ? pendingOf(activeSceneId, own, activeSceneId) : null;
  };

  const delivery: IArenaTurnController["delivery"] = async (sceneId) => {
    const order = await turns.findOrder(sceneId);
    if (!order || (order.entries.length === 0 && order.currentTokenId === null)) return null;
    const [sceneTokens, activeSceneId] = await Promise.all([
      tokens.listByScene(sceneId, { includeHidden: true }),
      scenes.findActiveSceneId(),
    ]);
    return deliver(order, sceneTokens, activeSceneId);
  };

  return { command, recordInitiative, recordRolled, initiativePending, delivery };
}

export const arenaTurnController = createArenaTurnController({
  turns: arenaTurnModels,
  tokens: arenaTokenModels,
  scenes: arenaSceneModels,
  characters: characterModels,
  randomInt: serverRandomInt,
  now: Date.now,
});
