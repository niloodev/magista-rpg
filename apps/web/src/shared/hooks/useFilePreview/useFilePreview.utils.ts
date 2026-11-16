import { FILE_PREVIEW_PX } from "./useFilePreview.constants";

/**
 * A small PNG data URL of an image file (at most `FILE_PREVIEW_PX` wide, transparency kept), so a preview
 * never decodes the full file; null when the browser cannot decode it.
 */
export async function filePreviewUrl(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: FILE_PREVIEW_PX,
      resizeQuality: "medium",
    });
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
