"use client";

import { ARENA_CHANGE_AMOUNT_MAX } from "@magista/shared";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  ARENA_CHANGE_MENU_HEIGHT,
  ARENA_CHANGE_MENU_WIDTH,
  ARENA_CHANGE_TEXTS,
  ARENA_EFFECT_CATALOG,
} from "@/modules/arena/arena.constants";
import { placeMenu } from "@/modules/arena/arena.utils";

import { ATTACKER_HINTS } from "./ArenaChangeMenu.constants";
import { barAnchor, keepFocusInside } from "./ArenaChangeMenu.utils";

import type { ArenaChangeMenuProps } from "./ArenaChangeMenu.types";

/**
 * State of "Aplicar mudança": the amount (starting from the last one used), where the menu sits, closing on Esc
 * or a click outside (not while the effect picker is open; focus goes back where it was) and applying with the
 * button or Enter. Shift keeps the menu open after applying.
 */
export function useArenaChangeMenu({
  anchor,
  preference,
  pending,
  suspended,
  attackers,
  attackerId,
  autoStyle,
  onApply,
  onClose,
}: Pick<
  ArenaChangeMenuProps,
  | "autoStyle"
  | "anchor"
  | "preference"
  | "pending"
  | "suspended"
  | "attackers"
  | "attackerId"
  | "onApply"
  | "onClose"
>) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState<number | null>(preference.amount);
  const [invalid, setInvalid] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const closeRef = useRef(onClose);
  const suspendedRef = useRef(suspended);

  useEffect(() => {
    closeRef.current = onClose;
    suspendedRef.current = suspended;
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const size = {
      width: root?.offsetWidth ?? ARENA_CHANGE_MENU_WIDTH,
      height: root?.offsetHeight ?? ARENA_CHANGE_MENU_HEIGHT,
    };
    const screen = { width: window.innerWidth, height: window.innerHeight };
    const bar = root?.parentElement?.getBoundingClientRect();
    const point = anchor ?? (bar ? barAnchor(bar, size) : null);
    if (point) setPosition(placeMenu(point, size, screen));
  }, [anchor]);

  const placed = position !== null;

  useEffect(() => {
    if (!placed) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [placed]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusAmount = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    focusAmount();
    const frame = requestAnimationFrame(focusAmount);
    const onPointerDown = (event: PointerEvent) => {
      if (suspendedRef.current) return;
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      closeRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown, true);
      if (previous && previous !== document.body && previous.isConnected) previous.focus();
    };
  }, []);

  const valid = amount !== null && amount >= 1 && amount <= ARENA_CHANGE_AMOUNT_MAX;

  const apply = async (keepOpen: boolean) => {
    if (pending) return;
    if (!valid || amount === null) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    const applied = await onApply(amount);
    if (applied && !keepOpen) onClose();
  };

  const onSubmit = (event: MouseEvent) => void apply(event.shiftKey);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (suspended) return;
    if (event.key === "Tab" && rootRef.current) {
      keepFocusInside(rootRef.current, event);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    const target = event.target;
    const typing = target === inputRef.current;
    const onChoice = target instanceof HTMLInputElement && target.type === "radio";
    if (event.key === "Enter" && (typing || onChoice)) {
      event.preventDefault();
      void apply(event.shiftKey);
    }
  };

  const onContextMenu = (event: MouseEvent) => event.preventDefault();

  const pick = (value: number) => {
    setAmount(value);
    setInvalid(false);
    inputRef.current?.focus();
  };

  const nudge = (delta: number) =>
    pick(Math.min(Math.max((amount ?? 0) + delta, 1), ARENA_CHANGE_AMOUNT_MAX));

  const attackerName = attackers.find((attacker) => attacker.id === attackerId)?.name;
  const style = preference.effect === "auto" ? autoStyle : preference.effect;
  const attack = ARENA_EFFECT_CATALOG[style].attack;

  return {
    titleId,
    rootRef,
    inputRef,
    amount,
    setAmount,
    invalid,
    pick,
    nudge,
    onSubmit,
    onKeyDown,
    onContextMenu,
    submitLabel: ARENA_CHANGE_TEXTS.submit(preference.kind, preference.resource, amount ?? 0),
    attackerHint: attackerName
      ? ATTACKER_HINTS[attack](attackerName)
      : ARENA_CHANGE_TEXTS.noAttackerHint,
    style: {
      left: position?.x ?? anchor?.x ?? 0,
      top: position?.y ?? anchor?.y ?? 0,
      visibility: position ? ("visible" as const) : ("hidden" as const),
    },
  };
}
