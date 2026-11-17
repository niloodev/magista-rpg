import { GM_ROOM, TABLE_ROOM } from "@magista/shared";
import type {
  IArenaEffectEvent,
  IArenaStatusEvent,
  IArenaTokenRemovedEvent,
  IRollPending,
  IRollResult,
} from "@magista/shared";

import type {
  ArenaAudience,
  IArenaEffectDelivery,
  IArenaStatusDelivery,
  IArenaTokenChange,
  IArenaTokenRemoval,
} from "@/core/controllers/arena";

import {
  ARENA_MOVE_LIMIT,
  ARENA_MOVE_WINDOW_MS,
  ARENA_TURN_LIMIT,
  ARENA_TURN_WINDOW_MS,
  ROLL_BURST_LIMIT,
  ROLL_BURST_WINDOW_MS,
} from "./realtime.constants";
import type { IArenaTokenBatches } from "./realtime.types";

/**
 * Room that holds every socket of one account, used to force logout.
 */
export function accountRoom(accountId: string): string {
  return `account:${accountId}`;
}

/**
 * Room that follows one character sheet (its owner's sockets).
 */
export function characterRoom(characterId: string): string {
  return `character:${characterId}`;
}

/**
 * Sliding-window gate: allows up to `limit` hits inside `windowMs`.
 */
export function createRateGate(limit: number, windowMs: number, now: () => number = Date.now) {
  let hits: number[] = [];
  return () => {
    const current = now();
    hits = hits.filter((time) => current - time < windowMs);
    if (hits.length >= limit) return false;
    hits.push(current);
    return true;
  };
}

/**
 * Keeps one sliding-window gate per key (account or socket), created on first use.
 */
export function createGateRegistry(limit: number, windowMs: number, now: () => number = Date.now) {
  const gates = new Map<string, () => boolean>();
  return (key: string): (() => boolean) => {
    const existing = gates.get(key);
    if (existing) return existing;
    const gate = createRateGate(limit, windowMs, now);
    gates.set(key, gate);
    return gate;
  };
}

/**
 * Per-account sliding window shared by every table action that reaches other players (rolls, pings, the Marca).
 */
export const gateFor = createGateRegistry(ROLL_BURST_LIMIT, ROLL_BURST_WINDOW_MS);

/**
 * Per-account window for final token moves in the Arena.
 */
export const arenaMoveGateFor = createGateRegistry(ARENA_MOVE_LIMIT, ARENA_MOVE_WINDOW_MS);

/**
 * Per-account window for damage and healing applied in the Arena (same pace as the rolls, its own budget).
 */
export const arenaChangeGateFor = createGateRegistry(ROLL_BURST_LIMIT, ROLL_BURST_WINDOW_MS);

/**
 * Per-account window for turn order commands (passing turns, editing the order).
 */
export const arenaTurnGateFor = createGateRegistry(ARENA_TURN_LIMIT, ARENA_TURN_WINDOW_MS);

/**
 * The leading items a rate gate lets through, one try per item; it stops at the first refusal.
 */
export function withinGate<T>(items: readonly T[], gate: () => boolean): T[] {
  const passed: T[] = [];
  for (const item of items) {
    if (!gate()) break;
    passed.push(item);
  }
  return passed;
}

/**
 * Token ids grouped by the character they roll (each sheet is read once).
 */
export function groupByCharacter(
  rolls: readonly { tokenId: string; characterId: string }[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const { characterId, tokenId } of rolls) {
    groups.set(characterId, [...(groups.get(characterId) ?? []), tokenId]);
  }
  return groups;
}

/** One `arena:status` emit: to some rooms, except others. */
export interface IArenaStatusEmit {
  to: string[];
  except: string[];
  event: IArenaStatusEvent;
}

/**
 * The emits that deliver token statuses: one per scene to the GM (with the permissions), and per visible token
 * one to the allowed rooms (sheet room, listed accounts, or the whole table when public) plus one that hides it
 * from who lost the permission without reaching it another way. Emits with the same rooms are merged into one
 * event, so an area change on public tokens reaches each player once.
 */
