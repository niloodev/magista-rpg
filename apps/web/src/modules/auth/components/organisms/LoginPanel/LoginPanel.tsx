"use client";

import Image from "next/image";

import { Button, Divider, Input, Text } from "@/shared/components/atoms";
import { FormField, Panel, PasswordField } from "@/shared/components/molecules";

import { LOGIN_COPY } from "./LoginPanel.constants";
import { useLoginPanel } from "./LoginPanel.hook";

export function LoginPanel() {
  const { character, password, error, submitting, onCharacterChange, onPasswordChange, onSubmit } =
    useLoginPanel();

  return (
    <Panel variant="glass" brackets className="w-full">
      <div className="relative z-10 px-9 pt-10 pb-8">
        <div className="-mt-2 flex justify-center">
          <Image
            src="/logo.webp"
            alt="Magista"
            width={220}
            height={220}
            priority
            className="animate-title-pulse h-[220px] w-[220px] object-contain select-none"
          />
        </div>

        <Divider label={LOGIN_COPY.ornament} className="mt-1 mb-7" />

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <FormField id="login-character" label={LOGIN_COPY.characterLabel}>
            <Input
              id="login-character"
              name="login"
              autoComplete="username"
              value={character}
              onChange={onCharacterChange}
              placeholder={LOGIN_COPY.characterPlaceholder}
              invalid={Boolean(error)}
            />
          </FormField>

          <FormField id="login-password" label={LOGIN_COPY.passwordLabel}>
            <PasswordField
              id="login-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={onPasswordChange}
              placeholder={LOGIN_COPY.passwordPlaceholder}
              invalid={Boolean(error)}
            />
          </FormField>

          {error && (
            <p role="alert" className="text-center font-sans text-xs tracking-[0.04em] text-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            shape="slant"
            block
            loading={submitting}
            loadingLabel={LOGIN_COPY.submitting}
            className="mt-1 py-3.5 text-xs"
          >
            {LOGIN_COPY.submit}
          </Button>
        </form>

        <Text variant="hint" className="mt-7 text-center">
          {LOGIN_COPY.footer[0]}
          <br />
          {LOGIN_COPY.footer[1]}
        </Text>
      </div>
    </Panel>
  );
}
