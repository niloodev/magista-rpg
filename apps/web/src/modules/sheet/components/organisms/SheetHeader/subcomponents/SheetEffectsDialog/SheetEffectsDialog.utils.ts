import type {
  ArenaChangeKind,
  ArenaEffectStyle,
  ArenaResourceKey,
  ISheetEffects,
} from "@magista/shared";

/**
 * The sheet animations with one slot set (a style) or back to the default (`auto`), dropping empty groups.
 */
export function withSheetEffect(
  effects: ISheetEffects,
  kind: ArenaChangeKind,
  resource: ArenaResourceKey,
  choice: ArenaEffectStyle | "auto",
): ISheetEffects {
  const group = { ...effects[kind] };
  if (choice === "auto") delete group[resource];
  else group[resource] = choice;
  const next: ISheetEffects = { ...effects };
  if (Object.keys(group).length > 0) next[kind] = group;
  else delete next[kind];
  return next;
}
