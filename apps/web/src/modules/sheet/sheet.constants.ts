import {
  type BlockKey,
  ALIGNMENTS,
  ALIGNMENT_KEYS,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
  CLASSES,
  CLASS_KEYS,
} from "@magista/shared";

import type { IconName } from "@/shared/components/atoms";
import type { TabItem } from "@/shared/components/molecules";

import type { SaveStatus, SheetTab } from "./sheet.types";

export const AUTOSAVE_DEBOUNCE_MS = 700;

export const NO_VALUE = "-";

export const CLASS_OPTIONS = CLASS_KEYS.map((key) => ({ value: key, label: CLASSES[key].name }));

export const ALIGNMENT_GROUPS = [
  {
    label: "Alinhamentos",
    options: ALIGNMENT_KEYS.filter((key) => ALIGNMENTS[key].group === "alignment").map((key) => ({
      value: key,
      label: ALIGNMENTS[key].name,
    })),
  },
  {
    label: "Caminhos do Meio",
    options: ALIGNMENT_KEYS.filter((key) => ALIGNMENTS[key].group === "path").map((key) => ({
      value: key,
      label: ALIGNMENTS[key].name,
    })),
  },
];

export const ATTRIBUTE_OPTIONS = [
  { value: NO_VALUE, label: "-" },
  ...ATTRIBUTE_KEYS.map((key) => ({ value: key, label: ATTRIBUTE_LABELS[key].short })),
];

export const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  idle: "",
  pending: "Alterações pendentes",
  saving: "Salvando...",
  saved: "Salvo",
  error: "Erro ao salvar",
};

export const SHEET_TABS: TabItem<SheetTab>[] = [
  { key: "geral", label: "Ficha", icon: "shield" },
  { key: "habilidades", label: "Habilidades", icon: "sword" },
  { key: "inventario", label: "Inventário", icon: "package-search" },
  { key: "tracos", label: "Traços", icon: "type" },
  { key: "rolagens", label: "Rolagens", icon: "dices", className: "xl:hidden" },
];

export const BLOCK_ICONS: Record<BlockKey, IconName> = {
  firme: "shield",
  desviante: "zap",
  agressivo: "flame",
};

export const OPENING_PIPS = 4;

export const SHEET_ART_HINT_KEY = "a";