export function statusEmits(deliveries: IArenaStatusDelivery[]): IArenaStatusEmit[] {
  const grouped = new Map<string, IArenaStatusEmit>();
  const emit = (entry: IArenaStatusEmit) => {
    const key = `${entry.to.join(",")}|${entry.except.join(",")}|${entry.event.sceneId}`;
    const existing = grouped.get(key);
    if (existing) existing.event.entries.push(...entry.event.entries);
    else grouped.set(key, entry);
  };
  const emits = { push: emit };
  const byScene = new Map<string, IArenaStatusDelivery[]>();
  for (const delivery of deliveries) {
    byScene.set(delivery.sceneId, [...(byScene.get(delivery.sceneId) ?? []), delivery]);
  }
  for (const [sceneId, group] of byScene) {
    emits.push({
      to: [GM_ROOM],
      except: [],
      event: {
        sceneId,
        entries: group.map(({ tokenId, status, access }) => ({ tokenId, status, access })),
      },
    });
  }
  for (const delivery of deliveries) {
    if (!delivery.table) continue;
    const { sceneId, tokenId, status, access, characterId } = delivery;
    const allowed = access.public
      ? [TABLE_ROOM]
      : [
          ...(characterId ? [characterRoom(characterId)] : []),
          ...access.accountIds.map(accountRoom),
        ];
    if (allowed.length > 0) {
      emits.push({
        to: allowed,
        except: [GM_ROOM],
        event: { sceneId, entries: [{ tokenId, status }] },
      });
    }
    if (access.public) continue;
    const revoked = delivery.revokedPublic
      ? [TABLE_ROOM]
      : delivery.revokedAccountIds.map(accountRoom);
    if (revoked.length > 0) {
      emits.push({
        to: revoked,
        except: [GM_ROOM, ...allowed],
        event: { sceneId, entries: [{ tokenId, status: null }] },
      });
    }
  }
  return [...grouped.values()];
}

/**
 * Groups damage and healing animations into one `arena:effect` per room and scene.
 */
export function effectEmits(
  effects: IArenaEffectDelivery[],
): { audience: ArenaAudience; event: IArenaEffectEvent }[] {
  const groups = new Map<string, { audience: ArenaAudience; event: IArenaEffectEvent }>();
  for (const { audience, sceneId, ...effect } of effects) {
    const key = `${audience}|${sceneId}`;
    const group = groups.get(key) ?? { audience, event: { sceneId, effects: [] } };
    group.event.effects.push(effect);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/**
 * What the table may know about a roll before it is revealed: who rolls what, and when the result comes.
 */
export function pendingOf(roll: IRollResult, revealInMs: number, now = Date.now()): IRollPending {
  return {
    id: roll.id,
    kind: roll.kind,
    characterId: roll.characterId,
    characterName: roll.characterName,
    portraitUrl: roll.portraitUrl,
    rolledByGm: roll.rolledByGm,
    title: roll.title,
    subtitle: roll.subtitle,
    revealAt: new Date(now + revealInMs).toISOString(),
  };
}

/**
 * Splits token changes by who receives them, so every socket gets one event per batch: the players get the
 * tokens they may see (`players`), the GM gets every token (`gm`), and the players also learn which tokens left
 * their view (hidden).
 */
export function groupTokenChanges(changes: IArenaTokenChange[]): IArenaTokenBatches {
  const batches: IArenaTokenBatches = { players: [], gm: [], hiddenFromTable: [] };
  for (const { token, audience, previousAudience } of changes) {
    batches.gm.push(token);
    if (audience === "table") batches.players.push(token);
    if (audience === "gm" && previousAudience === "table")
      batches.hiddenFromTable.push({ id: token.id, sceneId: token.sceneId });
  }
  return batches;
}

/**
 * Splits token removals by who could see each token, so a batch delete becomes one event per room.
 */
export function groupTokenRemovals(
  removals: IArenaTokenRemoval[],
): Record<ArenaAudience, IArenaTokenRemovedEvent[]> {
  const groups: Record<ArenaAudience, IArenaTokenRemovedEvent[]> = { table: [], gm: [] };
  for (const { event, audience } of removals) groups[audience].push(event);
  return groups;
}
