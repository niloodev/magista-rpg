import { decodeFogMask, paintFog, type IWorldFogStroke, type IWorldPoint } from "@magista/shared";

/** The fog to show: the server's, with the GM's brush batches not yet confirmed painted over it. */
export function shownFog(serverFog: string, pending: readonly IWorldFogStroke[]): Uint8Array {
  return pending.reduce(paintFog, decodeFogMask(serverFog));
}

/**
 * Adds a brush segment to the batch being gathered: the first segment brings both of its points, the next ones
 * only their end (their start is the last point already in the batch).
 */
export function appendStroke(
  batch: IWorldFogStroke | null,
  segment: IWorldFogStroke,
): IWorldFogStroke {
  if (!batch || batch.mode !== segment.mode || batch.radius !== segment.radius) {
    return { mode: segment.mode, radius: segment.radius, points: [...segment.points] };
  }
  const last = batch.points[batch.points.length - 1];
  const [first, ...rest] = segment.points;
  const continues = last && first && last.x === first.x && last.y === first.y;
  const added: IWorldPoint[] = continues ? rest : [...segment.points];
  return { ...batch, points: [...batch.points, ...added] };
}
