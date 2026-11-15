import type { IRollResult } from "@magista/shared";

export const SHEET_TABS_ID = "sheet";

export const SAVE_RECONCILE_ATTEMPTS = 1;

export const SAVE_CONFLICT_ERROR =
  "A ficha foi alterada em outro lugar enquanto você editava. Tente salvar de novo.";

export const SHEET_RETRY_LABEL = "Tentar de novo";

/** Rolls of a sheet in a panel (it has no rolls column or tab, so it does not follow the table rolls). */
export const NO_SHEET_ROLLS: IRollResult[] = [];
