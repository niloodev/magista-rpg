import Image from "next/image";

import { AVATAR_SHAPES, AVATAR_SIZES } from "./Avatar.constants";
import type { AvatarProps } from "./Avatar.types";

export function Avatar({
  src,
  name,
  size = "md",
  shape = "circle",
  decorative = false,
  className,
}: AvatarProps) {
  const { box, pixels, text } = AVATAR_SIZES[size];
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${box} ${AVATAR_SHAPES[shape]} ${className ?? ""}`}
    >
      {src ? (
        <Image
          src={src}
          alt={decorative ? "" : name}
          width={pixels}
          height={pixels}
          unoptimized
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden={decorative}
          className={`flex h-full w-full items-center justify-center font-serif text-accent-text ${text}`}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
