import { Button, Icon, Text } from "@/shared/components/atoms";

import { QUICK_LOGIN_COPY } from "./QuickLogin.constants";
import type { QuickLoginProps } from "./QuickLogin.types";

export function QuickLogin({ disabled, onGm, onPlayer }: QuickLoginProps) {
  return (
    <section aria-labelledby="quick-login-title" className="mt-6">
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-border/60" />
        <Text as="h2" id="quick-login-title" variant="hint" className="shrink-0">
          {QUICK_LOGIN_COPY.title}
        </Text>
        <span aria-hidden="true" className="h-px flex-1 bg-border/60" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onGm}
          icon={<Icon name="crown" size={14} />}
          className="whitespace-nowrap"
        >
          <span className="sr-only">{QUICK_LOGIN_COPY.prefix}</span>
          {QUICK_LOGIN_COPY.gm}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onPlayer}
          icon={<Icon name="user" size={14} />}
          className="whitespace-nowrap"
        >
          <span className="sr-only">{QUICK_LOGIN_COPY.prefix}</span>
          {QUICK_LOGIN_COPY.player}
        </Button>
      </div>
    </section>
  );
}
