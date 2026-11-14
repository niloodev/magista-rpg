import { describe, expect, it } from "vitest";

import { skeletonSample } from "./Skeleton.utils";

describe("skeletonSample", () => {
  it("gera texto com o tamanho pedido, sem espaço nas pontas", () => {
    for (const length of [1, 5, 12, 38, 39, 60]) {
      const sample = skeletonSample(length);
      expect(sample).toHaveLength(length);
      expect(sample).toBe(sample.trim());
    }
  });

  it("limita tamanhos inválidos ou enormes", () => {
    expect(skeletonSample(0)).toHaveLength(1);
    expect(skeletonSample(Number.NaN)).toHaveLength(1);
    expect(skeletonSample(500)).toHaveLength(60);
  });
});
