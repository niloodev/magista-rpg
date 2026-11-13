import { FLOAT_PIECES, FLOAT_PIECE_SHADOW } from "./FloatingShards.constants";

export function FloatingShards() {
  return (
    <>
      {FLOAT_PIECES.map((piece) => (
        <div
          key={piece.animation}
          className="absolute"
          style={{
            width: piece.w,
            height: piece.h,
            top: `${piece.top}%`,
            left: `${piece.left}%`,
            clipPath: piece.clip,
            background: piece.bg,
            boxShadow: FLOAT_PIECE_SHADOW,
            animation: piece.animation,
          }}
        />
      ))}
    </>
  );
}
