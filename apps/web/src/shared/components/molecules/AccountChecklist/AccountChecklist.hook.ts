"use client";

import { matchesSearch } from "@magista/shared";
import { useMemo, useState } from "react";

import type { AccountChecklistProps } from "./AccountChecklist.types";

/**
 * Filter of the account checklist.
 */
export function useAccountChecklist({ accounts }: Pick<AccountChecklistProps, "accounts">) {
  const [filter, setFilter] = useState("");
  const shown = useMemo(
    () => accounts.filter((account) => matchesSearch(account.login, filter)),
    [accounts, filter],
  );
  return { filter, setFilter, shown };
}
