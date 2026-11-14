"use client";

import { Button, Checkbox, Text } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules";

import { PROFILE_COPY } from "./ProfileDialog.constants";
import { useProfileDialog } from "./ProfileDialog.hook";
import type { ProfileDialogProps } from "./ProfileDialog.types";
import { ChangePasswordForm } from "./subcomponents";

export function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const { sectionId, login, roleLabel, performanceMode, onPerformanceChange, onPasswordChanged } =
    useProfileDialog();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={PROFILE_COPY.title}
      description={PROFILE_COPY.description}
      size="md"
      footer={
        <Button variant="ghost" size="sm" onClick={onClose} data-autofocus>
          {PROFILE_COPY.close}
        </Button>
      }
    >
      <div className="grid gap-6">
        <section
          aria-labelledby={`${sectionId}-account`}
          className="grid gap-3 border border-border/30 bg-black/40 p-4"
        >
          <h3
            id={`${sectionId}-account`}
            className="font-serif text-sm tracking-[0.15em] text-accent-text uppercase"
          >
            {PROFILE_COPY.account}
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-sans text-[15px]">
            <dt className="text-muted-strong">{PROFILE_COPY.login}</dt>
            <dd className="min-w-0 break-words text-foreground">{login}</dd>
            <dt className="text-muted-strong">{PROFILE_COPY.role}</dt>
            <dd className="text-foreground">{roleLabel}</dd>
          </dl>
        </section>
        <section className="border border-border/30 bg-black/40 p-4">
          <ChangePasswordForm onChanged={onPasswordChanged} />
        </section>
        <section
          aria-labelledby={`${sectionId}-performance`}
          className="grid gap-2 border border-border/30 bg-black/40 p-4"
        >
          <h3
            id={`${sectionId}-performance`}
            className="font-serif text-sm tracking-[0.15em] text-accent-text uppercase"
          >
            {PROFILE_COPY.performance}
          </h3>
          <Checkbox
            checked={performanceMode}
            onCheckedChange={onPerformanceChange}
            label={PROFILE_COPY.performanceLabel}
            aria-describedby={`${sectionId}-performance-hint`}
          />
          <Text id={`${sectionId}-performance-hint`} variant="body">
            {PROFILE_COPY.performanceHint}
          </Text>
        </section>
      </div>
    </Modal>
  );
}
