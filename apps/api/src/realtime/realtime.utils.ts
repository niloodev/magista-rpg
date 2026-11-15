import type { IRollPending, IRollResult } from "@magista/shared";

import {
  ARENA_DRAG_LIMIT,
  ARENA_DRAG_WINDOW_MS,
  ARENA_MOVE_LIMIT,
  ARENA_MOVE_WINDOW_MS,
  ROLL_BURST_LIMIT,
  ROLL_BURST_WINDOW_MS,
} from "./realtime.constants";

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
 * Per-account window for drag previews in the Arena, summing every socket of the account (extra previews are dropped).
 */
export const arenaDragGateFor = createGateRegistry(ARENA_DRAG_LIMIT, ARENA_DRAG_WINDOW_MS);

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
