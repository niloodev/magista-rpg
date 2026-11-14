export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type AvatarShape = "square" | "circle";

export interface AvatarProps {
  src: string | null;
  name: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  decorative?: boolean;
  className?: string;
}
