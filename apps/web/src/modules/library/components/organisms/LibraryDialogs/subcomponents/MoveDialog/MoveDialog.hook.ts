"use client";

import { useId, useState, type FormEvent } from "react";

import { ROOT_OPTION_VALUE } from "../NameDialog/NameDialog.constants";
import type { MoveDialogProps } from "./MoveDialog.types";

/**
 * Destination state of the "Mover para..." dialog (keyboard friendly alternative to drag and drop).
 */
export function useMoveDialog({
  currentParentId,
  onSubmit,
}: Pick<MoveDialogProps, "currentParentId" | "onSubmit">) {
  const formId = useId();
  const [target, setTarget] = useState(currentParentId ?? ROOT_OPTION_VALUE);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const failure = await onSubmit(target === ROOT_OPTION_VALUE ? null : target);
    setPending(false);
    if (failure) setError(failure);
  };

  return { formId, target, setTarget, error, pending, submit };
}
