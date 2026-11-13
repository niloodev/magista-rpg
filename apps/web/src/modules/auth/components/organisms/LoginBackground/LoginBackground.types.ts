export interface ParallaxPoint {
  x: number;
  y: number;
}

export type LayerRefSetter = (element: HTMLDivElement | null) => void;
