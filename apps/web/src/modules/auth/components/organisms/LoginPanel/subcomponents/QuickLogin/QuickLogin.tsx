import { Button, Text } from "@/shared/components/atoms";

import { QUICK_LOGIN_COPY } from "./QuickLogin.constants";
import type { QuickLoginProps } from "./QuickLogin.types";

export function QuickLogin({ disabled, onGm, onPlayer }: QuickLoginProps) {
  return (
    <section aria-labelledby="quick-login-title" className="mt-6 border-t border-border/40 pt-5">
      <Text as="h2" id="quick-login-title" variant="hint" className="mb-3 text-center">
        {QUICK_LOGIN_COPY.title}
      </Text>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={onGm}>
          {QUICK_LOGIN_COPY.gm}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onPlayer}>
          {QUICK_LOGIN_COPY.player}
        </Button>
      </div>
    </section>
  );
}
