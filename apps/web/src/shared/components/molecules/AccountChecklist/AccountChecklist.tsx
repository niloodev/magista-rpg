"use client";

import { Checkbox, Input, Skeleton } from "@/shared/components/atoms";
import { SkeletonRegion } from "@/shared/components/molecules/SkeletonRegion";

import {
  ACCOUNT_CHECKLIST_TEXTS,
  ACCOUNT_SKELETON_SAMPLES,
  ROW_CLASS,
} from "./AccountChecklist.constants";
import { useAccountChecklist } from "./AccountChecklist.hook";
import type { AccountChecklistProps } from "./AccountChecklist.types";

/**
 * Account checkboxes with a search field (who may open a sheet, who sees a token status). While the accounts
 * load it keeps the same frame with placeholder rows.
 */
export function AccountChecklist({
  accounts,
  selected,
  onToggle,
  legend,
  emptyLabel,
  disabled = false,
  loadingRows,
}: AccountChecklistProps) {
  const { filter, setFilter, shown } = useAccountChecklist({ accounts });
  if (loadingRows !== undefined) {
    return (
      <SkeletonRegion label={legend} announce={false} className="grid gap-3">
        <div inert>
          <Input
            type="search"
            aria-label={ACCOUNT_CHECKLIST_TEXTS.filter}
            placeholder={ACCOUNT_CHECKLIST_TEXTS.filterPlaceholder}
            value=""
            readOnly
          />
        </div>
        <div className="grid gap-1">
          {Array.from({ length: loadingRows }, (_, index) => (
            <div key={index} className={ROW_CLASS}>
              <span className="inline-flex min-h-11 w-full items-center gap-2">
                <Skeleton shape="block" className="size-5 shrink-0" />
                <span className="font-sans text-xs font-semibold tracking-wider uppercase">
                  <Skeleton shape="glyphs">
                    {ACCOUNT_SKELETON_SAMPLES[index % ACCOUNT_SKELETON_SAMPLES.length]}
                  </Skeleton>
                </span>
              </span>
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  }
  return (
    <div className="grid gap-3">
      {accounts.length > 0 && (
        <Input
          type="search"
          aria-label={ACCOUNT_CHECKLIST_TEXTS.filter}
          placeholder={ACCOUNT_CHECKLIST_TEXTS.filterPlaceholder}
          value={filter}
          disabled={disabled}
          onChange={(event) => setFilter(event.target.value)}
        />
      )}
      <fieldset className="grid gap-1" disabled={disabled}>
        <legend className="sr-only">{legend}</legend>
        {shown.length === 0 && (
          <p className="py-3 font-sans text-sm text-muted-strong">
            {accounts.length === 0 ? emptyLabel : ACCOUNT_CHECKLIST_TEXTS.noMatch}
          </p>
        )}
        {shown.map((account) => (
          <div key={account.id} className={ROW_CLASS}>
            <Checkbox
              tone="teal"
              checked={selected.includes(account.id)}
              onCheckedChange={(checked) => onToggle(account.id, checked)}
              label={account.login}
              disabled={disabled}
              className="min-h-11 w-full"
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}
