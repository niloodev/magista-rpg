import { memo } from "react";

import { Avatar } from "@/shared/components/atoms";

import {
  ARENA_TRAY_BUTTON_CLASSES,
  ARENA_TRAY_CLASSES,
  ARENA_TRAY_HOVER_CLASSES,
  ARENA_TRAY_LIST_CLASSES,
  ARENA_TRAY_SELECTED_CLASSES,
  ARENA_TRAY_TONE_CLASSES,
} from "./ArenaTokenTray.constants";
import type { ArenaTokenTrayProps } from "./ArenaTokenTray.types";

/**
 * Portraits of the tokens the viewer controls: picking one selects it and centers the camera on it, which is
 * also the keyboard way into the board (then the arrows move it).
 */
export const ArenaTokenTray = memo(function ArenaTokenTray({
  label,
  tokens,
  selectedId,
  onPick,
  className,
}: ArenaTokenTrayProps) {
  return (
    <nav aria-label={label} className={`${ARENA_TRAY_CLASSES} ${className ?? ""}`}>
      <ul className={ARENA_TRAY_LIST_CLASSES}>
        {tokens.map((token) => {
          const selected = token.id === selectedId;
          return (
            <li key={token.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onPick(token.id)}
                aria-pressed={selected}
                title={token.name}
                className={`${ARENA_TRAY_BUTTON_CLASSES} ${selected ? ARENA_TRAY_SELECTED_CLASSES : ARENA_TRAY_HOVER_CLASSES} ${token.hidden ? "opacity-50" : ""}`}
              >
                <Avatar
                  src={token.imageUrl}
                  name={token.name}
                  size="xs"
                  decorative
                  className={`!h-9 !w-9 ${ARENA_TRAY_TONE_CLASSES[token.tone]}`}
                />
                <span className="sr-only">{token.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
