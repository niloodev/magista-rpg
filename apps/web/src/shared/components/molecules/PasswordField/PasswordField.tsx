"use client";

import { Icon, Input } from "@/shared/components/atoms";

import { usePasswordField } from "./PasswordField.hook";
import type { PasswordFieldProps } from "./PasswordField.types";

export function PasswordField({ className, ...props }: PasswordFieldProps) {
  const { visible, toggleVisible } = usePasswordField();
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={`pr-11 ${className ?? ""}`}
        {...props}
      />
      <button
        type="button"
        onClick={toggleVisible}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[rgba(205,100,138,0.55)] opacity-70 transition-opacity duration-200 hover:opacity-100"
      >
        <Icon name={visible ? "eye-off" : "eye"} size={15} />
      </button>
    </div>
  );
}
