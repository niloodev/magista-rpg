"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { LOGIN_EMPTY_FIELDS, login } from "@/modules/auth/services";
import { useApp } from "@/modules/shell/store";

import { LOGIN_REDIRECT_PATH } from "./LoginPanel.constants";

/**
 * Holds the login form state and submits it to the auth service.
 */
export function useLoginPanel() {
  const router = useRouter();
  const setSession = useApp((state) => state.setSession);
  const [character, setCharacter] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onCharacterChange = (event: ChangeEvent<HTMLInputElement>) =>
    setCharacter(event.target.value);
  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!character.trim() || !password.trim()) {
      setError(LOGIN_EMPTY_FIELDS);
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await login({ login: character, password }, { setSession });
    if (result.ok) {
      router.replace(LOGIN_REDIRECT_PATH);
      return;
    }
    setError(result.error);
    setSubmitting(false);
  };

  return { character, password, error, submitting, onCharacterChange, onPasswordChange, onSubmit };
}
