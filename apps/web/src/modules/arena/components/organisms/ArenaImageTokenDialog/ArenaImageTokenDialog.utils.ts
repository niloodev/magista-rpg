import { ARENA_TRANSPARENCY_PROBE_PX } from "@/modules/arena/arena.constants";
import { hasTransparentEdges } from "@/modules/arena/arena.utils";

/**
 * Reads an image on a small canvas and tells whether its border is transparent (a cut-out isometric figure);
 * false when the browser cannot decode it.
 */
export async function looksLikeFigure(file: File): Promise<boolean> {
  try {
    const side = ARENA_TRANSPARENCY_PROBE_PX;
    const bitmap = await createImageBitmap(file, { resizeWidth: side, resizeHeight: side });
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      bitmap.close();
      return false;
    }
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return hasTransparentEdges(context.getImageData(0, 0, side, side).data, side, side);
  } catch {
    return false;
  }
}
