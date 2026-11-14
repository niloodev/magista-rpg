"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Detects whether text overflows its collapsed height and toggles full display.
 */
export function useExpandableText(collapsedHeight: number) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollHeight > collapsedHeight + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [collapsedHeight]);

  const toggle = () => setExpanded((current) => !current);

  return { contentRef, contentId, overflowing, expanded, toggle };
}
