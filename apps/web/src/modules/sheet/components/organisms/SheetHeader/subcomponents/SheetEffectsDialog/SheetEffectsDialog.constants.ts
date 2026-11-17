import type { ISheetEffectSlot } from "./SheetEffectsDialog.types";

export const SHEET_EFFECT_SLOTS: ISheetEffectSlot[] = [
  { kind: "damage", resource: "health", label: "Dano na vida" },
  { kind: "heal", resource: "health", label: "Cura na vida" },
  { kind: "damage", resource: "sanity", label: "Dano na sanidade" },
  { kind: "heal", resource: "sanity", label: "Cura na sanidade" },
];

export const SHEET_EFFECTS_TEXTS = {
  button: "Animações",
  title: "Animações",
  description: (name: string) => `Efeitos de ${name} no Aplicar mudança.`,
  help: "Usadas quando esta ficha ataca ou cura com o efeito em Automático. Sem escolha, o Automático usa o padrão de cada ação.",
  standard: (name: string) => `Automático (${name})`,
  change: (label: string) => `Trocar efeito: ${label}`,
  changeShort: "Trocar",
  save: "Salvar animações",
  cancel: "Cancelar",
} as const;
