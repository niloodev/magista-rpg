"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  AUTO_DRIFT_AMPLITUDE,
  AUTO_DRIFT_STEP,
  PARALLAX_LERP,
  PARALLAX_SPEEDS,
  REDUCED_MOTION_QUERY,
} from "./LoginBackground.constants";
import type { LayerRefSetter, ParallaxPoint } from "./LoginBackground.types";
import { toCursorLight, toLayerTransform } from "./LoginBackground.utils";

/**
 * Drives the login parallax: eases every layer toward the cursor, with an idle drift until the mouse moves.
 */
export function useLoginBackground() {
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const lightRef = useRef<HTMLDivElement | null>(null);

  const layerRef = useCallback(
    (index: number): LayerRefSetter =>
      (element) => {
        layers.current[index] = element;
      },
    [],
  );

  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const target: ParallaxPoint = { x: 0, y: 0 };
    const current: ParallaxPoint = { x: 0, y: 0 };
    let frame = 0;
    let autoTime = 0;
    let hasMouse = false;

    const tick = () => {
      autoTime += AUTO_DRIFT_STEP;
      if (!hasMouse) {
        target.x = Math.sin(autoTime) * AUTO_DRIFT_AMPLITUDE.x;
        target.y = Math.cos(autoTime * AUTO_DRIFT_AMPLITUDE.yFrequency) * AUTO_DRIFT_AMPLITUDE.y;
      }
      current.x += (target.x - current.x) * PARALLAX_LERP;
      current.y += (target.y - current.y) * PARALLAX_LERP;
      layers.current.forEach((element, index) => {
        const speed = PARALLAX_SPEEDS[index];
        if (element && speed !== undefined)
          element.style.transform = toLayerTransform(current, speed);
      });
      if (lightRef.current) lightRef.current.style.background = toCursorLight(current);
      frame = requestAnimationFrame(tick);
    };

    const onMouseMove = (event: MouseEvent) => {
      hasMouse = true;
      target.x = (event.clientX - window.innerWidth / 2) / window.innerWidth;
      target.y = (event.clientY - window.innerHeight / 2) / window.innerHeight;
    };

    window.addEventListener("mousemove", onMouseMove);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return { layerRef, lightRef };
}
