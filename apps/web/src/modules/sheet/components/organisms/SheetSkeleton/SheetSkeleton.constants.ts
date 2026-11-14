import { createEmptySheet } from "@magista/shared";

import type { ResourceTone, RollBarTone } from "@/modules/sheet/components/molecules";

export const SHEET_SKELETON_LABEL = "Carregando ficha...";

export const SHEET_SKELETON_TITLE = "Ficha do jogador";

export const HEADER_FACT_LABELS = ["Classe", "Nível", "Alinhamento", "Variação"] as const;

export const SUMMARY_STAT_LABELS = ["CA", "BP", "Desl."] as const;

export const RESOURCE_SKELETONS: { label: string; tone: ResourceTone }[] = [
  { label: "Vida", tone: "health" },
  { label: "Sanidade", tone: "sanity" },
];

export const ROLL_BAR_SKELETONS: { label: string; tone: RollBarTone }[] = [
  { label: "Iniciativa", tone: "ruby" },
  { label: "Dano Base", tone: "teal" },
  { label: "Dado de Vida", tone: "ruby" },
  { label: "Dado de Sanidade", tone: "teal" },
];

export const BLOCK_EXPRESSION_SAMPLE = "1d20 + 0";

export const SAMPLE_SHEET = createEmptySheet();
