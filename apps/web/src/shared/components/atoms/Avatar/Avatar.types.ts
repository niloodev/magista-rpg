export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/** `figure`: an isometric token, drawn whole without a frame. */
export type AvatarShape = "square" | "circle" | "figure";

export interface AvatarProps {
  src: string | null;
  name: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  decorative?: boolean;
  className?: string;
}
