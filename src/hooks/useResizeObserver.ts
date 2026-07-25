import { useEffect, useRef, useState } from "react";

export interface ObservedSize {
  width: number;
  height: number;
}

/**
 * Observes the border-box size of the returned ref's element and
 * returns it. Used by every widget that needs to redraw its D3
 * geometry (arc radius, needle length, bar scales, etc.) when the
 * container is resized — mobile, tablet, laptop, desktop, or a
 * consumer-resized card, all handled the same way.
 */
export function useResizeObserver<T extends Element>(enabled = true) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ObservedSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const box = entry.borderBoxSize?.[0];
      const width = box ? box.inlineSize : entry.contentRect.width;
      const height = box ? box.blockSize : entry.contentRect.height;
      setSize({ width, height });
    });

    ro.observe(el);
    // Seed immediately so first paint isn't 0x0 while waiting on the first callback.
    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => ro.disconnect();
  }, [enabled]);

  return { ref, size } as const;
}