import type { IMarkedProposal, IMarkedResolution } from "@magista/shared";

export interface IMarkedOutcome {
  resolution: IMarkedResolution;
  proposal: IMarkedProposal | null;
}

export interface IMarkedViewer {
  isGm: boolean;
  ownIds: readonly string[];
}

export type MarkedActionResult = { ok: true } | { ok: false; error: string };
