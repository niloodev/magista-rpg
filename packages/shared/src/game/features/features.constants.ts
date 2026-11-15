import type { ISpecialFeature } from "./features.types";

export const FEATURE_KEYS = ["marked"] as const;

export const FEATURES_MAX = FEATURE_KEYS.length;

export const SPECIAL_FEATURES: Record<(typeof FEATURE_KEYS)[number], ISpecialFeature> = {
  marked: {
    key: "marked",
    label: "Marcado",
    description:
      "Mostra a seção Alma de Marcado, soma +2 em todos os testes de d20 e permite compartilhar traços com os outros Marcados.",
    d20Bonus: 2,
    bonusLabel: "Marca",
  },
};
