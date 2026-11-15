"use client";

import { Button, Icon } from "@/shared/components/atoms";

import { POPOUT_BUTTON_TEXT, POPOUT_ICON_CLASSES } from "./PopoutButton.constants";
import { usePopoutButton } from "./PopoutButton.hook";
import type { PopoutButtonProps } from "./PopoutButton.types";

export function PopoutButton({ target, label, variant = "icon" }: PopoutButtonProps) {
  const { onOpen } = usePopoutButton({ target });
  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpen}
        icon={<Icon name="picture-in-picture-2" size={14} />}
      >
        {POPOUT_BUTTON_TEXT}
      </Button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      title={POPOUT_BUTTON_TEXT}
      className={POPOUT_ICON_CLASSES}
    >
      <Icon name="picture-in-picture-2" size={17} aria-hidden="true" />
    </button>
  );
}
