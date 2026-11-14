"use client";

import type { ICreatedAccount } from "@magista/shared";
import { useEffect, useId, useState, type FormEvent } from "react";

import { COPY_FEEDBACK_MS } from "./AccountsDialog.constants";
import type { AccountsDialogProps } from "./AccountsDialog.types";

/**
 * New account form plus the one-time display of the created credentials (with copy to clipboard).
 */
export function useAccountsDialog({ onCreate }: Pick<AccountsDialogProps, "onCreate">) {
  const formId = useId();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<ICreatedAccount | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await onCreate({ login: login.trim(), password: password || undefined });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setCreated(result.created);
    setLogin("");
    setPassword("");
    setError(null);
  };

  const copyCredentials = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(
        `Login: ${created.account.login}\nSenha: ${created.password}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return {
    formId,
    login,
    password,
    error,
    pending,
    created,
    copied,
    onLoginChange: (value: string) => {
      setLogin(value);
      setError(null);
    },
    onPasswordChange: (value: string) => {
      setPassword(value);
      setError(null);
    },
    submit,
    copyCredentials,
    dismissCreated: () => setCreated(null),
  };
}
