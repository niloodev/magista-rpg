import { Button, Icon } from "@/shared/components/atoms";

import { PING_LABELS } from "./PingButton.constants";
import type { PingButtonProps } from "./PingButton.types";

export function PingButton({ title, sent, onPing }: PingButtonProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPing}
        icon={<Icon name={sent ? "check" : "send"} size={14} />}
        aria-label={sent ? PING_LABELS.sentAria(title) : PING_LABELS.aria(title)}
        className={sent ? "text-teal-300!" : undefined}
      >
        <span className="grid whitespace-nowrap max-sm:sr-only">
          <span className={`col-start-1 row-start-1 ${sent ? "invisible" : ""}`}>
            {PING_LABELS.idle}
          </span>
          <span className={`col-start-1 row-start-1 ${sent ? "" : "invisible"}`}>
            {PING_LABELS.sent}
          </span>
        </span>
      </Button>
      <span role="status" className="sr-only">
        {sent ? PING_LABELS.sentAria(title) : ""}
      </span>
    </>
  );
}
