import { RefObject, useEffect, useRef, useState } from "react";

export interface ObservedSize {
  width: number;
  height: number;
}

export interface UseResizeObserverResult<T extends Element> {
  ref: RefObject<T | null>;
  size: ObservedSize;
}

export function useResizeObserver<T extends Element>(
  enabled = true
): UseResizeObserverResult<T> {
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

    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    return () => ro.disconnect();
  }, [enabled]);

  return { ref, size };
}