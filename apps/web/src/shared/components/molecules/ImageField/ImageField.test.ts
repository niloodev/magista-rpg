import { describe, expect, it } from "vitest";

import { IMAGE_TOO_LARGE, IMAGE_WRONG_TYPE } from "./ImageField.constants";
import { imageFileError } from "./ImageField.utils";

const fileOf = (type: string, size: number) => new File([new Uint8Array(size)], "imagem", { type });

describe("imageFileError", () => {
  it("accepts supported images within the limit", () => {
    expect(imageFileError(fileOf("image/png", 10))).toBeNull();
    expect(imageFileError(fileOf("image/webp", 8 * 1024 * 1024))).toBeNull();
  });

  it("rejects other types and oversized files", () => {
    expect(imageFileError(fileOf("image/svg+xml", 10))).toBe(IMAGE_WRONG_TYPE);
    expect(imageFileError(fileOf("text/plain", 10))).toBe(IMAGE_WRONG_TYPE);
    expect(imageFileError(fileOf("image/jpeg", 8 * 1024 * 1024 + 1))).toBe(IMAGE_TOO_LARGE);
  });
});
