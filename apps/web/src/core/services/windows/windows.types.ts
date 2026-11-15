import type { POPOUT_ROUTES } from "./windows.constants";

export type PopoutKind = keyof typeof POPOUT_ROUTES;

export interface IPopoutTarget {
  kind: PopoutKind;
  id: string;
}

export interface IPopoutHost {
  open: (url: string, target: string, features: string) => { focus: () => void } | null;
}
