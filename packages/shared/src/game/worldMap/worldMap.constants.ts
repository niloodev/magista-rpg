/**
 * The irregular edge of the fog brush, like the clouds at the edges of the map: the reach of the brush at each
 * cell is `radius * (1 + roughness * noise)`, with a smooth noise fixed on the map whose blobs are `scale` times
 * the radius (so a big brush and a small one draw the same kind of lobes). The noise depends only on the place, so
 * the server and the GM's screen paint exactly the same cells.
 */
export const WORLD_FOG_BRUSH_EDGE = {
  roughness: 0.5,
  scale: 0.85,
  detail: 0.42,
  detailWeight: 0.35,
} as const;
