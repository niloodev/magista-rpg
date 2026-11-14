import type { IFeedRowShape, IFeedShape } from "@/modules/table/table.types";

const SAMPLE_ROW: IFeedRowShape = { label: 16, chips: 1, modifier: 3, natural: 0 };

export const FEED_LOADING_LABEL = "Carregando rolagens...";

export const DEFAULT_FEED_SHAPE: IFeedShape = {
  count: 3,
  cards: [
    {
      name: 10,
      title: 16,
      subtitle: 3,
      byGm: false,
      critical: false,
      levelUp: false,
      rows: [SAMPLE_ROW],
      short: [6],
      long: [],
    },
    {
      name: 10,
      title: 16,
      subtitle: 3,
      byGm: false,
      critical: false,
      levelUp: false,
      rows: [SAMPLE_ROW, SAMPLE_ROW],
      short: [],
      long: [],
    },
    {
      name: 10,
      title: 16,
      subtitle: 3,
      byGm: false,
      critical: false,
      levelUp: false,
      rows: [SAMPLE_ROW],
      short: [6],
      long: [],
    },
  ],
};
