"use client";

import { ACCOUNT_LOGIN_MAX_LENGTH } from "@magista/shared";

import { Button, Icon, Input } from "@/shared/components/atoms";
import { FormField, Modal, PasswordField } from "@/shared/components/molecules";

import { useAccountsDialog } from "./AccountsDialog.hook";
import type { AccountsDialogProps } from "./AccountsDialog.types";

export function AccountsDialog({ rows, onCreate, onClose }: AccountsDialogProps) {
  const {
    formId,
    login,
    password,
    error,
    pending,
    created,
    copied,
    onLoginChange,
    onPasswordChange,
    submit,
    copyCredentials,
    dismissCreated,
  } = useAccountsDialog({ onCreate });
  return (
    <Modal
      open
      onClose={onClose}
      title="Contas de jogador"
      description="Crie contas e depois libere fichas para elas pelo menu de cada ficha."
      size="md"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="grid gap-6">
        {created && (
          <section
            aria-labelledby={`${formId}-created`}
            className="grid gap-3 border border-teal-500/50 bg-teal-900/30 p-4"
          >
            <h3 id={`${formId}-created`} className="font-serif text-base text-foreground">
              Conta criada
            </h3>
            <p className="font-sans text-sm text-muted-strong">
              Anote ou copie a senha agora: ela não será mostrada de novo.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-sans text-sm">
              <dt className="text-muted-strong">Login</dt>
              <dd className="text-foreground">{created.account.login}</dd>
              <dt className="text-muted-strong">Senha</dt>
              <dd className="font-mono text-base tracking-wider text-foreground">
                {created.password}
              </dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyCredentials}
                icon={<Icon name={copied ? "check" : "copy"} size={14} />}
              >
                {copied ? "Copiado" : "Copiar login e senha"}
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissCreated}>
                Ok, anotei
              </Button>
            </div>
          </section>
        )}
        <form
          id={formId}
          noValidate
          onSubmit={submit}
          className="grid gap-4 border border-white/10 bg-black/30 p-4"
        >
          <h3 className="font-serif text-base text-foreground">Nova conta</h3>
          <FormField id={`${formId}-login`} label="Login" error={error ?? undefined}>
            <Input
              id={`${formId}-login`}
              value={login}
              maxLength={ACCOUNT_LOGIN_MAX_LENGTH}
              autoComplete="off"
              invalid={Boolean(error)}
              onChange={(event) => onLoginChange(event.target.value)}
            />
          </FormField>
          <FormField
            id={`${formId}-password`}
            label="Senha (opcional)"
            hint="Deixe em branco para gerar uma senha segura. Mínimo de 10 caracteres."
          >
            <PasswordField
              id={`${formId}-password`}
              value={password}
              autoComplete="new-password"
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </FormField>
          <div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={pending}
              icon={<Icon name="user-plus" size={14} />}
            >
              Criar conta
            </Button>
          </div>
        </form>
        <section aria-labelledby={`${formId}-list`} className="grid gap-2">
          <h3 id={`${formId}-list`} className="font-serif text-base text-foreground">
            Contas existentes
          </h3>
          <ul className="grid gap-1">
            {rows.map(({ account, isGm, countLabel }) => (
              <li
                key={account.id}
                className="flex min-h-11 items-center justify-between gap-3 border border-white/5 bg-black/30 px-3"
              >
                <span className="flex items-center gap-2 font-sans text-sm text-foreground">
                  <Icon
                    name={isGm ? "crown" : "users"}
                    size={14}
                    aria-hidden="true"
                    className={isGm ? "text-gold-300" : "text-teal-400"}
                  />
                  {account.login}
                </span>
                <span className="font-sans text-xs text-muted-strong">{countLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
