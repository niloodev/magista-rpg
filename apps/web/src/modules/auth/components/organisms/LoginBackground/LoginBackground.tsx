"use client";

import { useLoginBackground } from "./LoginBackground.hook";
import {
  AmbientGlow,
  Cathedral,
  CursorLight,
  FloatingShards,
  Shards,
  Vignette,
} from "./subcomponents";

export function LoginBackground() {
  const { layerRef, lightRef } = useLoginBackground();
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div ref={layerRef(0)} className="absolute inset-0 z-[1] will-change-transform">
        <AmbientGlow />
      </div>
      <CursorLight ref={lightRef} />
      <div ref={layerRef(1)} className="absolute -inset-[60px] z-[3] will-change-transform">
        <Cathedral />
      </div>
      <div ref={layerRef(2)} className="absolute -inset-[50px] z-[4] will-change-transform">
        <Shards />
      </div>
      <div ref={layerRef(3)} className="absolute inset-0 z-[5] will-change-transform">
        <FloatingShards />
      </div>
      <Vignette />
    </div>
  );
}
