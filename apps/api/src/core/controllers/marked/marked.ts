import { randomUUID } from "node:crypto";

import {
  allTargetsAccepted,
  hasFeature,
  MARKED_ANSWER_TIMEOUT_MS,
  markedAnswerSchema,
  markedCancelSchema,
  markedProposeSchema,
  markedStopSchema,
  proposalCharacterIds,
  type IMarkedProposal,
  type IMarkedResolution,
  type MarkedOutcome,
} from "@magista/shared";

import { characterModels } from "@/core/models/character";
import { markedShareModels } from "@/core/models/markedShare";

import { canAccessCharacter } from "../controllers.utils";
import type { IViewer } from "../controllers.types";
import { MARKED_FEATURE } from "./marked.constants";
import { markedErrors } from "./marked.errors";
import type { IMarkedController, IMarkedControllerDeps } from "./marked.types";

/**
 * Builds the Marca controller: one trait share proposal at a time, answered by every other Marcado
 * (a player with access or the GM), and a single active share for the whole group.
 * The pending proposal lives in memory; the active share is stored.
 */
export function createMarkedController({
  characters,
  shares,
  isAttended,
  createId,
  now,
  timeoutMs,
}: IMarkedControllerDeps): IMarkedController {
  let pending: IMarkedProposal | null = null;

  const failed = (action: string, error: unknown) => {
    console.error(`${action} failed:`, error);
    return { error: markedErrors.unexpected };
  };

  const markedIds = async () =>
    (await characters.listByFeature(MARKED_FEATURE)).map((entry) => entry.id);

  const resolve = (
    proposal: IMarkedProposal,
    outcome: MarkedOutcome,
    decidedBy: string | null = null,
  ): IMarkedResolution => {
    if (pending?.id === proposal.id) pending = null;
    return { proposalId: proposal.id, outcome, decidedBy };
  };

  const canActFor = (viewer: IViewer, characterId: string) =>
    canAccessCharacter(viewer, characterId, characters);

  const isExpired = (proposal: IMarkedProposal) =>
    now().getTime() >= new Date(proposal.expiresAt).getTime();

  const propose: IMarkedController["propose"] = async (viewer, input) => {
    const parsed = markedProposeSchema.safeParse(input);
    if (!parsed.success) return { error: markedErrors.invalidRequest };
    const { characterId, traitId } = parsed.data;
    try {
      if (!(await canActFor(viewer, characterId))) return { error: markedErrors.forbidden };
      const source = await characters.findById(characterId);
      if (!source) return { error: markedErrors.forbidden };
      if (!hasFeature(source.features, MARKED_FEATURE)) return { error: markedErrors.notMarked };
      const trait = source.sheet.traits.find((entry) => entry.id === traitId);
      if (!trait) return { error: markedErrors.traitNotFound };
      if (pending && isExpired(pending)) pending = null;
      if (pending) return { error: markedErrors.proposalPending };
      if (await shares.findActive()) return { error: markedErrors.shareActive };
      const marked = await characters.listByFeature(MARKED_FEATURE);
      const targets = marked.filter((entry) => entry.id !== characterId);
      if (targets.length === 0) return { error: markedErrors.noOtherMarked };
      const attended = await Promise.all(targets.map((entry) => isAttended(entry.id)));
      if (attended.includes(false)) return { error: markedErrors.targetOffline };
      if (pending) return { error: markedErrors.proposalPending };
      const sourceEntry = marked.find((entry) => entry.id === characterId);
      const proposal: IMarkedProposal = {
        id: createId(),
        source: {
          characterId,
          name: source.name,
          portraitUrl: sourceEntry?.portraitUrl ?? source.avatarUrl ?? source.artUrl,
        },
        trait: { name: trait.name, description: trait.description },
        targets: targets.map((entry) => ({
          characterId: entry.id,
          name: entry.name,
          portraitUrl: entry.portraitUrl,
          status: "pending",
        })),
        expiresAt: new Date(now().getTime() + timeoutMs).toISOString(),
      };
      pending = proposal;
      return {
        message: "Pedido enviado à Marca",
        payload: { proposal, characterIds: proposalCharacterIds(proposal) },
      };
    } catch (error) {
      return failed("markedPropose", error);
    }
  };

  const answer: IMarkedController["answer"] = async (viewer, input) => {
    const parsed = markedAnswerSchema.safeParse(input);
    if (!parsed.success) return { error: markedErrors.invalidRequest };
    const { proposalId, characterId, accept } = parsed.data;
    try {
      const proposal = pending;
      if (!proposal || proposal.id !== proposalId || isExpired(proposal)) {
        return { error: markedErrors.proposalNotFound };
      }
      const target = proposal.targets.find((entry) => entry.characterId === characterId);
      if (!target) return { error: markedErrors.notTarget };
      if (!(await canActFor(viewer, characterId))) return { error: markedErrors.forbidden };
      if (pending !== proposal) return { error: markedErrors.proposalNotFound };
      if (target.status !== "pending") return { error: markedErrors.alreadyAnswered };
      target.status = accept ? "accepted" : "declined";
      const characterIds = proposalCharacterIds(proposal);
      const snapshot = structuredClone(proposal);
      if (!accept) {
        return {
          message: "Compartilhamento recusado",
          payload: {
            proposal: snapshot,
            resolution: resolve(proposal, "declined", target.name),
            share: null,
            characterIds,
          },
        };
      }
      if (!allTargetsAccepted(proposal)) {
        return {
          message: "Resposta registrada",
          payload: { proposal: snapshot, resolution: null, share: null, characterIds },
        };
      }
      pending = null;
      const share = await shares
        .start({ sourceCharacterId: proposal.source.characterId, trait: proposal.trait })
        .catch((error: unknown) => {
          console.error("markedShare start failed:", error);
          return null;
        });
      return {
        message: share ? "Traço compartilhado pela Marca" : "Compartilhamento cancelado",
        payload: {
          proposal: snapshot,
          resolution: resolve(proposal, share ? "accepted" : "cancelled"),
          share,
          characterIds: share ? await markedIds() : characterIds,
        },
      };
    } catch (error) {
      return failed("markedAnswer", error);
    }
  };

  const cancel: IMarkedController["cancel"] = async (viewer, input) => {
    const parsed = markedCancelSchema.safeParse(input);
    if (!parsed.success) return { error: markedErrors.invalidRequest };
    try {
      const proposal = pending;
      if (!proposal || proposal.id !== parsed.data.proposalId) {
        return { error: markedErrors.proposalNotFound };
      }
      if (!(await canActFor(viewer, proposal.source.characterId))) {
        return { error: markedErrors.forbidden };
      }
      if (pending !== proposal) return { error: markedErrors.proposalNotFound };
      return {
        message: "Compartilhamento cancelado",
        payload: {
          resolution: resolve(proposal, "cancelled"),
          characterIds: proposalCharacterIds(proposal),
        },
      };
    } catch (error) {
      return failed("markedCancel", error);
    }
  };

  const stop: IMarkedController["stop"] = async (viewer, input) => {
    const parsed = markedStopSchema.safeParse(input);
    if (!parsed.success) return { error: markedErrors.invalidRequest };
    try {
      const share = await shares.findActive();
      if (!share || share.id !== parsed.data.shareId) return { error: markedErrors.shareNotFound };
      if (!(await canActFor(viewer, share.source.characterId))) {
        return { error: markedErrors.forbidden };
      }
      if (!(await shares.stop(share.id))) return { error: markedErrors.shareNotFound };
      const characterIds = [...new Set([share.source.characterId, ...(await markedIds())])];
      return { message: "Traço da Marca encerrado", payload: { characterIds } };
    } catch (error) {
      return failed("markedStop", error);
    }
  };

  const pendingFor: IMarkedController["pendingFor"] = async (viewer) => {
    const proposal = pending;
    if (!proposal || isExpired(proposal)) return null;
    if (viewer.role === "GM") return structuredClone(proposal);
    const access = await Promise.all(
      proposalCharacterIds(proposal).map((id) => characters.hasAccess(id, viewer.accountId)),
    );
    return access.includes(true) && pending === proposal ? structuredClone(proposal) : null;
  };

  const current: IMarkedController["current"] = async (viewer) => {
    try {
      const share = await shares.findActive();
      if (!share) return { message: "Sem traço da Marca", payload: null };
      if (viewer.role === "GM") return { message: "Traço da Marca", payload: share };
      const ids = await markedIds();
      const access = await Promise.all(ids.map((id) => characters.hasAccess(id, viewer.accountId)));
      return { message: "Traço da Marca", payload: access.includes(true) ? share : null };
    } catch (error) {
      return failed("markedCurrent", error);
    }
  };

  const expire: IMarkedController["expire"] = async (proposalId) => {
    const proposal = pending;
    if (!proposal || proposal.id !== proposalId) return null;
    const silent = proposal.targets.find((entry) => entry.status === "pending");
    return {
      resolution: resolve(proposal, "expired", silent?.name ?? null),
      characterIds: proposalCharacterIds(proposal),
    };
  };

  const release: IMarkedController["release"] = async (characterId) => {
    const proposal = pending;
    const involved = proposal ? proposalCharacterIds(proposal) : [];
    const resolution =
      proposal && involved.includes(characterId) ? resolve(proposal, "cancelled") : null;
    await shares.stopBySource(characterId);
    const marked = await markedIds();
    return {
      resolution,
      share: await shares.findActive(),
      characterIds: marked,
      involvedIds: involved,
      stillMarked: marked.includes(characterId),
    };
  };

  return { propose, answer, cancel, stop, current, pendingFor, expire, release };
}

/**
 * Wires the Marca controller to the database models; presence comes from the realtime layer.
 */
export function buildMarkedController(
  isAttended: IMarkedControllerDeps["isAttended"],
): IMarkedController {
  return createMarkedController({
    characters: characterModels,
    shares: markedShareModels,
    isAttended,
    createId: randomUUID,
    now: () => new Date(),
    timeoutMs: MARKED_ANSWER_TIMEOUT_MS,
  });
}
