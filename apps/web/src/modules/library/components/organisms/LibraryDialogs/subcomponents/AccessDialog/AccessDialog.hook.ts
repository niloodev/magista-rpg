"use client";

import { matchesSearch } from "@magista/shared";
import { useId, useMemo, useState, type FormEvent } from "react";

import type { AccessDialogProps } from "./AccessDialog.types";

/**
 * Selection, filter and submit state of the access dialog (which player accounts open a character).
 */
export function useAccessDialog({
  accounts,
  initialAccountIds,
  onSubmit,
}: Pick<AccessDialogProps, "accounts" | "initialAccountIds" | "onSubmit">) {
  const formId = useId();
  const [selected, setSelected] = useState<string[]>(initialAccountIds);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const players = useMemo(
    () =>
      accounts
        .filter((account) => account.role === "PLAYER")
        .filter((account) => matchesSearch(account.login, filter)),
    [accounts, filter],
  );

  const toggle = (accountId: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, accountId] : current.filter((id) => id !== accountId),
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const failure = await onSubmit(selected);
    setPending(false);
    if (failure) setError(failure);
  };

  const selectionLabel =
    selected.length === 0
      ? "Nenhum jogador terá acesso (só o Mestre)."
      : `${selected.length} ${selected.length === 1 ? "conta selecionada" : "contas selecionadas"}.`;

  return {
    formId,
    players,
    selected,
    selectionLabel,
    filter,
    setFilter,
    toggle,
    error,
    pending,
    submit,
  };
}
