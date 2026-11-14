import { AMBIENT_BLOBS } from "./AmbientGlow.constants";

export function AmbientGlow() {
  return (
    <>
      {AMBIENT_BLOBS.map((style, index) => (
        <div key={index} className="absolute lite:hidden" style={style} />
      ))}
    </>
  );
}
