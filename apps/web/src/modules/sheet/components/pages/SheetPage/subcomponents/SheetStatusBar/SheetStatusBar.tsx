import Link from "next/link";

import { SAVE_STATUS_LABELS } from "@/modules/sheet/sheet.constants";
import { Icon } from "@/shared/components/atoms";

import { CONNECTION_LABELS } from "./SheetStatusBar.constants";
import type { SheetStatusBarProps } from "./SheetStatusBar.types";

export function SheetStatusBar({
  saveStatus,
  saveError,
  connection,
  rollError,
  onRetrySave,
}: SheetStatusBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-muted-strong">
      <Link
        href="/mesa"
        className="flex min-h-9 items-center gap-1.5 transition-colors hover:text-accent-text"
      >
        <Icon name="arrow-left" size={16} /> Voltar para a mesa
      </Link>
      <span className="flex items-center gap-2" aria-live="polite">
        <span className={`h-2 w-2 rounded-full ${CONNECTION_LABELS[connection].dot}`} />
        {CONNECTION_LABELS[connection].label}
      </span>
      <span aria-live="polite" className={saveStatus === "error" ? "text-error" : ""}>
        {saveStatus === "error"
          ? (saveError ?? SAVE_STATUS_LABELS.error)
          : SAVE_STATUS_LABELS[saveStatus]}
        {saveStatus === "error" && (
          <button
            type="button"
            onClick={onRetrySave}
            className="ml-2 cursor-pointer text-accent-text underline"
          >
            Tentar de novo
          </button>
        )}
      </span>
      {rollError && (
        <span role="alert" className="text-error">
          {rollError}
        </span>
      )}
    </div>
  );
}
